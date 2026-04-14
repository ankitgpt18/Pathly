from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Pathly API"
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"
    osrm_base_url: str = "http://router.project-osrm.org/route/v1/driving"
    nominatim_url: str = "https://nominatim.openstreetmap.org/search"
    nominatim_reverse_url: str = "https://nominatim.openstreetmap.org/reverse"
    overpass_url: str = "https://overpass-api.de/api/interpreter"

    class Config:
        env_file = ".env"


settings = Settings()
