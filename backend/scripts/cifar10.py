import os
from torchvision import datasets, transforms

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "cifar10"))

def main():
    os.makedirs(DATA_DIR, exist_ok=True)
    # Una semplice trasformazione (non obbligatoria per il download)
    tfm = transforms.ToTensor()
    for split in ["train", "test"]:
        datasets.CIFAR10(
            root=DATA_DIR,
            train=(split == "train"),
            download=True,
            transform=tfm
        )
    print(f"✔ CIFAR-10 scaricato in: {DATA_DIR}")

if __name__ == "__main__":
    main()
