// RAG (Retrieval Augmented Generation) Module
import { CONFIG } from './config.js';
import { cosineSimilarity } from './utils.js';

export class RAGSystem {
  constructor() {
    this.chunks = [];
    this.embedPipeline = null;
    this.isInitialized = false;
    
    // Callbacks
    this.onStatusUpdate = null;
    this.onIndexingComplete = null;
    this.onChunkingComplete = null;
    this.onProgress = null;
  }

  /**
   * Initialize embedding pipeline
   */
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      await this.waitForTransformers();
      
      if (!window.transformers) {
        throw new Error('Transformers library not available');
      }

      // Set cache location
      window.transformers.env.cacheDir = 'indexeddb://transformers';
      
      // Initialize pipeline
      this.embedPipeline = await window.transformers.pipeline(
        'feature-extraction',
        CONFIG.RAG.modelName,
        { quantized: false }
      );
      
      this.isInitialized = true;
      this.updateStatus('Embedding model loaded');
      
    } catch (err) {
      console.error('❌ RAG initialization failed:', err);
      this.updateStatus('Embedding init failed: ' + err.message);
      throw err;
    }
  }

  /**
   * Wait for transformers.js to load
   */
  async waitForTransformers() {
    if (window.transformersLoaded) return;
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Transformers.js loading timeout'));
      }, 30000);
      
      if (window.transformersLoaded) {
        clearTimeout(timeout);
        resolve();
      } else {
        window.addEventListener('transformers-loaded', () => {
          clearTimeout(timeout);
          resolve();
        }, { once: true });
      }
    });
  }

  /**
   * Generate embedding for text
   */
  async embedText(text) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.embedPipeline) {
      throw new Error('Embedding pipeline not initialized');
    }

    const output = await this.embedPipeline(text, {
      pooling: 'mean',
      normalize: true
    });
    
    return Array.from(output.data);
  }

  /**
   * Chunk text into overlapping segments
   */
  chunkText(text, size = CONFIG.RAG.chunkSize, overlap = CONFIG.RAG.overlap) {
    const chunks = [];
    let start = 0;
    
    while (start < text.length) {
      const end = Math.min(text.length, start + size);
      const chunk = text.slice(start, end).trim();
      if (chunk.length) {
        chunks.push(chunk);
      }
      start += size - overlap;
    }
    
    return chunks;
  }

  /**
   * Index document (chunk and embed) - Optimized for speed
   */
  async indexDocument(text) {
    try {
      this.updateStatus('Chunking text...');
      const chunks = this.chunkText(text);
      
      // Notify about chunking completion
      if (this.onChunkingComplete) {
        this.onChunkingComplete(chunks.length);
      }
      
      this.chunks = [];
      
      // Process chunks in batches for better performance
      const batchSize = 5;
      const totalBatches = Math.ceil(chunks.length / batchSize);
      
      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const batchStart = batchIndex * batchSize;
        const batchEnd = Math.min(batchStart + batchSize, chunks.length);
        const batch = chunks.slice(batchStart, batchEnd);
        
        this.updateStatus(`Embedding batch ${batchIndex + 1}/${totalBatches} (${batchStart + 1}-${batchEnd}/${chunks.length})`);
        
        // Process batch in parallel
        const batchPromises = batch.map(async (chunk, idx) => {
          try {
            const embedding = await this.embedText(chunk);
            return {
              text: chunk,
              embedding: embedding,
              index: batchStart + idx
            };
          } catch (err) {
            console.error(`Failed to embed chunk ${batchStart + idx + 1}:`, err);
            return null;
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        
        // Add successful embeddings in order
        batchResults.forEach(result => {
          if (result) {
            this.chunks[result.index] = {
              text: result.text,
              embedding: result.embedding
            };
          }
        });
        
        // Filter out null results and notify progress
        this.chunks = this.chunks.filter(c => c !== null && c !== undefined);
        
        if (this.onProgress) {
          this.onProgress(this.chunks.length, chunks.length);
        }

        // Yield to the event loop so the UI can update between batches
        await new Promise(resolve => setTimeout(resolve, 0));
      }
      
      this.updateStatus(`✅ Indexed ${this.chunks.length} chunks`);
      
      if (this.onIndexingComplete) {
        this.onIndexingComplete(this.chunks.length);
      }
      
      return this.chunks.length;
      
    } catch (err) {
      console.error('❌ Indexing error:', err);
      this.updateStatus('Indexing failed: ' + err.message);
      throw err;
    }
  }

  /**
   * Search for relevant chunks
   */
  async search(query, topK = CONFIG.RAG.topK) {
    if (!this.chunks || this.chunks.length === 0) {
      throw new Error('No document indexed');
    }

    const queryEmbedding = await this.embedText(query);
    
    const scored = this.chunks.map(chunk => ({
      score: cosineSimilarity(queryEmbedding, chunk.embedding),
      text: chunk.text
    }));
    
    scored.sort((a, b) => b.score - a.score);
    
    return scored.slice(0, topK);
  }

  /**
   * Clear indexed chunks
   */
  clear() {
    this.chunks = [];
    this.updateStatus('');
  }

  /**
   * Get chunk count
   */
  getChunkCount() {
    return this.chunks.length;
  }

  /**
   * Check if document is indexed
   */
  isIndexed() {
    return this.chunks.length > 0;
  }

  /**
   * Update status (notify listeners)
   */
  updateStatus(message) {
    if (this.onStatusUpdate) {
      this.onStatusUpdate(message);
    }
  }
}

