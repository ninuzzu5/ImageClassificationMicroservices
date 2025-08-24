import React, { useState } from 'react';
import axios from 'axios';
import './ImageClassifier.css';

const CIFAR10_CLASSES = {
  0: { name: 'airplane', emoji: '✈️', role: 'airplane-access' },
  1: { name: 'automobile', emoji: '🚗', role: 'automobile-access' },
  2: { name: 'bird', emoji: '🐦', role: 'bird-access' },
  3: { name: 'cat', emoji: '🐱', role: 'cat-access' },
  4: { name: 'deer', emoji: '🦌', role: 'deer-access' },
  5: { name: 'dog', emoji: '🐕', role: 'dog-access' },
  6: { name: 'frog', emoji: '🐸', role: 'frog-access' },
  7: { name: 'horse', emoji: '🐴', role: 'horse-access' },
  8: { name: 'ship', emoji: '🚢', role: 'ship-access' },
  9: { name: 'truck', emoji: '🚛', role: 'truck-access' }
};

function ImageClassifier({ token, userRoles }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    
    if (file) {
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
        
        // Crea preview
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target.result);
        reader.readAsDataURL(file);
        
        // Reset stato precedente
        setPrediction(null);
        setError(null);
      } else {
        setError('Seleziona un file immagine valido');
      }
    }
  };

  const classifyImage = async () => {
    if (!selectedFile) {
      setError('Seleziona prima un\'immagine');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await axios.post(
        'http://localhost:5000/api/classify',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      setPrediction(response.data);
    } catch (err) {
      console.error('Classification error:', err);
      
      if (err.response?.status === 403) {
        setError('Non hai i permessi per classificare questa immagine');
      } else if (err.response?.status === 401) {
        setError('Token scaduto. Ricarica la pagina per fare login');
      } else {
        setError('Errore nella classificazione: ' + (err.response?.data?.error || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const renderPredictions = () => {
    if (!prediction) return null;

    return (
      <div className="prediction-results">
        <h3>📊 Risultati Classificazione</h3>
        
        {prediction.predictions && (
          <div className="predictions-list">
            {Object.entries(prediction.predictions)
              .sort(([,a], [,b]) => b - a) // Ordina per probabilità
              .map(([classId, probability]) => {
                const classInfo = CIFAR10_CLASSES[parseInt(classId)];
                const isTopPrediction = classId === prediction.predicted_class?.toString();
                
                return (
                  <div 
                    key={classId} 
                    className={`prediction-item ${isTopPrediction ? 'top-prediction' : ''}`}
                  >
                    <span className="class-info">
                      {classInfo.emoji} {classInfo.name}
                    </span>
                    <div className="probability-bar">
                      <div 
                        className="probability-fill" 
                        style={{ width: `${probability * 100}%` }}
                      ></div>
                    </div>
                    <span className="probability-text">
                      {(probability * 100).toFixed(1)}%
                    </span>
                  </div>
                );
              })
            }
          </div>
        )}

        {prediction.predicted_class !== undefined && (
          <div className="final-prediction">
            <h4>🎯 Predizione Finale:</h4>
            <div className="predicted-class">
              {CIFAR10_CLASSES[prediction.predicted_class].emoji}{' '}
              {CIFAR10_CLASSES[prediction.predicted_class].name}
              <span className="confidence">
                ({(prediction.confidence * 100).toFixed(1)}% sicurezza)
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="image-classifier">
      <div className="upload-section">
        <h2>📤 Carica Immagine</h2>
        
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="file-input"
          id="image-upload"
        />
        
        <label htmlFor="image-upload" className="file-input-label">
          {selectedFile ? '✅ Cambia Immagine' : '📁 Scegli Immagine'}
        </label>

        {preview && (
          <div className="image-preview">
            <img src={preview} alt="Preview" />
            <p className="file-name">{selectedFile.name}</p>
          </div>
        )}

        <button 
          onClick={classifyImage}
          disabled={!selectedFile || loading}
          className="classify-btn"
        >
          {loading ? '⏳ Classificando...' : '🔍 Classifica Immagine'}
        </button>

        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}
      </div>

      {renderPredictions()}

      <div className="user-permissions">
        <h3>🔐 I tuoi permessi:</h3>
        <div className="allowed-classes">
          {userRoles.map(role => {
            const classInfo = Object.values(CIFAR10_CLASSES).find(c => c.role === role);
            return classInfo ? (
              <span key={role} className="allowed-class">
                {classInfo.emoji} {classInfo.name}
              </span>
            ) : null;
          })}
        </div>
      </div>
    </div>
  );
}

export default ImageClassifier;