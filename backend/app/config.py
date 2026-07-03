from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AI Trading Journal API"
    app_env: str = "development"
    database_url: str = "sqlite:///./trading_journal.db"

    ai_provider: str = "groq"
    ai_api_key: str = ""
    ai_model: str = "llama-3.3-70b-versatile"

    cognee_enabled: bool = True
    cognee_dataset_name: str = "trading_journal_memory"
    cognee_session_id: str = "default_trader"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
