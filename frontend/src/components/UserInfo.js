import React from 'react';
import './UserInfo.css';

const ROLE_LABELS = {
  'airplane-access': '✈️ Aeroplani',
  'automobile-access': '🚗 Automobili', 
  'bird-access': '🐦 Uccelli',
  'cat-access': '🐱 Gatti',
  'deer-access': '🦌 Cervi',
  'dog-access': '🐕 Cani',
  'frog-access': '🐸 Rane',
  'horse-access': '🐴 Cavalli',
  'ship-access': '🚢 Navi',
  'truck-access': '🚛 Camion'
};

function UserInfo({ username, roles, onLogout }) {
  return (
    <div className="user-info">
      <div className="user-details">
        <h3>👤 {username}</h3>
        <div className="user-roles">
          <h4>Classi accessibili:</h4>
          <div className="roles-list">
            {roles.map(role => (
              <span key={role} className="role-badge">
                {ROLE_LABELS[role] || role}
              </span>
            ))}
            {roles.length === 0 && (
              <span className="no-roles">Nessuna classe assegnata</span>
            )}
          </div>
        </div>
      </div>
      
      <button className="logout-btn" onClick={onLogout}>
        Logout
      </button>
    </div>
  );
}

export default UserInfo;