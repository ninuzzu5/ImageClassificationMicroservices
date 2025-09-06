from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from pathlib import Path
from PIL import Image
import torch
from torchvision import transforms, models
from torch import nn
from typing import Optional
from app.auth import get_current_user
from app.schemas import User
from app.config import settings

router = APIRouter(prefix="/api", tags=["classifier"])

CLASSES = [
    "airplane", "automobile", "bird", "cat", "deer",
    "dog", "frog", "horse", "ship", "truck"
]

_transform = transforms.Compose([
    transforms.Resize((32, 32)),
    transforms.ToTensor(),
    transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5))
])

MODEL: Optional[torch.nn.Module] = None
_MODEL_ERR: Optional[str] = None

def _build_arch(name: str) -> nn.Module:
    name = name.lower()
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

    # --- NEW: LeNet-like per CIFAR-10 ---
    if name in ("lenet", "simple_cnn"):
        class LeNet(nn.Module):
            def __init__(self):
                super().__init__()
                self.conv1 = nn.Conv2d(3, 6, kernel_size=5)     # -> [6, 28, 28]
                self.pool  = nn.MaxPool2d(2, 2)                 # -> [6, 14, 14]
                self.conv2 = nn.Conv2d(6, 16, kernel_size=5)    # -> [16, 10, 10]
                # pool -> [16, 5, 5]
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

    # fallback (non dovrebbe servire)
    class Tiny(nn.Module):
        def __init__(self):
            super().__init__()
            self.net = nn.Sequential(
                nn.Conv2d(3, 6, 5), nn.ReLU(), nn.MaxPool2d(2,2),
                nn.Conv2d(6, 16, 5), nn.ReLU(), nn.MaxPool2d(2,2),
                nn.Flatten(),
                nn.Linear(16*5*5, 120), nn.ReLU(),
                nn.Linear(120, 84), nn.ReLU(),
                nn.Linear(84, 10),
            )
        def forward(self, x): return self.net(x)
    return Tiny()


def _try_load_model() -> nn.Module:
    global _MODEL_ERR
    _MODEL_ERR = None
    mp = Path(settings.model_file)

    if not mp.exists():
        raise RuntimeError(f"Modello non trovato: {mp}")

    try:
        m = torch.jit.load(str(mp), map_location="cpu")
        m.eval()
        return m
    except Exception:
        pass

    try:
        obj = torch.load(str(mp), map_location="cpu")
        if hasattr(obj, "eval"):
            obj.eval()
            return obj
        state_dict = obj
    except Exception:
        raise RuntimeError("Impossibile caricare il file come TorchScript o nn.Module")

    arch = _build_arch(settings.model_arch_name)
    missing, unexpected = arch.load_state_dict(state_dict, strict=False)

    if missing or unexpected:
        _MODEL_ERR = f"State_dict con chiavi non perfette (missing={len(missing)}, unexpected={len(unexpected)})"
    arch.eval()
    return arch

def _get_model() -> nn.Module:
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
    model = _get_model()
    if model is None:
        raise HTTPException(status_code=503, detail=f"Modello non disponibile: {_MODEL_ERR or 'errore sconosciuto'}")

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Carica un file immagine valido")

    img = Image.open(file.file).convert("RGB")
    x = _transform(img).unsqueeze(0)

    with torch.no_grad():
        logits = model(x)
        if isinstance(logits, (list, tuple)):
            logits = logits[0]
        probs = torch.softmax(logits, dim=1)
        conf, idx = torch.max(probs, dim=1)

    label = CLASSES[idx.item()]
    confidence = float(conf.item())

    required_role = f"{label}-access"
    if required_role not in (user.roles or []):
        raise HTTPException(status_code=403, detail=f"Non hai il ruolo {required_role}")

    return {"label": label, "confidence": confidence}