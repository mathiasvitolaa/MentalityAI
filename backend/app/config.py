"""
Configuración centralizada de la aplicación.

Todas las variables sensibles (como GEMINI_API_KEY) se cargan EXCLUSIVAMENTE
desde variables de entorno (.env) y nunca se hardcodean en el código ni se
exponen a rutas accesibles desde el frontend.
"""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- Gemini ---
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"

    # --- Base de datos ---
    database_url: str = "postgresql+psycopg2://studyai:studyai@localhost:5432/studyai"

    # --- JWT ---
    jwt_secret_key: str = "insecure-dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440

    # --- CORS ---
    frontend_origin: str = "http://localhost:3000"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
