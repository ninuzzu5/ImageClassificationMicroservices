# backend/app/main.py
from fastapi import FastAPI, Depends
from .auth import get_current_user
from fastapi import Header
from jose import jwt as jose_jwt

app = FastAPI(title="Image Classifier API")

@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.get("/api/me")
async def me(user=Depends(get_current_user)):
    # Estraggo info basilari dal token
    return {
        "sub": user.get("sub"),
        "preferred_username": user.get("preferred_username"),
        "email": user.get("email"),
        "realm_roles": (user.get("realm_access", {}) or {}).get("roles", []),
        "client_roles": (user.get("resource_access", {}) or {}).get(user.get("azp", ""), {}).get("roles", []),
        "aud": user.get("aud"),
        "iss": user.get("iss"),
    }


@app.get("/api/_debug_iss")
def debug_iss(authorization: str = Header(None)):
    # Issuer che il backend si aspetta (deriva da KEYCLOAK_URL/REALM)
    from .auth import ISSUER
    out = {"expected_iss": ISSUER}

    # Se arriva un token, mostra l'iss reale del token (senza verifiche)
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1]
        claims = jose_jwt.get_unverified_claims(token)
        out["token_iss"] = claims.get("iss")
        out["token_aud"] = claims.get("aud")
        out["token_azp"] = claims.get("azp")
    return out