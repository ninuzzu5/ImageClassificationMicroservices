from PIL import Image
import torch
import torchvision.transforms as transforms
from net import Net
import os

PATH = '../models/cifar10_best.pt'

class Predictor:
    def __init__(self, device=None):
        self.device = device or torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.net = Net().to(self.device)
        if os.path.exists(PATH):
            self.net.load_state_dict(torch.load(PATH, map_location=self.device))
            self.net.eval()
        else:
            print("⚠️ Modello non trovato a", PATH)

        self.transform = transforms.Compose([
            transforms.Resize((32, 32)),
            transforms.ToTensor(),
            transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5))
        ])
        # classi cifar10
        self.tags = ["airplane","automobile","bird","cat","deer","dog","frog","horse","ship","truck"]

    def predict(self, file, allowed_tags=None):
        img = Image.open(file).convert("RGB")
        img_tensor = self.transform(img).unsqueeze(0).to(self.device)

        with torch.no_grad():
            output = self.net(img_tensor).squeeze()

        if allowed_tags:
            tag_to_index = {t:i for i,t in enumerate(self.tags)}
            idxs = [tag_to_index[t] for t in allowed_tags if t in tag_to_index]
        else:
            idxs = list(range(len(self.tags)))

        best_idx = max(idxs, key=lambda i: output[i].item())
        best_tag = self.tags[best_idx]
        score = torch.softmax(output, dim=0)[best_idx].item()

        return {"label": best_tag, "confidence": round(float(score), 4)}
