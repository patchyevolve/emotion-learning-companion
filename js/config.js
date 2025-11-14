// Configuration constants
export const CONFIG = {
  // RAG Configuration
  RAG: {
    chunkSize: 2000,
    overlap: 400,
    modelName: "Xenova/all-MiniLM-L12-v2",
    topK: 3
  },
  
  // Emotion Detection
  EMOTION: {
    detectionInterval: 200, // ms (~5 FPS)
    maxHistory: 50,
    faceDetectorOptions: {
      inputSize: 160,
      scoreThreshold: 0.45
    },
    smoothingWindow: 5
  },
  
  // API Configuration
  API: {
    baseUrl: (typeof window !== 'undefined' && window.location && window.location.hostname === 'localhost')
      ? 'http://localhost:3000'
      : 'https://emotion-learning-backend.onrender.com',
    endpoint: '/api/answer',
    maxTokens: 600
  },
  
  // UI Configuration
  UI: {
    panelGap: 20,
    radius: 10
  }
};

