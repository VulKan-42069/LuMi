/* LuMi - File Upload Module */

const LuMiFileUpload = {
  currentFile: null,
  isUploading: false,
  allowedTypes: ['.pdf', '.txt'],
  maxFileSize: 16 * 1024 * 1024, // 16MB
  
  // Initialize file upload functionality
  init() {
    this.bindEvents();
    this.setupDragAndDrop();
  },

  // Bind file upload events
  bindEvents() {
    const fileBtn = document.getElementById('fileBtn');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const analyzeFileBtn = document.getElementById('analyzeFileBtn');
    
    if (fileBtn) {
      fileBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent event bubbling
        this.openFileModal();
      });
    }
    
    if (fileInput) {
      fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
    }
    
    if (browseBtn) {
      browseBtn.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent double triggering
        e.stopPropagation();
        if (fileInput) fileInput.click();
      });
    }
    
    if (analyzeFileBtn) {
      analyzeFileBtn.addEventListener('click', () => this.analyzeCurrentFile());
    }

    // Modal close events (handled by main.js now)
  },

  // Setup drag and drop functionality
  setupDragAndDrop() {
    const uploadArea = document.getElementById('uploadArea');
    if (!uploadArea) return;

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      uploadArea.addEventListener(eventName, this.preventDefaults, false);
      document.body.addEventListener(eventName, this.preventDefaults, false);
    });

    // Highlight drop area when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
      uploadArea.addEventListener(eventName, () => {
        uploadArea.classList.add('dragover');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      uploadArea.addEventListener(eventName, () => {
        uploadArea.classList.remove('dragover');
      }, false);
    });

    // Handle dropped files
    uploadArea.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.handleFileSelect({ target: { files } });
      }
    }, false);

    // Click to upload
    uploadArea.addEventListener('click', () => {
      const fileInput = document.getElementById('fileInput');
      if (fileInput) fileInput.click();
    });
  },

  // Prevent default drag behaviors
  preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  },

  // Open file upload modal
  openFileModal() {
    LuMiUtils.showModal('#fileModal');
    this.resetFileModal();
  },

  // Close file upload modal
  closeFileModal() {
    LuMiUtils.hideModal('#fileModal');
    this.resetFileModal();
  },

  // Reset file modal
  resetFileModal() {
    this.currentFile = null;
    this.isUploading = false;
    
    const uploadArea = document.getElementById('uploadArea');
    const fileInfo = document.getElementById('fileInfo');
    const analyzeBtn = document.getElementById('analyzeFileBtn');
    
    if (uploadArea) {
      uploadArea.style.display = 'block';
    }
    
    if (fileInfo) {
      fileInfo.style.display = 'none';
    }
    
    if (analyzeBtn) {
      analyzeBtn.disabled = true;
    }
  },

  // Handle file selection
  handleFileSelect(event) {
    const files = event.target.files;
    if (files.length === 0) return;

    const file = files[0];
    this.currentFile = file;

    // Validate file
    if (!this.validateFile(file)) {
      return;
    }

    this.displayFileInfo(file);
  },

  // Validate file
  validateFile(file) {
    // Check file type
    const extension = '.' + file.name.split('.').pop().toLowerCase();
    if (!this.allowedTypes.includes(extension)) {
      LuMiUtils.showToast('File type not supported. Please upload PDF or TXT files.', 'error');
      return false;
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      const sizeMB = Math.round(file.size / (1024 * 1024));
      LuMiUtils.showToast(`File too large. Maximum size is 16MB. Your file is ${sizeMB}MB.`, 'error');
      return false;
    }

    return true;
  },

  // Display file information
  displayFileInfo(file) {
    const uploadArea = document.getElementById('uploadArea');
    const fileInfo = document.getElementById('fileInfo');
    const analyzeBtn = document.getElementById('analyzeFileBtn');

    if (uploadArea) {
      uploadArea.style.display = 'none';
    }

    if (fileInfo) {
      fileInfo.innerHTML = this.createFileInfoHTML(file);
      fileInfo.style.display = 'block';
    }

    if (analyzeBtn) {
      analyzeBtn.disabled = false;
    }
  },

  // Create file info HTML
  createFileInfoHTML(file) {
    const extension = file.name.split('.').pop().toLowerCase();
    const icon = extension === 'pdf' ? 'fas fa-file-pdf' : 'fas fa-file-alt';
    const sizeFormatted = LuMiUtils.formatFileSize(file.size);

    return `
      <div class="file-details">
        <div class="file-icon">
          <i class="${icon}" style="color: ${extension === 'pdf' ? '#dc2626' : '#3b82f6'};"></i>
        </div>
        <div class="file-meta">
          <h4>${this.sanitizeFilename(file.name)}</h4>
          <p>${sizeFormatted} • ${extension.toUpperCase()}</p>
          <p class="file-date">Uploaded: ${new Date().toLocaleString()}</p>
        </div>
        <div class="file-actions">
          <button class="btn btn-sm btn-secondary" id="changeFileBtn">
            <i class="fas fa-exchange-alt"></i> Change
          </button>
          <button class="btn btn-sm btn-secondary" id="removeFileBtn">
            <i class="fas fa-times"></i> Remove
          </button>
        </div>
      </div>
    `;
  },

  // Sanitize filename for display
  sanitizeFilename(filename) {
    return filename.length > 40 ? filename.substring(0, 37) + '...' : filename;
  },

  // Upload and analyze file
  async analyzeCurrentFile() {
    if (!this.currentFile) {
      LuMiUtils.showToast('No file selected', 'warning');
      return;
    }

    this.isUploading = true;
    this.updateUploadUI('uploading');

    try {
      // Upload file
      const uploadResponse = await LuMiAPI.uploadFile(this.currentFile);
      
      if (!uploadResponse.success) {
        throw new Error(uploadResponse.error || 'Upload failed');
      }

      // Analyze file content
      if (uploadResponse.file_info && uploadResponse.file_info.content) {
        const analysisResponse = await LuMiAPI.analyzeFileContent(uploadResponse.file_info.content);
        
        if (analysisResponse.success) {
          this.handleAnalysisResult(analysisResponse.analysis, uploadResponse.file_info);
          this.closeFileModal();
          
          // Send file content to chat
          this.sendFileToChat(uploadResponse.file_info, analysisResponse.analysis);
        } else {
          throw new Error(analysisResponse.error || 'Analysis failed');
        }
      }

    } catch (error) {
      console.error('File analysis failed:', error);
      LuMiUtils.showToast(`File analysis failed: ${error.message}`, 'error');
    } finally {
      this.isUploading = false;
      this.updateUploadUI('idle');
    }
  },

  // Update upload UI state
  updateUploadUI(state) {
    const uploadArea = document.getElementById('uploadArea');
    const analyzeBtn = document.getElementById('analyzeFileBtn');

    if (!uploadArea || !analyzeBtn) return;

    switch (state) {
      case 'uploading':
        uploadArea.classList.add('uploading');
        analyzeBtn.disabled = true;
        analyzeBtn.textContent = 'Analyzing...';
        break;
      default:
        uploadArea.classList.remove('uploading');
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = 'Analyze File';
    }
  },

  // Handle analysis result
  handleAnalysisResult(analysis, fileInfo) {
    // Create summary message
    const summary = this.createFileSummary(analysis, fileInfo);
    
    // Show success message
    LuMiUtils.showToast('File analyzed successfully! Added to conversation.', 'success');
    
    // Store analysis for later use
    LuMiUtils.setItem('last_file_analysis', { analysis, fileInfo });
  },

  // Create file summary
  createFileSummary(analysis, fileInfo) {
    const { emotion_analysis, themes, summary, content_length, word_count } = analysis;
    const primaryEmotion = emotion_analysis?.primary_emotion || 'neutral';
    
    return `📄 **File Analysis Complete**
    
**File:** ${fileInfo.original_filename}
**Content:** ${word_count} words, ${content_length} characters
**Dominant Emotion:** ${primaryEmotion} (${Math.round((emotion_analysis?.confidence || 0) * 100)}% confidence)

**Summary:** ${summary.content}

**Key Themes:** ${Object.keys(themes).slice(0, 3).join(', ')}

**Sentiment:** ${summary.sentiment} (${summary.readability} readability)`;
  },

  // Send file content to chat
  sendFileToChat(fileInfo, analysis) {
    const message = this.createFileMessage(fileInfo, analysis);
    
    // If chat is available, add the message as an AI response
    if (window.LuMiChat) {
      window.LuMiChat.addMessage('assistant', message, {
        emotion_analysis: analysis.emotion_analysis,
        file_info: fileInfo
      });
    }
  },

  // Create file message
  createFileMessage(fileInfo, analysis) {
    const summary = this.createFileSummary(analysis, fileInfo);
    return `I've analyzed the file "${fileInfo.original_filename}". ${summary}\n\nWould you like to discuss any specific aspects of the content?`;
  },

  // Get file upload statistics
  getUploadStats() {
    const stats = LuMiUtils.getItem('lumi_upload_stats', {
      totalUploads: 0,
      totalSize: 0,
      fileTypes: {},
      lastUpload: null
    });
    
    return stats;
  },

  // Update upload statistics
  updateUploadStats(file) {
    const stats = this.getUploadStats();
    
    stats.totalUploads++;
    stats.totalSize += file.size;
    stats.lastUpload = new Date().toISOString();
    
    const extension = file.name.split('.').pop().toLowerCase();
    stats.fileTypes[extension] = (stats.fileTypes[extension] || 0) + 1;
    
    LuMiUtils.setItem('lumi_upload_stats', stats);
  },

  // Clear upload statistics
  clearUploadStats() {
    LuMiUtils.removeItem('lumi_upload_stats');
    LuMiUtils.showToast('Upload statistics cleared', 'info');
  },

  // Show upload history
  showUploadHistory() {
    const stats = this.getUploadStats();
    const history = LuMiUtils.getItem('lumi_upload_history', []);
    
    let message = `📊 **Upload Statistics**\n\n`;
    message += `Total Uploads: ${stats.totalUploads}\n`;
    message += `Total Size: ${LuMiUtils.formatFileSize(stats.totalSize)}\n`;
    
    if (stats.lastUpload) {
      message += `Last Upload: ${new Date(stats.lastUpload).toLocaleString()}\n`;
    }
    
    message += `\n**File Types:**\n`;
    Object.entries(stats.fileTypes).forEach(([type, count]) => {
      message += `${type.toUpperCase()}: ${count}\n`;
    });
    
    // Display in a modal or toast
    console.log('Upload History:', message);
    LuMiUtils.showToast('Check console for upload statistics', 'info');
  }
};

// Make available globally
window.LuMiFileUpload = LuMiFileUpload;