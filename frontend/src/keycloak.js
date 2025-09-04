import Keycloak from 'keycloak-js';

// Configurazione Keycloak per versione 26.2 
const keycloakConfig = {
  url: 'http://localhost:8080',  // NO /auth per versione 26.2
  realm: 'ImageClassifier',
  clientId: 'classifier-app'
};

// Inizializza Keycloak
const keycloak = new Keycloak(keycloakConfig);

// Opzioni di inizializzazione per debug
const initOptions = {
  onLoad: 'check-sso',
  checkLoginIframe: false,
  pkceMethod: 'S256',
  enableLogging: true,
  messageReceiveTimeout: 10000
};

// Flag per evitare doppia inizializzazione
let isKeycloakInitialized = false;

// Funzione wrapper per inizializzazione sicura
const initializeKeycloak = () => {
  if (isKeycloakInitialized) {
    console.log('Keycloak already initialized, returning existing instance');
    return Promise.resolve(keycloak.authenticated);
  }
  
  console.log('Initializing Keycloak for the first time...');
  isKeycloakInitialized = true;
  
  return keycloak.init(initOptions);
};

export { keycloak, initializeKeycloak };