from __future__ import annotations

import asyncio
import contextvars
import json
import logging
import re
import time
import litellm
from app.config import settings

logger = logging.getLogger(__name__)
usage_logger = logging.getLogger("app.llm.usage")

# Per-evaluation usage accumulator. Set by start_usage_tracking() at the top of a
# pipeline; each llm_call appends an entry; end_usage_tracking() emits the summary.
# asyncio.create_task copies the current context, so parallel agents all write here.
_usage_ctx: contextvars.ContextVar[list | None] = contextvars.ContextVar("llm_usage", default=None)


def start_usage_tracking() -> None:
    """Begin accumulating LLM usage for the current evaluation."""
    _usage_ctx.set([])


def end_usage_tracking(eval_tag: str = "") -> None:
    """Emit a summary of all LLM calls accumulated since start_usage_tracking()."""
    entries = _usage_ctx.get()
    if entries is None:
        return

    total_prompt = sum(e["prompt"] for e in entries)
    total_completion = sum(e["completion"] for e in entries)
    total_cached = sum(e["cached"] for e in entries)
    total_cost = sum(e["cost"] for e in entries if e["cost"] is not None)
    total_latency = sum(e["latency_ms"] for e in entries)
    has_any_cost = any(e["cost"] is not None for e in entries)

    per_agent: dict[str, dict] = {}
    for e in entries:
        a = per_agent.setdefault(e["tag"] or "-", {"calls": 0, "prompt": 0, "completion": 0, "cost": 0.0, "latency_ms": 0, "has_cost": False})
        a["calls"] += 1
        a["prompt"] += e["prompt"]
        a["completion"] += e["completion"]
        a["latency_ms"] += e["latency_ms"]
        if e["cost"] is not None:
            a["cost"] += e["cost"]
            a["has_cost"] = True

    cost_str = f"${total_cost:.6f}" if has_any_cost else "n/a"
    prefix = f"[{eval_tag}] " if eval_tag else ""

    usage_logger.info(
        "%sSUMMARY calls=%d tokens=%d→%d (cached=%d) cost=%s wall_llm=%dms",
        prefix, len(entries), total_prompt, total_completion, total_cached,
        cost_str, total_latency,
    )
    for agent, a in per_agent.items():
        a_cost = f"${a['cost']:.6f}" if a["has_cost"] else "n/a"
        usage_logger.info(
            "%s  └─ %-20s calls=%d tokens=%d→%d cost=%s latency=%dms",
            prefix, agent, a["calls"], a["prompt"], a["completion"], a_cost, a["latency_ms"],
        )

    _usage_ctx.set(None)

litellm.suppress_debug_info = True

MAX_RETRIES = 3
RETRY_DELAY = 20  # seconds — Groq free tier resets per minute
LLM_TIMEOUT = 120  # seconds per LLM call (local MLX models can be slower)
MAX_OUTPUT_TOKENS = 4096


def _is_qwen_reasoning(model: str) -> bool:
    m = model.lower()
    return "qwen3" in m or "qwen-3" in m


def _log_usage(tag: str, model: str, response, latency_ms: int) -> None:
    """Emit a single structured line with token counts, cost, and latency.
    Also appends the metrics to the per-evaluation accumulator if tracking is active.
    """
    usage = getattr(response, "usage", None)
    prompt_tok = getattr(usage, "prompt_tokens", 0) if usage else 0
    completion_tok = getattr(usage, "completion_tokens", 0) if usage else 0
    total_tok = getattr(usage, "total_tokens", prompt_tok + completion_tok) if usage else 0

    cached_tok = 0
    details = getattr(usage, "prompt_tokens_details", None) if usage else None
    if details is not None:
        cached_tok = getattr(details, "cached_tokens", 0) or 0

    finish_reason = ""
    try:
        finish_reason = response.choices[0].finish_reason or ""
    except (AttributeError, IndexError):
        pass

    cost_val = None
    try:
        c = litellm.completion_cost(completion_response=response)
        if c is not None:
            cost_val = float(c)
    except Exception:
        # Unknown-cost models (local MLX, custom endpoints) — skip silently
        pass

    cost_str = f"${cost_val:.6f}" if cost_val is not None else "n/a"
    label = f"[{tag}] " if tag else ""
    usage_logger.info(
        "%smodel=%s tokens=%d→%d (cached=%d, total=%d) cost=%s latency=%dms finish=%s",
        label, model, prompt_tok, completion_tok, cached_tok, total_tok,
        cost_str, latency_ms, finish_reason,
    )

    acc = _usage_ctx.get()
    if acc is not None:
        acc.append({
            "tag": tag,
            "prompt": prompt_tok,
            "completion": completion_tok,
            "cached": cached_tok,
            "cost": cost_val,
            "latency_ms": latency_ms,
        })


async def llm_call(
    system_prompt: str,
    user_prompt: str,
    response_format: dict | None = None,
    tag: str = "",
) -> str:
    """Make an LLM call via LiteLLM with retry, timeout, and per-call usage logging."""
    # Disable Qwen3's <think> reasoning — otherwise long prompts burn all output tokens
    # on reasoning and leave empty content.
    if _is_qwen_reasoning(settings.llm_model):
        system_prompt = f"/no_think\n\n{system_prompt}"

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]

    kwargs: dict = {
        "model": settings.llm_model,
        "messages": messages,
        "temperature": settings.llm_temperature,
        "timeout": LLM_TIMEOUT,
        "max_tokens": MAX_OUTPUT_TOKENS,
    }

    if settings.llm_api_base:
        kwargs["api_base"] = settings.llm_api_base

    if response_format:
        kwargs["response_format"] = response_format

    for attempt in range(MAX_RETRIES):
        t0 = time.monotonic()
        try:
            response = await asyncio.wait_for(
                litellm.acompletion(**kwargs),
                timeout=LLM_TIMEOUT,
            )
            latency_ms = int((time.monotonic() - t0) * 1000)
            _log_usage(tag, settings.llm_model, response, latency_ms)

            content = response.choices[0].message.content
            logger.debug("LLM response (first 200 chars): %s", content[:200] if content else "EMPTY")
            return content or ""
        except asyncio.TimeoutError:
            logger.error("[%s] LLM call timed out after %ds (attempt %d/%d)",
                         tag or "-", LLM_TIMEOUT, attempt + 1, MAX_RETRIES)
            if attempt >= MAX_RETRIES - 1:
                raise RuntimeError(f"LLM call timed out after {LLM_TIMEOUT}s")
        except litellm.RateLimitError:
            delay = RETRY_DELAY * (attempt + 1)
            logger.warning("[%s] Rate limited, retrying in %ds (attempt %d/%d)",
                           tag or "-", delay, attempt + 1, MAX_RETRIES)
            await asyncio.sleep(delay)
        except Exception as e:
            logger.error("[%s] LLM call failed (attempt %d/%d): %s",
                         tag or "-", attempt + 1, MAX_RETRIES, e)
            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(RETRY_DELAY)
            else:
                raise

    raise RuntimeError("Max retries exceeded for LLM call")


def _extract_json(text: str) -> dict:
    """Extract JSON from LLM response, handling markdown code blocks."""
    text = text.strip()

    # Try direct parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Try extracting from markdown code block
    match = re.search(r"```(?:json)?\s*\n?(.*?)\n?\s*```", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except json.JSONDecodeError:
            pass

    # Try finding first { to last }
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(text[start:end + 1])
        except json.JSONDecodeError:
            pass

    raise ValueError(f"Could not parse JSON from LLM response: {text[:500]}")


async def llm_call_json(
    system_prompt: str,
    user_prompt: str,
    tag: str = "",
) -> dict:
    """Make an LLM call and parse the response as JSON. Single attempt — no fallback doubling."""
    response = await llm_call(
        system_prompt=system_prompt + "\n\nYou MUST respond with valid JSON only. No markdown, no explanation, just the JSON object.",
        user_prompt=user_prompt,
        response_format={"type": "json_object"},
        tag=tag,
    )
    return _extract_json(response)
