import React, { useEffect, useRef } from 'react';

const ElectricBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let animationId;

    // Imposta le dimensioni del canvas
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    // Classe per le linee diagonali con impulsi interni
    class ElectricTube {
      constructor(yPosition) {
        this.y = yPosition;
        this.tubeWidth = 2;
        
        // Calcola i punti della linea diagonale (135°)
        this.calculatePoints();
        
        // Impulso elettrico interno
        this.pulse = {
          position: Math.random() * -300,
          speed: 1.5 + Math.random() * 2,
          length: 80 + Math.random() * 40,
          intensity: 0.8 + Math.random() * 0.2
        };
      }

      calculatePoints() {
        // Angolo fisso a 135° per linee regolari
        const angle = 135;
        const radians = (angle * Math.PI) / 180;
        
        // Calcola una linea che attraversa tutto lo schermo diagonalmente
        // con un margine extra per coprire anche gli angoli
        const diagonal = Math.sqrt(canvas.width ** 2 + canvas.height ** 2);
        const extraLength = diagonal * 0.5; // Margine extra per sicurezza
        const totalLength = diagonal + extraLength * 2;
        
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // Calcola i punti di inizio e fine della linea
        // Trasla il centro della linea al punto y specificato
        const offsetY = this.y - centerY;
        
        this.startX = centerX - (totalLength / 2) * Math.cos(radians);
        this.startY = centerY + offsetY - (totalLength / 2) * Math.sin(radians);
        this.endX = centerX + (totalLength / 2) * Math.cos(radians);
        this.endY = centerY + offsetY + (totalLength / 2) * Math.sin(radians);
        
        this.totalLength = Math.sqrt(
          Math.pow(this.endX - this.startX, 2) + 
          Math.pow(this.endY - this.startY, 2)
        );
      }

      update() {
        // Muovi l'impulso lungo la linea
        this.pulse.position += this.pulse.speed;
        
        // Reset quando l'impulso esce dal tubo
        if (this.pulse.position > this.totalLength + this.pulse.length) {
          this.pulse.position = Math.random() * -400 - 100;
          this.pulse.speed = 1.5 + Math.random() * 2;
          this.pulse.length = 80 + Math.random() * 40;
          this.pulse.intensity = 0.8 + Math.random() * 0.2;
        }
      }

      draw() {
        // Disegna il tubo (effetto 3D leggero)
        
        // Ombra del tubo per effetto depth
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = this.tubeWidth + 2;
        ctx.beginPath();
        ctx.moveTo(this.startX + 1, this.startY + 1);
        ctx.lineTo(this.endX + 1, this.endY + 1);
        ctx.stroke();
        
        // Bordo esterno del tubo
        ctx.strokeStyle = 'rgba(88, 188, 130, 0.3)';
        ctx.lineWidth = this.tubeWidth + 1;
        ctx.beginPath();
        ctx.moveTo(this.startX, this.startY);
        ctx.lineTo(this.endX, this.endY);
        ctx.stroke();
        
        // Interno del tubo (più scuro)
        ctx.strokeStyle = 'rgba(88, 188, 130, 0.1)';
        ctx.lineWidth = this.tubeWidth;
        ctx.beginPath();
        ctx.moveTo(this.startX, this.startY);
        ctx.lineTo(this.endX, this.endY);
        ctx.stroke();

        // Disegna l'impulso elettrico interno
        if (this.pulse.position >= 0 && this.pulse.position <= this.totalLength) {
          this.drawPulse();
        }
      }

      drawPulse() {
        const startPos = Math.max(0, this.pulse.position);
        const endPos = Math.min(this.totalLength, this.pulse.position + this.pulse.length);
        
        if (startPos >= endPos) return;
        
        // Calcola le coordinate del segmento illuminato
        const startProgress = startPos / this.totalLength;
        const endProgress = endPos / this.totalLength;
        
        const pulseStartX = this.startX + (this.endX - this.startX) * startProgress;
        const pulseStartY = this.startY + (this.endY - this.startY) * startProgress;
        const pulseEndX = this.startX + (this.endX - this.startX) * endProgress;
        const pulseEndY = this.startY + (this.endY - this.startY) * endProgress;
        
        // Gradiente lungo l'impulso per effetto di movimento
        const gradient = ctx.createLinearGradient(
          pulseStartX, pulseStartY, 
          pulseEndX, pulseEndY
        );
        
        gradient.addColorStop(0, 'rgba(88, 188, 130, 0)');
        gradient.addColorStop(0.3, `rgba(88, 188, 130, ${this.pulse.intensity * 0.3})`);
        gradient.addColorStop(0.7, `rgba(130, 188, 88, ${this.pulse.intensity})`);
        gradient.addColorStop(1, `rgba(200, 255, 150, ${this.pulse.intensity})`);
        
        // Disegna il glow interno
        ctx.strokeStyle = gradient;
        ctx.lineWidth = this.tubeWidth * 3;
        ctx.lineCap = 'round';
        ctx.shadowColor = 'rgba(88, 188, 130, 0.8)';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(pulseStartX, pulseStartY);
        ctx.lineTo(pulseEndX, pulseEndY);
        ctx.stroke();
        
        // Reset shadow
        ctx.shadowBlur = 0;
        
        // Nucleo dell'impulso (più brillante)
        ctx.strokeStyle = `rgba(200, 255, 150, ${this.pulse.intensity})`;
        ctx.lineWidth = this.tubeWidth * 1.5;
        ctx.beginPath();
        ctx.moveTo(pulseStartX, pulseStartY);
        ctx.lineTo(pulseEndX, pulseEndY);
        ctx.stroke();
      }
    }

    // Crea le linee con spaziatura regolare per coprire tutto lo sfondo
    const tubes = [];
    const createTubes = () => {
      tubes.length = 0;
      
      // Spaziatura più ampia per linee meno dense
      const spacing = 200; // Aumentato da 120-150 a 200
      
      // Calcola l'area necessaria per coprire tutto lo schermo
      const diagonal = Math.sqrt(canvas.width ** 2 + canvas.height ** 2);
      const margin = diagonal * 0.3;
      
      const startY = -margin;
      const endY = canvas.height + margin;
      
      for (let y = startY; y < endY; y += spacing) {
        const tube = new ElectricTube(y);
        // Distribuzione temporale degli impulsi
        tube.pulse.position = Math.random() * -500 - (tubes.length * 30);
        tubes.push(tube);
      }
    };

    // Funzione di animazione
    const animate = () => {
      // Clear con sfondo scuro
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Aggiorna e disegna i tubi
      tubes.forEach(tube => {
        tube.update();
        tube.draw();
      });

      animationId = requestAnimationFrame(animate);
    };

    // Inizializzazione
    resizeCanvas();
    createTubes();
    animate();

    // Event listeners
    const handleResize = () => {
      resizeCanvas();
      // Ricalcola solo i punti dei tubi esistenti invece di ricrearli tutti
      tubes.forEach(tube => tube.calculatePoints());
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      window.removeEventListener('resize', handleResize);
      console.log('ElectricBackground cleanup completed');
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        backgroundColor: '#1a1a1a',
        pointerEvents: 'none'
      }}
    />
  );
};

export default ElectricBackground;