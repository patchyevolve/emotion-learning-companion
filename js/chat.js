// Chat Module - Handles chat UI and API communication
import { CONFIG } from './config.js';

export class ChatManager {
  constructor(messagesElement, inputElement, sendButton) {
    this.messagesEl = messagesElement;
    this.inputEl = inputElement;
    this.sendBtn = sendButton;
    
    // Callbacks
    this.onMessage = null;
    this.getCurrentEmotion = null;
    this.searchDocument = null;
    this.hasDocument = null;
    this.getMaxTokens = null;
  }

  /**
   * Initialize chat manager
   */
  initialize() {
    this.sendBtn.addEventListener('click', () => this.handleSend());
    this.inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSend();
      }
    });
  }

  /**
   * Add message to chat
   */
  addMessage(text, from = 'ai', temporary = false) {
    const el = document.createElement('div');
    el.className = `message ${from === 'user' ? 'user' : 'ai'}`;
    if (temporary) {
      el.setAttribute('data-temporary', 'true');
    }
    
    // Support markdown-like formatting
    if (text.includes('**')) {
      el.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
    } else {
      el.innerText = text;
    }
    
    this.messagesEl.appendChild(el);
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    
    // Track analytics
    if (window.analytics && from === 'user') {
      window.analytics.messages.push({
        text,
        timestamp: new Date()
      });
    }
    
    if (this.onMessage) {
      this.onMessage(text, from);
    }
    
    return el;
  }

  /**
   * Remove temporary messages
   */
  removeTemporaryMessages() {
    const temporary = this.messagesEl.querySelectorAll('[data-temporary="true"]');
    temporary.forEach(msg => msg.remove());
  }

  /**
   * Handle send button click
   */
  async handleSend() {
    const question = this.inputEl.value.trim();
    if (!question) return;
    
    // Add user message
    this.addMessage(question, 'user');
    this.inputEl.value = '';

    // Validate emotion detection
    if (!this.getCurrentEmotion) {
      this.addMessage('Error: Emotion detection not configured', 'ai');
      return;
    }

    try {
      let topChunks = [];
      const hasDocument = this.hasDocument && this.hasDocument();
      
      // Search document if available
      if (hasDocument && this.searchDocument) {
        // Show searching message (temporary)
        this.addMessage('Searching document...', 'ai', true);
        
        try {
          topChunks = await this.searchDocument(question);
        } catch (err) {
          // If document search fails, continue without chunks
          console.warn('Document search failed, continuing without document context:', err);
          topChunks = [];
        }
      } else {
        // Show thinking message (temporary)
        this.addMessage('Thinking...', 'ai', true);
      }
      
      // Get current emotion
      const emotion = this.getCurrentEmotion() || 'neutral';
      
      // Call API (with or without document chunks)
      const answer = await this.callAPI(question, topChunks, emotion);
      
      // Remove temporary messages and add answer
      this.removeTemporaryMessages();
      this.addMessage(answer, 'ai');
      
    } catch (err) {
      console.error('Chat error:', err);
      
      // Remove temporary messages
      this.removeTemporaryMessages();
      
      this.addMessage('Failed to get answer: ' + err.message, 'ai');
    }
  }

  /**
   * Call backend API for answer
   */
  async callAPI(question, topChunks, emotion) {
    const url = `${CONFIG.API.baseUrl}${CONFIG.API.endpoint}`;
    
    // Handle both array of chunks and array of objects with text property
    const chunkTexts = topChunks && topChunks.length > 0
      ? topChunks.map(chunk => typeof chunk === 'string' ? chunk : chunk.text)
      : [];

    const dynamicMaxTokens = this.getMaxTokens ? this.getMaxTokens() : undefined;
    const effectiveMaxTokens = Number.isFinite(dynamicMaxTokens) && dynamicMaxTokens > 0
      ? dynamicMaxTokens
      : CONFIG.API.maxTokens;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: question,
        topChunks: chunkTexts,
        emotion: emotion,
        max_tokens: effectiveMaxTokens
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${errorText}`);
    }
    
    const data = await response.json();
    const answer = data?.choices?.[0]?.message?.content || JSON.stringify(data);
    
    if (!answer || answer === 'No response') {
      throw new Error('Empty response from server');
    }
    
    return answer;
  }

  /**
   * Clear all messages
   */
  clear() {
    this.messagesEl.innerHTML = '';
  }
}

