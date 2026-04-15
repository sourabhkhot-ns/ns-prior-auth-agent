from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    llm_model: str = "anthropic/claude-sonnet-4-20250514"
    llm_temperature: float = 0.1
    database_url: str = "sqlite+aiosqlite:///./prior_auth.db"
    log_level: str = "INFO"
    app_host: str = "0.0.0.0"
    app_port: int = 8000

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()
