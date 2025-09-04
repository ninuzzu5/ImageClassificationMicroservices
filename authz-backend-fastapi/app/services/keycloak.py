import time
from typing import Any, Dict, List, Tuple
import httpx
from jose import jwt
from jose.utils import base64url_decode
from loguru import logger

from app.config import settings


class JWKSCache:
    def __init__(self, ttl_seconds: int):
        self.ttl = ttl_seconds
        self._keys: Dict[str, Any] = {}
        self._exp = 0

    def get(self) -> Dict[str, Any]:
        if time.time() < self._exp and self._keys:
            return self._keys
        return {}

    def set(self, keys: Dict[str, Any]):
        self._keys = keys
        self._exp = time.time() + self.ttl


_jwks_cache = JWKSCache(settings.jwks_cache_ttl)


async def _fetch_json(url: str) -> Dict[str, Any]:
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(url)
        r.raise_for_status()
        return r.json()


async def get_openid_configuration() -> Dict[str, Any]:
    well_known = f"{settings.keycloak_issuer_url}/.well-known/openid-configuration"
    conf = await _fetch_json(well_known)
    return conf


async def get_jwks() -> Dict[str, Any]:
    cached = _jwks_cache.get()
    if cached:
        return cached
    conf = await get_openid_configuration()
    jwks_uri = conf.get("jwks_uri")
    if not jwks_uri:
        raise RuntimeError("jwks_uri not found in OpenID configuration")
    keys = await _fetch_json(jwks_uri)
    _jwks_cache.set(keys)
    return keys


def _collect_roles(payload: Dict[str, Any]) -> Tuple[List[str], str]:
    roles: List[str] = []
    source = "none"
    # Realm roles
    realm_access = payload.get("realm_access", {})
    if isinstance(realm_access, dict) and isinstance(realm_access.get("roles"), list):
        roles.extend(realm_access["roles"])
        source = "realm"
    # Client roles
    if settings.keycloak_client_id:
        res = payload.get("resource_access", {})
        client = res.get(settings.keycloak_client_id, {})
        if isinstance(client, dict) and isinstance(client.get("roles"), list):
            roles.extend(client["roles"])
            source = "client"
    # Deduplicate while preserving order
    seen = set()
    deduped = []
    for r in roles:
        if r not in seen:
            seen.add(r)
            deduped.append(r)
    return deduped, source


async def verify_and_decode(token: str) -> Dict[str, Any]:
    # 1) Get unverified header for kid
    try:
        unverified_header = jwt.get_unverified_header(token)
    except Exception as e:
        logger.warning(f"Invalid token header: {e}")
        raise

    kid = unverified_header.get("kid")
    jwks = await get_jwks()
    rsa_key = {}
    for key in jwks.get("keys", []):
        if key.get("kid") == kid:
            rsa_key = {
                "kty": key.get("kty"),
                "kid": key.get("kid"),
                "use": key.get("use"),
                "n": key.get("n"),
                "e": key.get("e"),
            }
            break
    if not rsa_key:
        raise RuntimeError("Appropriate JWK not found for token kid")

    verify_opts = {"verify_aud": bool(settings.keycloak_audience)}
    payload = jwt.decode(
        token,
        rsa_key,  # python-jose can take the JWK directly
        algorithms=["RS256"],
        audience=settings.keycloak_audience if settings.keycloak_audience else None,
        issuer=settings.keycloak_issuer_url,
        options=verify_opts,
    )
    return payload


async def extract_user_info(payload: Dict[str, Any]) -> Dict[str, Any]:
    roles, source = _collect_roles(payload)
    tenant = payload.get("tenant") or payload.get("org") or payload.get("organization")
    info = {
        "sub": payload.get("sub"),
        "preferred_username": payload.get("preferred_username"),
        "email": payload.get("email"),
        "name": payload.get("name"),
        "given_name": payload.get("given_name"),
        "family_name": payload.get("family_name"),
        "tenant": tenant,
        "roles": roles,
        "roles_source": source,
    }
    return info
