# main.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from predictor import Predictor
import os, requests

import jwt  # PyJWT
from jwt import PyJWKClient

KEYCLOAK_URL = os.getenv("KEYCLOAK_URL", "http://localhost:8080")
REALM = os.getenv("KEYCLOAK_REALM", "ImageClassifier")
ISSUER = f"{KEYCLOAK_URL}/realms/{REALM}"
JWKS_URL = f"{ISSUER}/protocol/openid-connect/certs"
EXPECTED_AUD = os.getenv("EXPECTED_AUDIENCE", "classifier-app")
VERIFY_AUD = os.getenv("VERIFY_AUDIENCE", "false").lower() == "true"

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"], supports_credentials=True)

jwk_client = PyJWKClient(JWKS_URL)
predictor = Predictor()

def decode_token(auth_header: str):
    if not auth_header or not auth_header.startswith("Bearer "):
        return None, ("Missing token", 401)
    token = auth_header.split(" ", 1)[1]
    try:
        signing_key = jwk_client.get_signing_key_from_jwt(token).key
        options = {"verify_aud": VERIFY_AUD}
        kwargs = {"algorithms": ["RS256"], "issuer": ISSUER}
        if VERIFY_AUD:
            kwargs["audience"] = EXPECTED_AUD
        claims = jwt.decode(token, signing_key, options=options, **kwargs)
        return claims, None
    except Exception as e:
        return None, (f"Invalid token: {e}", 401)

def require_role(claims, role):
    roles = (claims.get("realm_access") or {}).get("roles", [])
    return role in roles

@app.get("/api/health")
def health():
    return jsonify({"status": "ok"})

@app.get("/api/me")
def me():
    claims, err = decode_token(request.headers.get("Authorization"))
    if err: return jsonify({"detail": err[0]}), err[1]
    return jsonify({
        "sub": claims.get("sub"),
        "preferred_username": claims.get("preferred_username"),
        "email": claims.get("email"),
        "realm_roles": (claims.get("realm_access") or {}).get("roles", []),
        "aud": claims.get("aud"),
        "iss": claims.get("iss"),
    })

@app.post("/api/classify")
def classify():
    claims, err = decode_token(request.headers.get("Authorization"))
    if err: return jsonify({"detail": err[0]}), err[1]

    # cambia qui il ruolo richiesto se vuoi: "cat-access", "bird-access", etc.
    if not require_role(claims, "cat-access"):
        return jsonify({"detail": "Forbidden"}), 403

    if "file" not in request.files:
        return jsonify({"detail": "Missing file"}), 400

    file = request.files["file"]
    # opzionale: limitare le etichette permessi in base ai ruoli dell'utente
    roles = (claims.get("realm_access") or {}).get("roles", [])
    allowed = []
    for r in roles:
        if r.endswith("-access"):  # es. cat-access → cat
            allowed.append(r.replace("-access", ""))
    allowed = allowed or None  # se vuoto, lascia tutte

    out = predictor.predict(file, allowed_tags=allowed)
    return jsonify(out)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
