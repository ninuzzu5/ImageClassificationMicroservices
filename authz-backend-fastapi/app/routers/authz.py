from fastapi import APIRouter, Depends
from app.schemas import AuthorizeRequest, AuthorizeResponse, User
from app.auth import get_current_user

router = APIRouter(prefix="/api", tags=["authz"])


@router.get("/health")
async def health():
    return {"status": "ok"}


@router.get("/me", response_model=User)
async def me(user: User = Depends(get_current_user)):
    return user


@router.post("/authorize", response_model=AuthorizeResponse)
async def authorize(req: AuthorizeRequest, user: User = Depends(get_current_user)):
    allowed = req.role in (user.roles or [])
    return AuthorizeResponse(
        allowed=allowed, role=req.role, roles=user.roles or [], source="roles in token"
    )


@router.get("/roles")
async def roles(user: User = Depends(get_current_user)):
    return {"roles": user.roles or []}
