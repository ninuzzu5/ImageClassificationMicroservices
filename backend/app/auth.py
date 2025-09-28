from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from typing import List
from loguru import logger

from app.schemas import User
from app.services.keycloak import verify_and_decode, extract_user_info

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    request: Request, credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme)
) -> User:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    token = credentials.credentials
    try:
        payload = await verify_and_decode(token)
        info = await extract_user_info(payload)
        return User(**info)
    except Exception as e:
        logger.exception("Token validation failed")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")


def roles_required(*required: str):
    async def checker(user: User = Depends(get_current_user)) -> User:
        user_roles = set(user.roles or [])
        needed = set(required)
        if not (user_roles & needed):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Missing required role(s): {', '.join(sorted(needed))}",
            )
        return user

    return checker
