import os
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass


class Settings:
    ENV: str = os.getenv("ENV", "dev")
    DEBUG: bool = os.getenv("DEBUG", "false").lower() in {"1", "true", "yes"}
    APP_NAME: str = os.getenv("APP_NAME", "CarbonFootprintAPI")
    CLIMATE_LLM_PROVIDER: str | None = os.getenv("CLAUDE") or os.getenv("ANTHROPIC_API_KEY")
    # Network
    REQUEST_TIMEOUT: int = int(os.getenv("REQUEST_TIMEOUT", "20"))
    USER_AGENT: str | None = os.getenv("USER_AGENT")
    SCRAPER_API_KEY: str | None = os.getenv("SCRAPER_API_KEY")
    SCRAPER_API_URL: str = os.getenv("SCRAPER_API_URL", "https://api.scraperapi.com")
    SCRAPE_TRY_MOBILE: bool = os.getenv("SCRAPE_TRY_MOBILE", "true").lower() in {"1", "true", "yes"}
    SCRAPE_TRY_CURL_CFFI: bool = os.getenv("SCRAPE_TRY_CURL_CFFI", "true").lower() in {"1", "true", "yes"}
    CURL_CFFI_IMPERSONATE: str = os.getenv("CURL_CFFI_IMPERSONATE", "chrome120")
    SCRAPE_TRY_PLAYWRIGHT: bool = os.getenv("SCRAPE_TRY_PLAYWRIGHT", "true").lower() in {"1", "true", "yes"}
    # Emission factor providers
    CLIMATIQ_API_KEY: str | None = os.getenv("CLIMATIQ_API_KEY")
    OPENCAGE_API_KEY: str | None = os.getenv("OPENCAGE_API_KEY")
    CLIMATIQ_DATA_VERSION: str = os.getenv("CLIMATIQ_DATA_VERSION", "^21")
    ANTHROPIC_API_KEY: str | None = os.getenv("CLAUDE") or os.getenv("ANTHROPIC_API_KEY")
    # Behavior
    STRICT_SOURCED_ONLY: bool = os.getenv("STRICT_SOURCED_ONLY", "false").lower() in {"1", "true", "yes"}
    # CORS
    CORS_ALLOW_ORIGINS: list[str] = (
        [o.strip() for o in os.getenv("CORS_ALLOW_ORIGINS", "*").split(",") if o.strip()]
        if os.getenv("CORS_ALLOW_ORIGINS")
        else ["*"]
    )


settings = Settings()
