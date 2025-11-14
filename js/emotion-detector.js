// Emotion Detection Module using Face-API.js
import { CONFIG } from './config.js';
import { mapEmotionToColor } from './utils.js';

export class EmotionDetector {
  constructor(videoElement, dominantElement, moodDotElement, historyElement) {
    this.video = videoElement;
    this.dominantEl = dominantElement;
    this.moodDot = moodDotElement;
    this.historyEl = historyElement;
    
    this.currentEmotion = 'neutral';
    this.emotionHistory = [];
    this.detectionInterval = null;
    this.isInitialized = false;
    this.smoothingBuffer = [];
    
    // Event callbacks
    this.onEmotionChange = null;
  }

  /**
   * Initialize face-api models and start webcam
   */
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Load face-api models
      await faceapi.nets.tinyFaceDetector.loadFromUri('./models');
      await faceapi.nets.faceLandmark68Net.loadFromUri('./models');
      await faceapi.nets.faceExpressionNet.loadFromUri('./models');

      // Start webcam
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false
      });
      
      this.video.srcObject = stream;
      await this.video.play();

      // Start detection loop
      this.startDetection();
      
      this.isInitialized = true;
      
    } catch (err) {
      console.error('❌ Emotion detector initialization failed:', err);
      this.dominantEl.innerText = 'Camera error';
      this.moodDot.style.background = '#ef4444';
      throw err;
    }
  }

  /**
   * Start continuous emotion detection
   */
  startDetection() {
    if (this.detectionInterval) return;
    
    this.detectionInterval = setInterval(async () => {
      if (this.video.readyState < 2) return;
      
      try {
        const result = await faceapi
          .detectSingleFace(
            this.video,
            new faceapi.TinyFaceDetectorOptions(CONFIG.EMOTION.faceDetectorOptions)
          )
          .withFaceExpressions();
          
        if (!result) {
          this.updateDisplay('No face', '#c7c7c7');
          return;
        }
        
        const expressions = result.expressions;
        const smoothedExpressions = this.smoothExpressions(expressions);
        const { emotion, score } = this.getDominantEmotion(smoothedExpressions);
        
        this.currentEmotion = emotion;
        this.updateDisplay(emotion, mapEmotionToColor(emotion));
        this.addToHistory(emotion, score);
        
        // Notify listeners
        if (this.onEmotionChange) {
          this.onEmotionChange(emotion, score);
        }
        
      } catch (err) {
        console.error('Detection error:', err);
      }
    }, CONFIG.EMOTION.detectionInterval);
  }

  /**
   * Stop emotion detection
   */
  stopDetection() {
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
    }
  }

  /**
   * Get dominant emotion from expressions
   */
  getDominantEmotion(expressions) {
    let dominant = 'neutral';
    let maxScore = 0;
    
    for (const [emotion, score] of Object.entries(expressions)) {
      if (score > maxScore) {
        maxScore = score;
        dominant = emotion;
      }
    }
    
    return { emotion: dominant, score: maxScore };
  }

  /**
   * Smooth expressions over last few frames
   */
  smoothExpressions(expressions) {
    const windowSize = CONFIG.EMOTION.smoothingWindow || 1;
    if (windowSize <= 1) {
      return expressions;
    }

    this.smoothingBuffer.push(expressions);
    if (this.smoothingBuffer.length > windowSize) {
      this.smoothingBuffer.shift();
    }

    const averaged = {};
    const count = this.smoothingBuffer.length;

    for (const frame of this.smoothingBuffer) {
      for (const [emotion, score] of Object.entries(frame)) {
        averaged[emotion] = (averaged[emotion] || 0) + score;
      }
    }

    for (const emotion of Object.keys(averaged)) {
      averaged[emotion] /= count;
    }

    return averaged;
  }

  /**
   * Update UI display
   */
  updateDisplay(emotion, color) {
    const displayText = emotion === 'No face' 
      ? 'No face' 
      : emotion.charAt(0).toUpperCase() + emotion.slice(1);
    
    this.dominantEl.innerText = displayText;
    this.moodDot.style.background = color;
  }

  /**
   * Add emotion to history
   */
  addToHistory(emotion, score) {
    const entry = {
      emotion,
      score,
      timestamp: new Date()
    };
    
    this.emotionHistory.unshift(entry);
    if (this.emotionHistory.length > CONFIG.EMOTION.maxHistory) {
      this.emotionHistory.pop();
    }
    
    this.renderHistory();
  }

  /**
   * Render emotion history
   */
  renderHistory() {
    this.historyEl.innerHTML = '';
    
    for (const entry of this.emotionHistory) {
      const item = document.createElement('div');
      item.className = 'history-item';
      item.innerHTML = `
        <div style="display:flex;gap:8px;align-items:center">
          <span class="mood-dot" style="background:${mapEmotionToColor(entry.emotion)}"></span>
          <div>
            <div style="font-weight:600">${entry.emotion}</div>
            <div style="font-size:12px;color:var(--muted)">${Math.round(entry.score * 100)}%</div>
          </div>
        </div>
        <div style="color:var(--muted);font-size:12px">${entry.timestamp.toLocaleTimeString()}</div>
      `;
      this.historyEl.appendChild(item);
    }
  }

  /**
   * Get current dominant emotion
   */
  getCurrentEmotion() {
    return this.currentEmotion;
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.stopDetection();
    if (this.video.srcObject) {
      const tracks = this.video.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      this.video.srcObject = null;
    }
  }
}

