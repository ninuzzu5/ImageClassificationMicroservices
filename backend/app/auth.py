import os
from fastapi import Depends, HTTPException, status
from jose import jwt
import httpx

KEYCLOAK_URL = os.getenv("KEYCLOAK_URL", "http://localhost:8080")
REALM = os.getenv("KEYCLOAK_REALM", "ImageClassifier")
ISSUER = f"{KEYCLOAK_URL}/realms/{REALM}"
ALGO = "RS256"

VERIFY_AUDIENCE = os.getenv("VERIFY_AUDIENCE", "false").lower() == "true"
EXPECTED_AUDIENCE = os.getenv("EXPECTED_AUDIENCE", "classifier-app")

_jwks = None

async def _get_jwks():
    global _jwks
    if not _jwks:
        async with httpx.AsyncClient() as c:
            r = await c.get(f"{ISSUER}/protocol/openid-connect/certs", timeout=10)
            r.raise_for_status()
            _jwks = r.json()
    return _jwks

async def get_current_user(authorization: str | None = None):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")
    token = authorization.split(" ", 1)[1]

    jwks = await _get_jwks()
    options = {"verify_aud": VERIFY_AUDIENCE}
    kwargs = {"issuer": ISSUER, "algorithms": [ALGO]}
    if VERIFY_AUDIENCE:
        kwargs["audience"] = EXPECTED_AUDIENCE

    try:
        claims = jwt.decode(token, jwks, options=options, **kwargs)
        return claims
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")

def require_role(role: str):
    async def checker(user = Depends(get_current_user)):
        roles = (user.get("realm_access") or {}).get("roles", [])
        if role not in roles:
            raise HTTPException(status_code=403, detail="Forbidden")
        return user
    return checker
