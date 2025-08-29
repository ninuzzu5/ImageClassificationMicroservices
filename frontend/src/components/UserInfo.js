import './UserInfo.css';

const ROLE_LABELS = {
  'airplane-access': '✈️',
  'automobile-access': '🚗', 
  'bird-access': '🐦',
  'cat-access': '🐱',
  'deer-access': '🦌',
  'dog-access': '🐕',
  'frog-access': '🐸',
  'horse-access': '🐴',
  'ship-access': '🚢',
  'truck-access': '🚛'
};

function UserInfo({ username, roles, onLogout }) {
  return (
    <div className="user-info card">
      <div className="user-section">
        <div className="user-avatar">
          <span className="avatar-icon">👤</span>
        </div>
        <div className="user-details">
          <h3 className="username">{username}</h3>
          <div className="user-stats">
            <span className="stats-item">
              <span className="stats-number">{roles.length}</span>
              <span className="stats-label">classi</span>
            </span>
          </div>
        </div>
      </div>

      <div className="permissions-section">
        <div className="roles-container">
          {roles.length > 0 ? (
            <div className="roles-grid">
              {roles.slice(0, 6).map(role => (
                <span key={role} className="role-icon" title={role}>
                  {ROLE_LABELS[role] || '🔹'}
                </span>
              ))}
              {roles.length > 6 && (
                <span className="role-more">+{roles.length - 6}</span>
              )}
            </div>
          ) : (
            <div className="no-permissions">
              <span className="no-permissions-icon">🚫</span>
              <span className="no-permissions-text">Nessun accesso</span>
            </div>
          )}
        </div>
      </div>
      
      <button className="logout-btn" onClick={onLogout} title="Logout">
        <span className="logout-icon">🚪</span>
      </button>
    </div>
  );
}

export default UserInfo;