"""Environment-backed application settings.

All secrets and deployment-specific values enter the process through this module.
Importing it never performs network I/O, which keeps the health endpoint available
even when optional integrations are not configured.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration loaded from environment variables or a local .env file."""

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_env: str = "development"
    app_name: str = "Kisan Saathi"
    app_version: str = "0.1.0"
    log_level: str = "INFO"
    api_prefix: str = "/api"
    api_cors_origins: str = "http://localhost:3000"

    mongodb_uri: str = ""
    mongodb_db: str = "kisan_saathi"
    mongodb_vector_index: str = "scheme_chunks"
    mongodb_vector_field: str = "embedding"

    google_cloud_project: str = ""
    google_cloud_location: str = "asia-south1"
    google_application_credentials: str = ""
    gcs_bucket: str = ""

    vertex_ai_location: str = "asia-south1"
    gemini_model: str = "gemini-2.0-flash"
    gemini_vision_model: str = "gemini-2.0-flash"
    gemini_embedding_model: str = "text-embedding-005"
    gemini_temperature: float = 0.2
    gemini_max_output_tokens: int = 2048

    llm_provider: str = "groq"
    groq_api_key: str = ""
    groq_model: str = "qwen/qwen3.8-27b"
    groq_vision_model: str = "qwen/qwen3.8-27b"
    groq_base_url: str = "https://api.groq.com/openai/v1"
    groq_timeout_seconds: float = 30.0
    meko_api_key: str = ""
    meko_base_url: str = "https://api.mekodata.ai/api/v1"
    meko_mcp_url: str = "https://mcp.mekodata.ai/mcp"
    meko_datapack_id: str = ""

    speech_language_code: str = "hi-IN"
    speech_stt_model: str = "latest_long"
    speech_tts_voice: str = "hi-IN-Wavenet-A"
    speech_tts_audio_encoding: str = "MP3"

    gee_project: str = ""
    gee_service_account: str = ""
    gee_private_key_path: str = ""
    gee_collection_landsat: str = "LANDSAT/LC09/C02/T1_L2"
    gee_collection_sentinel2: str = "COPERNICUS/S2_SR_HARMONIZED"
    gee_collection_weather: str = "ECMWF/ERA5_LAND/DAILY_AGGR"

    bhoonidhi_stac_url: str = "https://bhoonidhi.nrsc.gov.in/bhoonidhi/stac"
    bhoonidhi_api_key: str = ""
    mosdac_api_url: str = "https://www.mosdac.gov.in/"
    mosdac_api_key: str = ""

    openweather_api_key: str = ""
    mandi_api_url: str = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"
    mandi_api_key: str = ""
    mandi_resource_id: str = "9ef84268-d588-465a-a308-a864a43d0070"
    google_maps_api_key: str = ""

    @property
    def cors_origins(self) -> list[str]:
        """Return the configured browser origins as a normalized list."""

        return [origin.strip() for origin in self.api_cors_origins.split(",") if origin.strip()]

    @property
    def is_production(self) -> bool:
        """Report whether the service is running in production mode."""

        return self.app_env.lower() == "production"


@lru_cache
def get_settings() -> Settings:
    """Return a process-wide cached settings instance."""

    return Settings()
