# 🔥 Neural Image Classifier con Keycloak RBAC

Un sistema di classificazione immagini CIFAR-10 ad alte prestazioni con autenticazione Keycloak, autorizzazione basata sui ruoli (RBAC) e interfaccia React moderna con effetti elettrici.

![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)
![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115.0-009688?logo=fastapi)
![PyTorch](https://img.shields.io/badge/PyTorch-2.3.1-EE4C2C?logo=pytorch)
![Keycloak](https://img.shields.io/badge/Keycloak-26.2-4D4D4D?logo=keycloak)

## 🌟 Caratteristiche Principali

- **🧠 Neural Network**: Modello CNN PyTorch addestrato su CIFAR-10 (LeNet, ResNet18, ResNet34, MobileNetV2, EfficientNet-B0)
- **🔐 Autenticazione Sicura**: Keycloak 26.2 con OpenID Connect e PKCE
- **🎯 RBAC Granulare**: Ogni classe CIFAR-10 ha un ruolo dedicato (`airplane-access`, `cat-access`, etc.)
- **⚡ Interfaccia Moderna**: React con background elettrico animato e glassmorphism
- **🐳 Containerizzazione**: Docker Compose con PostgreSQL, Nginx reverse proxy
- **🚀 FastAPI**: Backend ad alte prestazioni con validazione Pydantic
- **📊 Real-time**: Classificazione in tempo reale con confidence scores animati

## 🏗️ Architettura del Sistema

```mermaid
graph TB
    U[👤 Utente] --> N[🌐 Nginx<br/>Port 3000]
    N --> R[⚛️ React App<br/>Frontend]
    N --> K[🔐 Keycloak<br/>Port 8080]
    N --> F[🚀 FastAPI<br/>Port 8000]
    
    F --> ML[🧠 PyTorch CNN<br/>Neural Network]
    K --> P[(🐘 PostgreSQL<br/>Database)]
    
    subgraph "🐳 Docker Network"
        R
        F
        K
        P
    end
    
    style N fill:#FF6B6B
    style R fill:#4ECDC4
    style F fill:#45B7D1
    style K fill:#96CEB4
    style P fill:#FECA57
    style ML fill:#FF9FF3
```

## 🎯 Classi CIFAR-10 e Sistema RBAC

| 🖼️ Classe | 🔑 Ruolo Richiesto | 🎭 Emoji | 📊 Esempio Confidence |
|-----------|-------------------|----------|----------------------|
| Airplane | `airplane-access` | ✈️ | 94.7% |
| Automobile | `automobile-access` | 🚗 | 87.2% |
| Bird | `bird-access` | 🦅 | 91.5% |
| Cat | `cat-access` | 🐱 | 88.9% |
| Deer | `deer-access` | 🦌 | 82.1% |
| Dog | `dog-access` | 🐕 | 90.3% |
| Frog | `frog-access` | 🐸 | 85.7% |
| Horse | `horse-access` | 🐴 | 89.4% |
| Ship | `ship-access` | 🚢 | 92.8% |
| Truck | `truck-access` | 🚛 | 86.6% |

## 🚀 Quick Start

### Prerequisiti
- 🐳 Docker & Docker Compose
- 💾 4GB+ RAM disponibile
- 🌐 Connessione internet

### 1. 📥 Clone & Setup

```bash
git clone <your-repository>
cd image-classifier

# Crea il file di configurazione
cat > .env << EOF
# Database PostgreSQL
POSTGRES_DB=keycloak
POSTGRES_USER=keycloak
POSTGRES_PASSWORD=SuperSecure123!

# Keycloak Admin
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=AdminPass123!
EOF
```

### 2. 🎬 Lancio con Un Solo Comando

```bash
docker-compose up -d --build
```

### 3. ⚙️ Configurazione Keycloak (5 minuti)

1. **🔗 Accedi**: http://localhost:8080 (`admin` / `AdminPass123!`)

2. **🏠 Crea Realm**:
   ```
   Master dropdown → Create Realm
   Nome: ImageClassifier
   ✅ Save
   ```

3. **📱 Configura Client**:
   ```
   Clients → Create client
   Client ID: classifier-app
   Client type: OpenID Connect
   ✅ Save
   
   Settings tab:
   Valid redirect URIs: http://localhost:3000/*
   Web origins: http://localhost:3000
   ✅ Save
   ```

4. **🎭 Crea Ruoli** (Auto-script disponibile):
   ```bash
   # Crea tutti i ruoli CIFAR-10 automaticamente
   docker-compose exec keycloak bash -c '
   for class in airplane automobile bird cat deer dog frog horse ship truck; do
     /opt/keycloak/bin/kcadm.sh create roles -r ImageClassifier -s name=${class}-access
   done'
   ```

5. **👥 Crea Utenti di Test**:
   ```
   Users → Add user
   Username: testuser
   Email: test@example.com
   ✅ Save
   
   Credentials tab → Set password
   Role mapping → Assign roles (es: cat-access, dog-access)
   ```

### 4. 🎉 Pronto!

Vai su **http://localhost:3000** e inizia a classificare!

## 🧠 Modelli Neural Network Supportati

Il sistema supporta diverse architetture CNN tramite la variabile `MODEL_ARCH_NAME`:

```bash
# In docker-compose.yml o .env
MODEL_ARCH_NAME=lenet          # LeNet-5 (default, veloce)
MODEL_ARCH_NAME=resnet18       # ResNet-18 (bilanciato)
MODEL_ARCH_NAME=resnet34       # ResNet-34 (più accurato)
MODEL_ARCH_NAME=mobilenet_v2   # MobileNet-V2 (efficiente)
MODEL_ARCH_NAME=efficientnet_b0 # EfficientNet-B0 (SOTA)
```

### 🏋️ Addestramento Personalizzato

```bash
# Addestra il tuo modello (LeNet di default)
docker-compose exec backend python -c "
import torch
import torchvision
from app.routers.classifier import _build_arch

# Carica CIFAR-10
transform = torchvision.transforms.Compose([
    torchvision.transforms.ToTensor(),
    torchvision.transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5))
])
trainset = torchvision.datasets.CIFAR10(root='/tmp', train=True, download=True, transform=transform)
trainloader = torch.utils.data.DataLoader(trainset, batch_size=32, shuffle=True)

# Modello e training
model = _build_arch('lenet')
criterion = torch.nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)

# Training loop (semplificato)
for epoch in range(5):
    for i, (inputs, labels) in enumerate(trainloader):
        optimizer.zero_grad()
        outputs = model(inputs)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        if i % 100 == 0:
            print(f'Epoch {epoch}, Batch {i}, Loss: {loss.item():.4f}')

# Salva il modello
torch.save(model.state_dict(), '/app/app/models/neural_net.pt')
print('✅ Modello addestrato e salvato!')
"
```

## 🎨 Interfaccia Utente Avanzata

### ⚡ Electric Background
- Animazioni canvas HTML5 con linee elettriche dinamiche
- Impulsi elettrici che viaggiano a 135° 
- Effetti glow e glassmorphism
- Responsive design per mobile

### 🎯 Componenti React

```javascript
// Drag & Drop con preview
const handleDrop = (e) => {
  e.preventDefault();
  const files = e.dataTransfer.files;
  if (files[0]) processFile(files[0]);
};

// Classificazione real-time
const classifyImage = async () => {
  await keycloak.updateToken(30);
  const formData = new FormData();
  formData.append('file', selectedFile);
  
  const response = await api.post('/classify', formData);
  setPrediction(mapBackendToUI(response.data));
};
```

### 🎭 UserInfo Component
- Avatar animato con pulse effect
- Visualizzazione ruoli con emoji
- Stats utente in tempo reale
- Logout con conferma

## 🔌 API Reference

### 🚀 FastAPI Endpoints

#### `POST /api/classify`
Classifica un'immagine caricata

**Headers:**
```http
Authorization: Bearer <keycloak-jwt-token>
Content-Type: multipart/form-data
```

**Body:**
```javascript
FormData {
  file: <image-file>  // JPEG, PNG, WebP
}
```

**Response 200:**
```json
{
  "label": "cat",
  "confidence": 0.887,
  "topk": [
    {"label": "cat", "confidence": 0.887},
    {"label": "dog", "confidence": 0.094},
    {"label": "horse", "confidence": 0.019}
  ],
  "authorized": true,
  "matched_role": "cat-access"
}
```

**Response 403:**
```json
{
  "detail": {
    "message": "Nessuna classe tra le top-3 ≥ 0.40 corrisponde a un tuo ruolo.",
    "topk": [...]
  }
}
```

#### `GET /api/me`
Info utente autenticato

**Response:**
```json
{
  "sub": "user-uuid",
  "preferred_username": "testuser",
  "email": "test@example.com",
  "roles": ["cat-access", "dog-access"]
}
```

### 🔐 Sistema di Autorizzazione

```python
# Verifica ruoli per classificazione
user_roles = set(user.roles or [])
required_role = f"{predicted_class}-access"

if required_role not in user_roles:
    raise HTTPException(403, "Ruolo mancante")

# Admin bypass
if "admin" in user_roles:
    return full_access_response
```

## 🐳 Docker Services

| Servizio | Immagine | Porta | Descrizione |
|----------|----------|-------|-------------|
| **postgres** | `postgres:16` | 5432 | Database per Keycloak |
| **keycloak** | `quay.io/keycloak/keycloak:26.2` | 8080 | Server di autenticazione |
| **backend** | Custom FastAPI | 8000 | API ML + Auth |
| **frontend** | React + Nginx | 3000 | Web UI con reverse proxy |

### 📁 Volumi e Persistenza

```yaml
volumes:
  postgres_data:           # Database persistente
  ./themes:/opt/keycloak/themes:ro  # Temi custom Keycloak
```

## 🛠️ Comandi di Manutenzione

```bash
# 📊 Status e logs
docker-compose ps
docker-compose logs -f backend
docker-compose logs keycloak | grep ERROR

# 🔄 Restart selettivo
docker-compose restart backend
docker-compose restart keycloak

# 🧹 Pulizia completa
docker-compose down -v
docker system prune -a

# 🔧 Debug container
docker-compose exec backend bash
docker-compose exec frontend sh

# 📈 Monitoring
docker stats
docker-compose top

# 💾 Backup database
docker-compose exec postgres pg_dump -U keycloak keycloak > backup.sql
```

## 🚨 Troubleshooting Avanzato

### 🐛 Backend Non Risponde
```bash
# Check modello ML
docker-compose exec backend ls -la /app/app/models/
docker-compose exec backend python -c "import torch; print('✅ PyTorch OK')"

# Test classificazione
curl -X POST http://localhost:8000/api/classify \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test-image.jpg"
```

### 🔐 Problemi Keycloak
```bash
# Check health Keycloak
curl http://localhost:8080/health

# Reset admin password
docker-compose exec keycloak /opt/keycloak/bin/kcadm.sh update users/admin \
  -r master -s 'credentials=[{"type":"password","value":"NewPass123!"}]'

# Export realm config
docker-compose exec keycloak /opt/keycloak/bin/kcadm.sh get realms/ImageClassifier
```

### ⚛️ Frontend Issues
```bash
# Rebuild con cache pulita
docker-compose build --no-cache frontend

# Check nginx config
docker-compose exec frontend nginx -t

# Debug proxy
docker-compose exec frontend curl -I http://backend:8000/api/health
```

## 🚀 Performance & Scaling

### 📊 Metriche di Performance

| Componente | CPU | RAM | Latenza |
|------------|-----|-----|---------|
| FastAPI Backend | ~15% | 512MB | <200ms |
| React Frontend | ~5% | 128MB | <50ms |
| Keycloak | ~20% | 1GB | <100ms |
| PostgreSQL | ~10% | 256MB | <10ms |

### 🔥 Ottimizzazioni

```yaml
# docker-compose.override.yml per production
version: '3.8'
services:
  backend:
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    deploy:
      replicas: 2
```

### 🌐 Load Balancing

```nginx
# nginx-lb.conf
upstream backend {
    server backend_1:8000;
    server backend_2:8000;
    server backend_3:8000;
}

server {
    location /api/ {
        proxy_pass http://backend/api/;
    }
}
```

## 🔐 Security Best Practices

### 🛡️ Configurazione Produzione

1. **Environment Variables**:
```bash
# Non committare mai nel git!
POSTGRES_PASSWORD=$(openssl rand -base64 32)
KEYCLOAK_ADMIN_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET_KEY=$(openssl rand -base64 64)
```

2. **HTTPS Setup**:
```yaml
# SSL Termination con Traefik
services:
  traefik:
    image: traefik:v2.9
    command:
      - "--certificatesresolvers.letsencrypt.acme.email=your@email.com"
    labels:
      - "traefik.http.routers.frontend.tls.certresolver=letsencrypt"
```

3. **Network Security**:
```yaml
networks:
  backend_internal:
    driver: bridge
    internal: true  # No internet access
  frontend_public:
    driver: bridge
```

## 📊 Monitoring & Observability

### 📈 Metriche con Prometheus

```yaml
# Aggiungi al docker-compose.yml
prometheus:
  image: prom/prometheus
  ports:
    - "9090:9090"
  volumes:
    - ./prometheus.yml:/etc/prometheus/prometheus.yml

grafana:
  image: grafana/grafana
  ports:
    - "3001:3000"
  environment:
    - GF_SECURITY_ADMIN_PASSWORD=admin
```

### 🔍 Custom Metrics

```python
# Nel backend FastAPI
from prometheus_client import Counter, Histogram

classification_requests = Counter('ml_classifications_total', 'Total classifications')
classification_duration = Histogram('ml_classification_seconds', 'Classification duration')

@router.post("/classify")
@classification_duration.time()
async def classify_image():
    classification_requests.inc()
    # ... resto del codice
```

## 🎓 Esempi di Utilizzo

### 📱 Mobile App Integration

```javascript
// React Native esempio
const classifyImage = async (imageUri) => {
  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'photo.jpg',
  });

  const response = await fetch('https://your-api.com/api/classify', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${await getKeycloakToken()}`,
    },
    body: formData,
  });

  return response.json();
};
```

### 🐍 Python Client

```python
import requests
from keycloak import KeycloakOpenID

# Setup Keycloak client
kc = KeycloakOpenID(
    server_url="http://localhost:8080/",
    client_id="classifier-app",
    realm_name="ImageClassifier"
)

# Get token
token = kc.token(username="user", password="pass")

# Classify image
with open('image.jpg', 'rb') as f:
    response = requests.post(
        'http://localhost:8000/api/classify',
        headers={'Authorization': f"Bearer {token['access_token']}"},
        files={'file': f}
    )
    
result = response.json()
print(f"Predicted: {result['label']} ({result['confidence']:.2%})")
```

## 🌍 Deployment Cloud

### ☁️ AWS ECS

```json
{
  "family": "image-classifier",
  "networkMode": "awsvpc",
  "cpu": "1024",
  "memory": "2048",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "your-registry/classifier-backend:latest",
      "portMappings": [{"containerPort": 8000}],
      "environment": [
        {"name": "MODEL_ARCH_NAME", "value": "resnet18"}
      ]
    }
  ]
}
```

### 🚢 Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: classifier-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: classifier-backend
  template:
    metadata:
      labels:
        app: classifier-backend
    spec:
      containers:
      - name: backend
        image: classifier-backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: MODEL_ARCH_NAME
          value: "resnet18"
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
```

## 📄 Licenza

MIT License - Sentiti libero di usare questo progetto per scopi educativi e commerciali.

## 🤝 Contribuire

1. 🍴 Fork il progetto
2. 🌿 Crea un branch (`git checkout -b feature/AmazingFeature`)
3. 💾 Commit le modifiche (`git commit -m 'Add AmazingFeature'`)
4. 📤 Push al branch (`git push origin feature/AmazingFeature`)
5. 🔀 Apri una Pull Request

## 🙏 Credits

- **PyTorch Team** per il framework ML
- **Keycloak Community** per l'identity provider
- **FastAPI** per le performance incredibili
- **React Team** per l'UI framework

## 📞 Supporto

- 🐛 **Bug Report**: Apri una [GitHub Issue](https://github.com/your-username/image-classifier/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/your-username/image-classifier/discussions)
- 📧 **Email**: your-email@example.com

---

⭐ **Se questo progetto ti è stato utile, lascia una stella!** ⭐