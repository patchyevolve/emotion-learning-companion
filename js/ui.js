// UI Management Module
export class UIManager {
  constructor() {
    this.docPanel = null;
    this.docTabBtn = null;
    this.fileInput = null;
    this.docAreaPanel = null;
    this.docName = null;
    this.indexStatus = null;
    
    // Callbacks
    this.onFileUpload = null;
    this.onIndexRequest = null;
    this.onClearRequest = null;
  }

  /**
   * Initialize UI elements
   */
  initialize(elements) {
    this.docPanel = elements.docPanel;
    this.docTabBtn = elements.docTabBtn;
    this.fileInput = elements.fileInput;
    this.docAreaPanel = elements.docAreaPanel;
    this.docName = elements.docName;
    this.indexStatus = elements.indexStatus;
    this.indexProgressBar = document.getElementById('docIndexProgressBar');
    this.indexProgressFill = document.getElementById('docIndexProgressFill');
    this.uploadBtn = elements.uploadBtn;
    this.closeDocPanel = elements.closeDocPanel;
    this.indexBtn = elements.indexBtn;
    this.clearDocBtn = elements.clearDocBtn;
    this.clearBtn = elements.clearBtn;
    
    this.setupEventListeners();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Document panel toggle
    this.docTabBtn?.addEventListener('click', () => this.toggleDocPanel(true));
    this.closeDocPanel?.addEventListener('click', () => this.toggleDocPanel(false));
    
    // File upload - handle both upload button and file input
    this.uploadBtn?.addEventListener('click', () => {
      // First, open the document panel if it's hidden
      if (this.docPanel && this.docPanel.classList.contains('hidden')) {
        this.toggleDocPanel(true);
      }
      
      // Wait a bit for panel to open, then trigger file input
      setTimeout(() => {
        // Find file input in document panel
        const fileInput = this.fileInput || document.querySelector('#docPanel input[type=file]') || document.querySelector('input[type=file]');
        if (fileInput) {
          fileInput.click();
        } else {
          console.error('File input not found');
        }
      }, 100);
    });
    
    // Also handle file input directly in document panel
    const docPanelFileInput = document.querySelector('#docPanel input[type=file]');
    if (docPanelFileInput) {
      docPanelFileInput.addEventListener('change', (e) => this.handleFileUpload(e));
    }
    
    // Handle file input change
    if (this.fileInput) {
      this.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
    }
    
    // Index button
    this.indexBtn?.addEventListener('click', () => {
      if (this.onIndexRequest) {
        this.onIndexRequest();
      }
    });
    
    // Clear buttons
    this.clearDocBtn?.addEventListener('click', () => {
      this.clearDocument();
      if (this.onClearRequest) {
        this.onClearRequest('document');
      }
    });
    
    this.clearBtn?.addEventListener('click', () => {
      this.clearDocument();
      if (this.onClearRequest) {
        this.onClearRequest('all');
      }
    });
  }

  /**
   * Toggle document panel visibility
   */
  toggleDocPanel(force) {
    if (!this.docPanel) return;
    
    const show = typeof force === 'boolean' 
      ? force 
      : this.docPanel.classList.contains('hidden');
    
    const overlay = document.getElementById('docOverlay');
    
    if (show) {
      this.docPanel.classList.remove('hidden');
      this.docPanel.setAttribute('aria-hidden', 'false');
      this.docTabBtn?.classList.add('active');
      if (overlay) overlay.classList.add('active');
    } else {
      this.docPanel.classList.add('hidden');
      this.docPanel.setAttribute('aria-hidden', 'true');
      this.docTabBtn?.classList.remove('active');
      if (overlay) overlay.classList.remove('active');
    }
  }

  /**
   * Handle file upload
   */
  async handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Remove placeholder
    const placeholder = document.getElementById('docPlaceholder');
    if (placeholder) placeholder.style.display = 'none';
    
    this.docAreaPanel.innerHTML = '';
    this.docName.innerText = file.name;
    
    try {
      if (file.name.toLowerCase().endsWith('.pdf')) {
        // Display PDF preview
        const url = URL.createObjectURL(file);
        const embed = document.createElement('embed');
        embed.src = url;
        embed.type = 'application/pdf';
        embed.style.width = '100%';
        embed.style.height = '600px';
        embed.style.borderRadius = 'var(--radius-lg)';
        this.docAreaPanel.appendChild(embed);
      } else {
        // Display text file
        const text = await file.text();
        const pre = document.createElement('pre');
        pre.textContent = text.substring(0, 10000); // Show first 10k chars
        if (text.length > 10000) {
          pre.textContent += '\n\n... (file truncated for preview)';
        }
        pre.style.whiteSpace = 'pre-wrap';
        pre.style.fontFamily = 'inherit';
        pre.style.color = 'var(--text-primary)';
        pre.style.fontSize = '0.875rem';
        pre.style.lineHeight = '1.6';
        pre.style.padding = 'var(--spacing-md)';
        pre.style.background = 'var(--bg-secondary)';
        pre.style.borderRadius = 'var(--radius-lg)';
        pre.style.border = '1px solid var(--border-color)';
        this.docAreaPanel.appendChild(pre);
      }
      
      // Store file reference on the input element
      if (this.fileInput) {
        this.fileInput._lastFile = file;
      }
      
      // Also store on any file input found
      const allFileInputs = document.querySelectorAll('input[type=file]');
      allFileInputs.forEach(input => {
        input._lastFile = file;
      });
      
      this.updateIndexStatus('Ready to index. Click "Index Document".');
      
      // Notify listener
      if (this.onFileUpload) {
        this.onFileUpload(file);
      }
      
    } catch (err) {
      console.error('File upload error:', err);
      this.updateIndexStatus('Error loading file: ' + err.message);
      if (placeholder) placeholder.style.display = 'block';
    }
  }

  /**
   * Get current file
   */
  getCurrentFile() {
    // Try multiple ways to get the file
    if (this.fileInput?._lastFile) {
      return this.fileInput._lastFile;
    }
    
    // Check all file inputs
    const allFileInputs = document.querySelectorAll('input[type=file]');
    for (const input of allFileInputs) {
      if (input._lastFile) {
        return input._lastFile;
      }
    }
    
    return null;
  }

  /**
   * Update index status
   */
  updateIndexStatus(message) {
    if (this.indexStatus) {
      this.indexStatus.innerText = message || '';
    }
  }

  /**
   * Update index progress bar
   */
  updateIndexProgress(current, total) {
    if (!this.indexProgressBar || !this.indexProgressFill) return;

    if (!total || total <= 0 || !current || current <= 0) {
      this.indexProgressBar.style.display = 'none';
      this.indexProgressFill.style.width = '0%';
      return;
    }

    const percent = Math.max(0, Math.min(100, Math.round((current / total) * 100)));
    this.indexProgressBar.style.display = 'block';
    this.indexProgressFill.style.width = `${percent}%`;
  }

  /**
   * Clear document display
   */
  clearDocument() {
    if (this.docAreaPanel) {
      this.docAreaPanel.innerHTML = '<div class="doc-placeholder">No document loaded.</div>';
    }
    if (this.docName) {
      this.docName.innerText = 'No file';
    }
    if (this.fileInput) {
      this.fileInput.value = '';
      this.fileInput._lastFile = null;
    }
    this.updateIndexStatus('');
    if (this.indexProgressBar && this.indexProgressFill) {
      this.indexProgressBar.style.display = 'none';
      this.indexProgressFill.style.width = '0%';
    }
  }
}

