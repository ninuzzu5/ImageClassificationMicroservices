import React, { useState, useEffect } from 'react';
import { keycloak, initializeKeycloak } from './keycloak';
import ImageClassifier from './components/ImageClassifier';
import UserInfo from './components/UserInfo';
import ElectricBackground from './components/ElectricBackground';
import './App.css';

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userRoles, setUserRoles] = useState([]);

  useEffect(() => {
    console.log('App useEffect triggered');
    console.log('Keycloak config:', {
      url: 'http://localhost:8080',
      realm: 'ImageClassifier',
      clientId: 'classifier-app'
    });
    
    initializeKeycloak()
      .then((authenticated) => {
        console.log('Keycloak initialized successfully. Authenticated:', authenticated);
        setAuthenticated(authenticated);
        
        if (authenticated) {
          const roles = keycloak.realmAccess?.roles || [];
          const imageRoles = roles.filter(role => role.includes('-access'));
          setUserRoles(imageRoles);
        }
        
        setLoading(false);
      })
      .catch((error) => {
        console.error('Keycloak initialization failed:', error);
        console.error('Error details:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="App">
        <ElectricBackground />
        <div className="loading">
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="App">
        <ElectricBackground />
        <div className="login-required">
          <h2>Login Required</h2>
          <button onClick={() => keycloak.login()}>
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <ElectricBackground />
      
      {/* Layout fluido senza header fisso */}
      <div className="fluid-container">
        {/* Titolo principale */}
        <div className="main-title">
          <h1>IMAGE CLASSIFIER</h1>
        </div>
        
        {/* Card UserInfo compatta */}
        <UserInfo 
          username={keycloak.tokenParsed?.preferred_username}
          roles={userRoles}
          onLogout={() => keycloak.logout()}
        />
        
        {/* Card ImageClassifier principale */}
        <ImageClassifier 
          token={keycloak.token}
          userRoles={userRoles}
        />
      </div>
    </div>
  );
}

export default App;