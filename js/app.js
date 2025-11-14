// Main Application - Coordinates all modules
import { EmotionDetector } from './emotion-detector.js';
import { RAGSystem } from './rag.js';
import { ChatManager } from './chat.js';
import { UIManager } from './ui.js';
import { DocumentProcessor } from './document-processor.js';

export class App {
  constructor() {
    this.emotionDetector = null;
    this.ragSystem = null;
    this.chatManager = null;
    this.uiManager = null;
    this.documentProcessor = null;
  }

  /**
   * Initialize application
   */
  async initialize() {
    try {
      // Get DOM elements
      const elements = this.getElements();
      
      // Initialize modules
      this.documentProcessor = new DocumentProcessor();
      this.uiManager = new UIManager();
      this.ragSystem = new RAGSystem();
      this.chatManager = new ChatManager(
        elements.messages,
        elements.userInput,
        elements.sendBtn
      );
      this.emotionDetector = new EmotionDetector(
        elements.video,
        elements.dominantEmotion,
        elements.moodDot,
        elements.emotionHistory
      );
      
      // Setup UI
      this.uiManager.initialize(elements);
      
      // Connect modules
      this.connectModules();
      
      // Initialize chat
      this.chatManager.initialize();
      
      // Add welcome message
      this.chatManager.addMessage(
        'Hello! I\'m your AI Learning Assistant. You can ask me anything, and I\'ll adapt my responses based on your emotions. Feel free to upload a document to get answers from both the document and my general knowledge!',
        'ai'
      );
      
      // Initialize emotion detection
      await this.emotionDetector.initialize();
      
      // Initialize RAG (will wait for transformers)
      this.ragSystem.initialize().catch(err => {
        console.error('RAG initialization error:', err);
      });
      
      
    } catch (err) {
      console.error('❌ Application initialization failed:', err);
      throw err;
    }
  }

  /**
   * Get DOM elements
   */
  getElements() {
    return {
      // Document panel
      docTabBtn: document.getElementById('docTabBtn'),
      uploadBtn: document.getElementById('uploadBtn'),
      clearBtn: document.getElementById('clearBtn'),
      docPanel: document.getElementById('docPanel'),
      closeDocPanel: document.getElementById('closeDocPanel'),
      fileInput: document.getElementById('fileInput') || document.querySelector('#docPanel input[type=file]'),
      docAreaPanel: document.getElementById('docAreaPanel'),
      docName: document.getElementById('docName'),
      indexBtn: document.getElementById('indexBtn'),
      clearDocBtn: document.getElementById('clearDocBtn'),
      indexStatus: document.getElementById('indexStatus'),
      
      // Chat
      messages: document.getElementById('messages'),
      userInput: document.getElementById('userInput'),
      sendBtn: document.getElementById('sendBtn'),
      
      // Emotion
      video: document.getElementById('camera'),
      dominantEmotion: document.getElementById('dominantEmotion'),
      moodDot: document.getElementById('moodDot'),
      emotionHistory: document.getElementById('emotionHistory')
    };
  }

  /**
   * Connect modules together
   */
  connectModules() {
    // Connect RAG status updates to UI
    this.ragSystem.onStatusUpdate = (message) => {
      this.uiManager.updateIndexStatus(message);
    };
    
    this.ragSystem.onChunkingComplete = (chunkCount) => {
      this.chatManager.addMessage(
        `Created ${chunkCount} text chunks. Starting embedding...`,
        'ai'
      );
    };

    // Show indexing progress in the document panel
    this.ragSystem.onProgress = (indexedChunks, totalChunks) => {
      if (!totalChunks || totalChunks <= 0) {
        return;
      }
      const percent = Math.round((indexedChunks / totalChunks) * 100);
      this.uiManager.updateIndexProgress(indexedChunks, totalChunks);
      this.uiManager.updateIndexStatus(
        `Embedding chunks: ${indexedChunks}/${totalChunks} (${percent}%)`
      );
    };
    
    const originalOnIndexingComplete = this.ragSystem.onIndexingComplete;
    this.ragSystem.onIndexingComplete = (chunkCount) => {
      this.chatManager.addMessage(
        `Document indexed: ${chunkCount} chunks ready. You can now ask questions!`,
        'ai'
      );
      if (window.analytics) {
        window.analytics.documentUsed = true;
      }
      if (originalOnIndexingComplete) {
        originalOnIndexingComplete(chunkCount);
      }
    };
    
    // Connect UI file upload to document processing
    this.uiManager.onFileUpload = async (file) => {
      // File is already displayed by UI manager
    };
    
    // Connect UI index request to RAG
    this.uiManager.onIndexRequest = async () => {
      const file = this.uiManager.getCurrentFile();
      if (!file) {
        this.uiManager.updateIndexStatus('No file uploaded.');
        this.chatManager.addMessage('Please upload a document first.', 'ai');
        return;
      }
      
      try {
        this.chatManager.addMessage('Starting document indexing...', 'ai');
        
        // Extract text
        const text = await this.documentProcessor.extractText(file);
        
        // Index document
        await this.ragSystem.indexDocument(text);
        
      } catch (err) {
        console.error('Index error:', err);
        this.uiManager.updateIndexStatus('Failed: ' + err.message);
        this.chatManager.addMessage('Indexing failed: ' + err.message, 'ai');
      }
    };
    
    // Connect UI clear request
    this.uiManager.onClearRequest = (type) => {
      if (type === 'all') {
        this.chatManager.clear();
        this.ragSystem.clear();
        this.chatManager.addMessage('Cleared conversation and document.', 'ai');
      } else if (type === 'document') {
        this.ragSystem.clear();
        this.chatManager.addMessage('Document cleared.', 'ai');
      }
    };
    
    // Connect chat to RAG and emotion detector
    this.chatManager.hasDocument = () => {
      return this.ragSystem.isIndexed();
    };
    
    this.chatManager.searchDocument = async (query) => {
      if (!this.ragSystem.isIndexed()) {
        return []; // Return empty array if no document
      }
      return await this.ragSystem.search(query);
    };
    
    this.chatManager.getCurrentEmotion = () => {
      return this.emotionDetector.getCurrentEmotion();
    };

    // Dynamic max_tokens based on UI select
    this.chatManager.getMaxTokens = () => {
      const select = document.getElementById('maxTokensSelect');
      if (!select) return undefined;
      const value = parseInt(select.value, 10);
      if (!Number.isFinite(value) || value <= 0) {
        return undefined;
      }
      return value;
    };
    
    // Connect emotion changes for analytics
    this.emotionDetector.onEmotionChange = (emotion, score) => {
      if (window.analytics) {
        window.analytics.emotions.push({
          emotion,
          score,
          timestamp: new Date()
        });
      }
    };
    
    // Setup summarize button
    this.setupSummarizeButton();
  }

  /**
   * Setup summarize button functionality
   */
  setupSummarizeButton() {
    const summarizeBtn = document.getElementById('summarizeBtn');
    if (!summarizeBtn) return;
    
    // Update button state when document is indexed
    const updateSummarizeButton = () => {
      const hasDoc = this.ragSystem.isIndexed();
      summarizeBtn.disabled = !hasDoc;
    };
    
    // Check periodically
    setInterval(updateSummarizeButton, 1000);
    
    // Also update when indexing completes - chain with existing callback
    const existingCallback = this.ragSystem.onIndexingComplete;
    this.ragSystem.onIndexingComplete = (chunkCount) => {
      if (existingCallback) {
        existingCallback(chunkCount);
      }
      updateSummarizeButton();
    };
    
    // Helper function to estimate tokens (roughly 1 token = 4 characters)
    const estimateTokens = (text) => {
      return Math.ceil(text.length / 4);
    };
    
    // Helper function to truncate text to fit within token limit
    const truncateToTokenLimit = (text, maxTokens = 5000) => {
      const maxChars = maxTokens * 4; // Rough estimate
      if (text.length <= maxChars) return text;
      
      // Try to truncate at sentence boundaries
      const truncated = text.substring(0, maxChars);
      const lastPeriod = truncated.lastIndexOf('.');
      const lastNewline = truncated.lastIndexOf('\n');
      const cutPoint = Math.max(lastPeriod, lastNewline);
      
      if (cutPoint > maxChars * 0.8) {
        return truncated.substring(0, cutPoint + 1) + '...';
      }
      return truncated + '...';
    };
    
    // Handle summarize button click
    summarizeBtn.addEventListener('click', async () => {
      if (!this.ragSystem.isIndexed()) {
        this.chatManager.addMessage('Please upload and index a document first.', 'ai');
        return;
      }
      
      try {
        summarizeBtn.disabled = true;
        this.chatManager.addMessage('Generating summary...', 'ai', true);
        
        // Get all chunks and combine
        let allText = this.ragSystem.chunks.map(c => c.text).join('\n\n');
        
        // Estimate tokens and truncate if needed (leave room for prompt and response)
        const estimatedTokens = estimateTokens(allText);
        if (estimatedTokens > 5000) {
          this.chatManager.addMessage(`Document is large (${Math.round(estimatedTokens)} tokens). Summarizing key sections...`, 'ai', true);
          allText = truncateToTokenLimit(allText, 5000);
        }
        
        // Get current emotion
        const emotion = this.emotionDetector.getCurrentEmotion() || 'neutral';
        
        // Call API for summary with truncated text
        const summary = await this.chatManager.callAPI(
          'Please provide a comprehensive summary of this document. Focus on the main points and key information.',
          [{ text: allText }],
          emotion
        );
        
        this.chatManager.removeTemporaryMessages();
        this.chatManager.addMessage(`📄 **Document Summary:**\n\n${summary}`, 'ai');
        
      } catch (err) {
        console.error('Summarize error:', err);
        this.chatManager.removeTemporaryMessages();
        this.chatManager.addMessage('Failed to generate summary: ' + err.message, 'ai');
      } finally {
        summarizeBtn.disabled = false;
      }
    });
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    if (this.emotionDetector) {
      this.emotionDetector.cleanup();
    }
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.initialize().catch(err => {
      console.error('Failed to initialize app:', err);
    });
    window.app = app; // For debugging
  });
} else {
  const app = new App();
  app.initialize().catch(err => {
    console.error('Failed to initialize app:', err);
  });
  window.app = app; // For debugging
}

