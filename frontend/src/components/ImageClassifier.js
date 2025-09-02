// src/components/ImageClassifier.jsx
import { useState } from 'react';
import axios from 'axios';
import { keycloak } from '../keycloak';
import './ImageClassifier.css';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

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

// Converte la risposta del backend ({label, confidence})
// nel formato che il render attuale si aspetta:
// { predicted_class, confidence, predictions: { "0": p0, ... } }
function mapBackendToUI(resp) {
  const label = resp?.label;
  const confidence = typeof resp?.confidence === 'number' ? resp.confidence : 0;

  const entry = Object.entries(CIFAR10_CLASSES).find(([, v]) => v.name === label);
  const classId = entry ? parseInt(entry[0], 10) : null;

  const n = Object.keys(CIFAR10_CLASSES).length;
  const rest = classId !== null ? (1 - confidence) / (n - 1) : 1 / n;

  const predictions = {};
  for (const [id] of Object.entries(CIFAR10_CLASSES)) {
    predictions[id] = (parseInt(id, 10) === classId) ? confidence : rest;
  }

  return {
    predicted_class: classId ?? undefined,
    confidence,
    predictions
  };
}

function ImageClassifier({ userRoles }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    processFile(file);
  };

  const processFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Seleziona un file immagine valido');
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
    setPrediction(null);
    setError(null);
  };

  // Drag & Drop
  const handleDragOver = (e) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragOver(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragOver(false);
  };
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) processFile(files[0]);
  };

  const classifyImage = async () => {
    if (!selectedFile) {
      setError('Seleziona prima un\'immagine');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // refresh token prima della chiamata
      await keycloak.updateToken(30);

      const formData = new FormData();
      // NOME CAMPO ATTESO DAL BACKEND: 'file'
      formData.append('file', selectedFile);

      const response = await axios.post(
        `${API_BASE}/api/classify`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${keycloak.token}`
          },
          timeout: 30000
        }
      );

      // Mappa risposta semplice -> formato UI esistente
      const uiData = mapBackendToUI(response.data);
      setPrediction(uiData);

    } catch (err) {
      console.error('Classification error:', err);
      const status = err.response?.status;

      if (status === 403) {
        setError('Non hai i permessi per classificare questa immagine');
      } else if (status === 401) {
        setError('Token scaduto o non valido. Effettua di nuovo il login.');
      } else if (err.code === 'ECONNABORTED') {
        setError('Timeout: il backend non ha risposto in tempo.');
      } else {
        setError('Errore nella classificazione: ' + (err.response?.data?.detail || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const renderPredictions = () => {
    if (!prediction) return null;

    const topPredictions = Object.entries(prediction.predictions)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    return (
      <div className="prediction-results card">
        <div className="results-header">
          <h3>🎯 Top 3 Predizioni</h3>
          {prediction.predicted_class !== undefined && (
            <div className="winner-badge">
              <span className="winner-emoji">
                {CIFAR10_CLASSES[prediction.predicted_class]?.emoji}
              </span>
              <span className="winner-text">
                {CIFAR10_CLASSES[prediction.predicted_class]?.name}
              </span>
              <span className="winner-confidence">
                {(prediction.confidence * 100).toFixed(1)}%
              </span>
            </div>
          )}
        </div>

        <div className="predictions-compact">
          {topPredictions.map(([classId, probability], index) => {
            const classInfo = CIFAR10_CLASSES[parseInt(classId, 10)];
            const isWinner = classId === prediction.predicted_class?.toString();

            return (
              <div
                key={classId}
                className={`prediction-compact ${isWinner ? 'winner' : ''}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="prediction-rank">#{index + 1}</div>
                <div className="prediction-info">
                  <div className="prediction-class">
                    <span className="class-emoji">{classInfo.emoji}</span>
                    <span className="class-name">{classInfo.name}</span>
                  </div>
                  <div className="prediction-score">
                    <div className="score-bar">
                      <div
                        className="score-fill"
                        style={{
                          width: `${Math.max(0, Math.min(100, probability * 100))}%`,
                          animationDelay: `${0.5 + index * 0.1}s`
                        }}
                      />
                    </div>
                    <span className="score-text">
                      {(probability * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="image-classifier card">
      {/* Upload Section */}
      <div className="upload-zone">
        <div className="upload-header">
          <h2>📸 Classifica Immagine</h2>
        </div>

        <div
          className="upload-area"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="file-input"
            id="image-upload"
          />

          {!preview ? (
            <label
              htmlFor="image-upload"
              className={`upload-placeholder ${isDragOver ? 'drag-over' : ''}`}
            >
              <div className="upload-icon">
                {isDragOver ? '📥' : '📁'}
              </div>
              <div className="upload-text">
                <span className="upload-primary">
                  {isDragOver ? 'Rilascia qui l\'immagine' : 'Trascina un\'immagine'}
                </span>
                <span className="upload-secondary">
                  {isDragOver ? '' : 'o clicca per selezionare'}
                </span>
              </div>
            </label>
          ) : (
            <div className="image-preview-container">
              <div className="image-preview">
                <img src={preview} alt="Preview" />
                <div className="image-overlay">
                  <label htmlFor="image-upload" className="change-image-btn">
                    🔄 Cambia
                  </label>
                </div>
              </div>
              <div className="file-info">
                <span className="file-name">{selectedFile.name}</span>
                <span className="file-size">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={classifyImage}
          disabled={!selectedFile || loading}
          className={`classify-btn ${loading ? 'loading' : ''}`}
        >
          {loading ? (
            <>
              <div className="btn-spinner"></div>
              <span>Analizzando...</span>
            </>
          ) : (
            <>
              <span>🚀 Classifica</span>
            </>
          )}
        </button>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Results Section */}
      {renderPredictions()}

      {/* (Facoltativo) Mostra i ruoli dell'utente */}
      {userRoles?.length > 0 && (
        <div style={{ marginTop: 12, opacity: 0.7, fontSize: 12 }}>
          Ruoli: {userRoles.join(', ')}
        </div>
      )}
    </div>
  );
}

export default ImageClassifier;
