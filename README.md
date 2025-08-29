# Image Classifier con Keycloak e PyTorch

Un sistema completo di classificazione immagini basato su CIFAR-10 con autenticazione e autorizzazione basata sui ruoli tramite Keycloak.

## 🌟 Caratteristiche

- **Frontend React** con interfaccia moderna e responsive
- **Backend Flask** con modello CNN PyTorch per CIFAR-10
- **Autenticazione Keycloak** con controllo granulare dei permessi
- **Autorizzazione basata sui ruoli** - ogni classe CIFAR-10 ha un ruolo dedicato
- **Containerizzazione Docker** per deployment semplice e scalabile
- **Architettura microservizi** con health checks e logging

## 🏗️ Architettura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Keycloak      │    │   ML Backend    │
│   React + Nginx │◄──►│   Auth Server   │◄──►│   Flask+PyTorch │
│   Port: 3000    │    │   Port: 8080    │    │   Port: 5000    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   PostgreSQL    │
                       │   Database      │
                       └─────────────────┘
```

## 📋 Prerequisiti

- Docker e Docker Compose
- Almeno 4GB RAM libera per l'addestramento del modello
- Connessione internet per scaricare le dipendenze

## 🚀 Installazione Rapida

### 1. Clone del Repository

```bash
git clone <your-repository>
cd image-classifier
```

### 2. Struttura delle Directory

Organizza i file secondo questa struttura:

```
image-classifier/
├── docker-compose.yml
├── .env
├── init-model.sh
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   ├── src/
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   ├── index.css
│   │   ├── keycloak.js
│   │   └── components/
│   │       ├── ElectricBackground.js
│   │       ├── ImageClassifier.js
│   │       ├── ImageClassifier.css
│   │       ├── UserInfo.js
│   │       └── UserInfo.css
│   └── public/
└── backend/
    ├── Dockerfile
    ├── requirements.txt
    ├── app.py
    └── train_model.py
```

### 3. Inizializzazione Automatica

```bash
chmod +x init-model.sh
./init-model.sh
```

Questo script:
- Configura l'ambiente Docker
- Avvia PostgreSQL e Keycloak
- Ti chiede se vuoi addestrare il modello ML
- Avvia tutti i servizi

### 4. Configurazione Keycloak

Dopo l'avvio automatico, configura Keycloak:

1. **Accedi all'Admin Console**: http://localhost:8080 (admin/admin)

2. **Crea il Realm**:
   - Clicca su "Create Realm"
   - Nome: `ImageClassifier`
   - Salva

3. **Configura il Client**:
   - Vai su "Clients" → "Create client"
   - Client ID: `classifier-app`
   - Client type: `OpenID Connect`
   - Salva
   - Nelle impostazioni del client:
     - Valid redirect URIs: `http://localhost:3000/*`
     - Web origins: `http://localhost:3000`
     - Salva

4. **Crea i Ruoli per le Classi CIFAR-10**:
   ```
   Vai su "Realm roles" → "Create role" e crea questi ruoli:
   - airplane-access
   - automobile-access
   - bird-access
   - cat-access
   - deer-access
   - dog-access
   - frog-access
   - horse-access
   - ship-access
   - truck-access
   ```

5. **Crea Utenti di Test**:
   - Vai su "Users" → "Add user"
   - Crea utenti e assegna ruoli diversi per testare i permessi

## 🔧 Configurazione Avanzata

### Variabili d'Ambiente (.env)

```bash
# Database
POSTGRES_DB=keycloak
POSTGRES_USER=keycloak
POSTGRES_PASSWORD=your_secure_password

# Keycloak Admin
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=your_admin_password

# ML Backend
KEYCLOAK_SERVER_URL=http://keycloak:8080
KEYCLOAK_REALM=ImageClassifier
KEYCLOAK_CLIENT_ID=classifier-app
```

### Addestramento del Modello

Per addestrare un modello personalizzato:

```bash
# Addestra un nuovo modello
docker-compose run --rm ml-backend python train_model.py

# Monitora i logs durante l'addestramento
docker-compose logs -f ml-backend
```

## 🎯 Utilizzo

1. **Accesso**: Vai su http://localhost:3000
2. **Login**: Clicca su "Login" e usa le credenziali Keycloak
3. **Upload**: Carica un'immagine trascinandola o cliccando
4. **Classificazione**: Clicca "Classifica" per ottenere le predizioni
5. **Permessi**: Solo le classi per cui hai i permessi saranno visibili

### Classi CIFAR-10 Supportate

| Classe     | Ruolo Richiesto    | Emoji |
|------------|-------------------|-------|
| Airplane   | airplane-access   | ✈️    |
| Automobile | automobile-access | 🚗    |
| Bird       | bird-access       | 🐦    |
| Cat        | cat-access        | 🐱    |
| Deer       | deer-access       | 🦌    |
| Dog        | dog-access        | 🐕    |
| Frog       | frog-access       | 🐸    |
| Horse      | horse-access      | 🐴    |
| Ship       | ship-access       | 🚢    |
| Truck      | truck-access      | 🚛    |

## 📊 API Endpoints

### ML Backend (Port 5000)

- `POST /api/classify` - Classifica un'immagine (richiede autenticazione)
- `GET /api/health` - Health check del servizio
- `GET /api/user-permissions` - Ottieni i permessi dell'utente autenticato

### Esempio di Chiamata API

```javascript
const formData = new FormData();
formData.append('image', imageFile);

const response = await fetch('http://localhost:5000/api/classify', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${keycloakToken}`
    },
    body: formData
});
```

## 🛠️ Comandi Utili

```bash
# Avvia tutti i servizi
docker-compose up -d

# Visualizza i logs
docker-compose logs -f [service_name]

# Riavvia un servizio
docker-compose restart [service_name]

# Ferma tutto
docker-compose down

# Rimuovi anche i volumi (ATTENZIONE: cancella i dati)
docker-compose down -v

# Ricostruisci le immagini
docker-compose build --no-cache

# Stato dei servizi
docker-compose ps

# Entra in un container
docker-compose exec [service_name] bash
```

## 🔍 Troubleshooting

### Il servizio ML-Backend non si avvia

1. Controlla i logs: `docker-compose logs ml-backend`
2. Verifica che Keycloak sia raggiungibile
3. Controlla la memoria disponibile (almeno 2GB per PyTorch)

### Keycloak non si connette al database

1. Verifica che PostgreSQL sia in esecuzione: `docker-compose ps postgres`
2. Controlla la configurazione nel .env
3. Aspetta che PostgreSQL sia completamente avviato

### Errori di autenticazione

1. Verifica la configurazione del client in Keycloak
2. Controlla che gli URL di redirect siano corretti
3. Verifica i ruoli dell'utente

### Prestazioni lente del modello

1. Il modello non addestrato darà predizioni casuali
2. Addestra il modello con `docker-compose run --rm ml-backend python train_model.py`
3. Su CPU l'addestramento può richiedere 1-2 ore

## 📈 Performance e Scalabilità

### Ottimizzazioni Possibili

- **GPU Support**: Aggiungi supporto NVIDIA GPU per accelerare l'addestramento
- **Model Caching**: Implementa cache Redis per le predizioni frequenti
- **Load Balancing**: Usa nginx per bilanciare più istanze del backend
- **Model Serving**: Sostituisci con TorchServe per production

### Monitoraggio

Aggiungi questi servizi per il monitoraggio:

```yaml
# In docker-compose.yml
prometheus:
  image: prom/prometheus
  ports:
    - "9090:9090"

grafana:
  image: grafana/grafana
  ports:
    - "3001:3000"
```

## 🚦 Ambiente di Produzione

Per il deployment in produzione:

1. **Sicurezza**:
   - Usa HTTPS con certificati SSL
   - Cambia tutte le password di default
   - Configura firewall e network security

2. **Scalabilità**:
   - Usa orchestratori come Kubernetes
   - Implementa auto-scaling
   - Usa database managed (AWS RDS, Google Cloud SQL)

3. **Backup**:
   - Backup regolari del database
   - Versioning dei modelli ML
   - Backup della configurazione Keycloak

## 📄 Licenza

MIT License - vedi il file LICENSE per dettagli.

## 🤝 Contributi

I contributi sono benvenuti! Apri una issue o una pull request.

## 📞 Supporto

Per problemi o domande:
- Apri una issue su GitHub
- Controlla i logs con `docker-compose logs`
- Verifica la documentazione di Keycloak e PyTorch