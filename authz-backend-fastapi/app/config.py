# app/config.py
from typing import List
from pydantic import Field, AliasChoices, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # --- Keycloak ---
    keycloak_issuer_url: str  = "http://keycloak:8080/realms/ImageClassifier"
    keycloak_audience: str | None = None
    keycloak_client_id: str | None = None

    # --- CORS ---
    allowed_origins: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    # --- Cache JWKS ---
    jwks_cache_ttl: int = 3600

    # --- App ---
    log_level: str = "INFO"

    # --- Modello ---
    # Accetta MODEL_FILE o MODEL_PATH come env
    model_file: str = Field(
        default="app/models/neural_net.pt",
        validation_alias=AliasChoices("MODEL_FILE", "MODEL_PATH"),
    )
    # Accetta MODEL_ARCH_NAME o MODEL_ARCH come env
    model_arch_name: str = Field(
        default="resnet18",
        validation_alias=AliasChoices("MODEL_ARCH_NAME", "MODEL_ARCH"),
    )

    # Permetti ALLOWED_ORIGINS come CSV ("http://a,http://b") oltre che JSON ([...])
    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_allowed_origins(cls, v):
        if isinstance(v, str):
            s = v.strip()
            if s.startswith("["):  # JSON -> lascia gestire a pydantic
                return s
            return [p.strip() for p in s.split(",") if p.strip()]
        return v

    model_config = SettingsConfigDict(
        env_file=".env",          # se non esiste, viene ignorato
        env_prefix="",            # usa var tipo KEYCLOAK_ISSUER_URL ecc.
        extra="ignore",
        protected_namespaces=("settings_",),  # evita warning "model_*"
    )

settings = Settings()
