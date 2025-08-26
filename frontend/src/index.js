import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));

// Rimosso React.StrictMode per evitare double initialization di Keycloak
root.render(<App />);