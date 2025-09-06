from typing import List, Optional
from pydantic import Field, AliasChoices, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Keycloak 
    keycloak_issuer_url: str  = "http://keycloak:8080/realms/ImageClassifier"
    keycloak_audience: str | None = None
    keycloak_client_id: str | None = None
    keycloak_well_known_url: Optional[str] = None  
    keycloak_jwks_url: Optional[str] = None 

    # CORS 
    allowed_origins: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    # Cache JWKs
    jwks_cache_ttl: int = 3600

    # App 
    log_level: str = "INFO"

    # Modello
    model_file: str = Field(
        default="app/models/neural_net.pt",
        validation_alias=AliasChoices("MODEL_FILE", "MODEL_PATH"),
    )
    # Accetta MODEL_ARCH_NAME o MODEL_ARCH come env
    model_arch_name: str = Field(
        default="resnet18",
        validation_alias=AliasChoices("MODEL_ARCH_NAME", "MODEL_ARCH"),
    )

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_allowed_origins(cls, v):
        if isinstance(v, str):
            s = v.strip()
            if s.startswith("["): 
                return s
            return [p.strip() for p in s.split(",") if p.strip()]
        return v

    model_config = SettingsConfigDict(
        env_file=".env",          
        env_prefix="",            
        extra="ignore",
        protected_namespaces=("settings_",),
    )

settings = Settings()
