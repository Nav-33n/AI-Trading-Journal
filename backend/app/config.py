from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AI Trading Journal API"
    app_env: str = "development"
    database_url: str = "sqlite:///./trading_journal.db"

    ai_provider: str = "groq"
    ai_api_key: str = ""
    ai_base_url: str = "https://api.groq.com/openai/v1"
    ai_model: str = "openai/gpt-oss-20b"
    ai_timeout_seconds: float = 30.0
    ai_max_output_tokens: int = 800

    cognee_enabled: bool = True
    cognee_dataset_name: str = "trading_journal_memory"
    cognee_session_id: str = "default_trader"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
