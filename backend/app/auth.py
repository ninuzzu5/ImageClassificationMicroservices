import os, time
import httpx
from fastapi import HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import jwt  

security = HTTPBearer()

KEYCLOAK_URL = os.getenv("KEYCLOAK_URL", "http://localhost:8080")  # es: http://keycloak:8080 in Docker
KEYCLOAK_REALM = os.getenv("KEYCLOAK_REALM", "ImageClassifier")
KEYCLOAK_AUDIENCE = os.getenv("KEYCLOAK_AUDIENCE", "classifier-app")
ISSUER = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}"
JWKS_URL = f"{ISSUER}/protocol/openid-connect/certs"

_jwks_cache = {"keys": None, "exp": 0}

async def _get_jwks():
    now = time.time()
    if _jwks_cache["keys"] and now < _jwks_cache["exp"]:
        return _jwks_cache["keys"]
    async with httpx.AsyncClient(timeout=5) as client:
        r = await client.get(JWKS_URL)
        r.raise_for_status()
        data = r.json()
    _jwks_cache["keys"] = data["keys"]
    _jwks_cache["exp"] = now + 3600
    return _jwks_cache["keys"]

async def get_current_user(creds: HTTPAuthorizationCredentials = Security(security)):
    token = creds.credentials
    try:
        unverified = jwt.get_unverified_header(token)
        kid = unverified.get("kid")
        keys = await _get_jwks()
        key = next((k for k in keys if k.get("kid") == kid), None)
        if not key:
            raise Exception("Signing key not found")

        public_key = jwt.algorithms.RSAAlgorithm.from_jwk(key)

        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            issuer=ISSUER,
            options={
                "verify_aud": False,      # disattiviamo l'audience per sbloccarci
                "verify_at_hash": False
            },
        )
        return payload

    except Exception as e:
        # se vuoi vedere l'errore preciso in log:
        # import traceback; print("JWT error:", e, traceback.format_exc())
        raise HTTPException(status_code=401, detail="Invalid or expired token")
