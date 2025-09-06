from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from pathlib import Path
from PIL import Image
import torch
from torchvision import transforms, models
from torch import nn
from typing import Optional, List
from app.auth import get_current_user
from app.schemas import User
from app.config import settings

router = APIRouter(prefix="/api", tags=["classifier"])

# CIFAR-10 labels
CLASSES: List[str] = [
    "airplane", "automobile", "bird", "cat", "deer",
    "dog", "frog", "horse", "ship", "truck"
]

# Preprocessing: mantieni proporzioni (meno distorsione su foto reali)
_transform = transforms.Compose([
    transforms.Resize(36),          # lato corto -> 36
    transforms.CenterCrop(32),      # crop centrale 32x32
    transforms.ToTensor(),
    transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5))
])


TOPK = 3
THRESH = 0.40

# --- Model cache ---
MODEL: Optional[torch.nn.Module] = None
_MODEL_ERR: Optional[str] = None


def _build_arch(name: str) -> nn.Module:
    """Costruisce l'architettura corrispondente al tuo state_dict."""
    name = (name or "").lower()

    if name == "resnet18":
        m = models.resnet18(weights=None)
        m.fc = nn.Linear(m.fc.in_features, 10)
        return m
    if name == "resnet34":
        m = models.resnet34(weights=None)
        m.fc = nn.Linear(m.fc.in_features, 10)
        return m
    if name == "mobilenet_v2":
        m = models.mobilenet_v2(weights=None)
        m.classifier[-1] = nn.Linear(m.classifier[-1].in_features, 10)
        return m
    if name == "efficientnet_b0":
        m = models.efficientnet_b0(weights=None)
        m.classifier[-1] = nn.Linear(m.classifier[-1].in_features, 10)
        return m

    # LeNet-like (conv1: 3->6 k=5; conv2: 6->16 k=5; fc: 120->84->10)
    if name in ("lenet", "simple_cnn", ""):
        class LeNet(nn.Module):
            def __init__(self):
                super().__init__()
                self.conv1 = nn.Conv2d(3, 6, kernel_size=5)   # -> [6, 28, 28]
                self.pool  = nn.MaxPool2d(2, 2)               # -> [6, 14, 14]
                self.conv2 = nn.Conv2d(6, 16, kernel_size=5)  # -> [16, 10, 10]
                self.fc1   = nn.Linear(16*5*5, 120)
                self.fc2   = nn.Linear(120, 84)
                self.fc3   = nn.Linear(84, 10)

            def forward(self, x):
                x = torch.relu(self.conv1(x))
                x = self.pool(x)
                x = torch.relu(self.conv2(x))
                x = self.pool(x)
                x = torch.flatten(x, 1)
                x = torch.relu(self.fc1(x))
                x = torch.relu(self.fc2(x))
                x = self.fc3(x)
                return x
        return LeNet()


def _try_load_model() -> nn.Module:
    """Carica il modello (TorchScript -> nn.Module -> state_dict con arch)."""
    global _MODEL_ERR
    _MODEL_ERR = None

    mp = Path(settings.model_file)
    if not mp.exists():
        raise RuntimeError(f"Modello non trovato: {mp}")

    # 1) TorchScript
    try:
        m = torch.jit.load(str(mp), map_location="cpu")
        m.eval()
        return m
    except Exception:
        pass

    # 2) nn.Module picklato o state_dict
    try:
        obj = torch.load(str(mp), map_location="cpu")
        if hasattr(obj, "eval"):
            obj.eval()
            return obj
        state_dict = obj  # presumibilmente state_dict
    except Exception:
        raise RuntimeError("Impossibile caricare il file come TorchScript o nn.Module")

    # 3) state_dict -> costruisci arch e carica
    arch = _build_arch(settings.model_arch_name)
    missing, unexpected = arch.load_state_dict(state_dict, strict=False)
    if missing or unexpected:
        _MODEL_ERR = f"State_dict parzialmente compatibile (missing={len(missing)}, unexpected={len(unexpected)})"
    arch.eval()
    return arch


def _get_model() -> Optional[nn.Module]:
    global MODEL, _MODEL_ERR
    if MODEL is None:
        try:
            MODEL = _try_load_model()
        except Exception as e:
            _MODEL_ERR = str(e)
    return MODEL


@router.post("/classify")
async def classify_image(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user)
):
    # Caricamento modello lazy
    model = _get_model()
    if model is None:
        raise HTTPException(status_code=503, detail=f"Modello non disponibile: {_MODEL_ERR or 'errore sconosciuto'}")

    # Validazione input
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Carica un file immagine valido")

    # Preprocess
    img = Image.open(file.file).convert("RGB")
    x = _transform(img).unsqueeze(0)  # [1,3,32,32]

    # Inferenza
    with torch.no_grad():
        logits = model(x)
        if isinstance(logits, (list, tuple)):
            logits = logits[0]
        probs = torch.softmax(logits, dim=1).squeeze(0)  # [10]

    # Top-K
    k = min(TOPK, probs.numel())
    confs, idxs = torch.topk(probs, k=k)
    topk = [{"label": CLASSES[i.item()], "confidence": float(c.item())}
            for c, i in zip(confs, idxs)]

    user_roles = set(user.roles or [])

    # Admin bypass
    if  user_roles == "admin":
        return {
            "label": topk[0]["label"],
            "confidence": topk[0]["confidence"],
            "topk": topk,
            "authorized": True,
            "reason": "admin-bypass"
        }

    # RBAC su Top-K con soglia
    allowed = False
    matched_role = None
    for entry in topk:
        if entry["confidence"] >= THRESH:
            req = f"{entry['label']}-access"
            if req in user_roles:
                allowed = True
                matched_role = req
                break

    if not allowed:
        required_role = f"{topk[0]['label']}-access"
        raise HTTPException(
            status_code=403,
            detail={
                "message": f"Nessuna classe tra le top-{k} ≥ {THRESH:.2f} corrisponde a un tuo ruolo. Richiesto tipicamente: {required_role}.",
                "topk": topk
            }
        )

    return {
        "label": topk[0]["label"],
        "confidence": topk[0]["confidence"],
        "topk": topk,
        "authorized": True,
        "matched_role": matched_role
    }
