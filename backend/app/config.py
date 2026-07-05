from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AI Trading Journal API"
    app_env: str = "development"
    database_url: str = "sqlite:///./trading_journal.db"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    ai_provider: str = "groq"
    ai_api_key: str = ""
    ai_base_url: str = "https://api.groq.com/openai/v1"
    ai_model: str = "llama-3.3-70b-versatile"
    ai_timeout_seconds: float = 30.0
    ai_max_output_tokens: int = 800

    cognee_enabled: bool = True
    cognee_dataset_name: str = "trading_journal_memory"
    cognee_session_id: str = "default_trader"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.cors_origins.split(",")
            if origin.strip()
        ]


settings = Settings()
