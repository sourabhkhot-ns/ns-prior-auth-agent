from __future__ import annotations

import asyncio
import json
import logging
import re
import litellm
from app.config import settings

logger = logging.getLogger(__name__)

litellm.suppress_debug_info = True

MAX_RETRIES = 3
RETRY_DELAY = 5  # seconds
LLM_TIMEOUT = 60  # seconds per LLM call


async def llm_call(
    system_prompt: str,
    user_prompt: str,
    response_format: dict | None = None,
) -> str:
    """Make an LLM call via LiteLLM with retry on rate limits and timeout."""
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]

    kwargs: dict = {
        "model": settings.llm_model,
        "messages": messages,
        "temperature": settings.llm_temperature,
        "timeout": LLM_TIMEOUT,
    }

    if response_format:
        kwargs["response_format"] = response_format

    for attempt in range(MAX_RETRIES):
        try:
            response = await asyncio.wait_for(
                litellm.acompletion(**kwargs),
                timeout=LLM_TIMEOUT,
            )
            content = response.choices[0].message.content
            logger.debug("LLM response (first 200 chars): %s", content[:200] if content else "EMPTY")
            return content or ""
        except asyncio.TimeoutError:
            logger.error("LLM call timed out after %ds (attempt %d/%d)", LLM_TIMEOUT, attempt + 1, MAX_RETRIES)
            if attempt >= MAX_RETRIES - 1:
                raise RuntimeError(f"LLM call timed out after {LLM_TIMEOUT}s")
        except litellm.RateLimitError:
            delay = RETRY_DELAY * (attempt + 1)
            logger.warning("Rate limited, retrying in %ds (attempt %d/%d)", delay, attempt + 1, MAX_RETRIES)
            await asyncio.sleep(delay)
        except Exception as e:
            logger.error("LLM call failed (attempt %d/%d): %s", attempt + 1, MAX_RETRIES, e)
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
) -> dict:
    """Make an LLM call and parse the response as JSON."""
    # Try with response_format first
    try:
        response = await llm_call(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            response_format={"type": "json_object"},
        )
        return _extract_json(response)
    except Exception as e:
        logger.warning("JSON mode failed (%s), retrying without response_format", e)

    # Fallback: no response_format, add explicit JSON instruction
    response = await llm_call(
        system_prompt=system_prompt + "\n\nYou MUST respond with valid JSON only. No markdown, no explanation, just the JSON object.",
        user_prompt=user_prompt,
    )
    return _extract_json(response)
