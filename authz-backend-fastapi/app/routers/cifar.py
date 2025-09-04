from fastapi import APIRouter, Depends, HTTPException
from app.auth import roles_required, get_current_user
from app.schemas import User

router = APIRouter(prefix="/api/cifar", tags=["cifar-demo"])

# CIFAR-10 classes (example)
CIFAR10_CLASSES = [
    "airplane", "automobile", "bird", "cat", "deer",
    "dog", "frog", "horse", "ship", "truck"
]


def role_for_label(label: str) -> str:
    return f"{label}-access"  # e.g., 'bird-access'


@router.get("/{label}/can-use")
async def can_use_label(label: str, user: User = Depends(get_current_user)):
    if label not in CIFAR10_CLASSES:
        raise HTTPException(status_code=404, detail="Unknown CIFAR-10 label")
    needed = role_for_label(label)
    return {"label": label, "needed_role": needed, "allowed": needed in (user.roles or [])}


@router.get("/{label}/secret", dependencies=[Depends(roles_required("bird-access"))])
async def only_birds(user: User = Depends(get_current_user)):
    # Example protected endpoint: adjust as needed (or generate dynamically per label)
    return {"msg": "Only users with bird-access can reach this."}
