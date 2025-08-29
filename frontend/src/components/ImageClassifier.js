import { useState } from 'react';
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
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    processFile(file);
  };

  const processFile = (file) => {
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

  // Gestori drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      processFile(files[0]);
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

    // Mostra solo i top 3 risultati
    const topPredictions = Object.entries(prediction.predictions)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);

    return (
      <div className="prediction-results card">
        <div className="results-header">
          <h3>🎯 Top 3 Predizioni</h3>
          {prediction.predicted_class !== undefined && (
            <div className="winner-badge">
              <span className="winner-emoji">
                {CIFAR10_CLASSES[prediction.predicted_class].emoji}
              </span>
              <span className="winner-text">
                {CIFAR10_CLASSES[prediction.predicted_class].name}
              </span>
              <span className="winner-confidence">
                {(prediction.confidence * 100).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
        
        <div className="predictions-compact">
          {topPredictions.map(([classId, probability], index) => {
            const classInfo = CIFAR10_CLASSES[parseInt(classId)];
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
                          width: `${probability * 100}%`,
                          animationDelay: `${0.5 + index * 0.1}s`
                        }}
                      ></div>
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
    </div>
  );
}

export default ImageClassifier;