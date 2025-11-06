/* LuMi - Utility Functions */

const LuMiUtils = {
  // DOM manipulation helpers
  $(selector) {
    return document.querySelector(selector);
  },

  $$(selector) {
    return document.querySelectorAll(selector);
  },

  createElement(tag, className = '', attributes = {}) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (attributes) {
      Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
    }
    return element;
  },

  // Element visibility and animation
  show(element) {
    if (typeof element === 'string') element = this.$(element);
    if (element) {
      element.classList.remove('hidden');
      element.style.opacity = '1';
    }
  },

  hide(element) {
    if (typeof element === 'string') element = this.$(element);
    if (element) {
      element.classList.add('hidden');
      element.style.opacity = '0';
    }
  },

  toggle(element) {
    if (typeof element === 'string') element = this.$(element);
    if (element) {
      if (element.classList.contains('hidden')) {
        this.show(element);
      } else {
        this.hide(element);
      }
    }
  },

  // Animation helpers
  fadeIn(element, duration = 300) {
    if (typeof element === 'string') element = this.$(element);
    if (element) {
      element.style.opacity = '0';
      element.style.display = 'block';
      
      const start = performance.now();
      
      function animate(timestamp) {
        const elapsed = timestamp - start;
        const progress = Math.min(elapsed / duration, 1);
        
        element.style.opacity = progress;
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      }
      
      requestAnimationFrame(animate);
    }
  },

  fadeOut(element, duration = 300) {
    if (typeof element === 'string') element = this.$(element);
    if (element) {
      const start = performance.now();
      const initialOpacity = 1;
      
      function animate(timestamp) {
        const elapsed = timestamp - start;
        const progress = Math.min(elapsed / duration, 1);
        
        element.style.opacity = initialOpacity * (1 - progress);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          element.style.display = 'none';
        }
      }
      
      requestAnimationFrame(animate);
    }
  },

  // Event handling
  on(element, event, handler) {
    if (typeof element === 'string') element = this.$(element);
    if (element) {
      element.addEventListener(event, handler);
    }
  },

  off(element, event, handler) {
    if (typeof element === 'string') element = this.$(element);
    if (element) {
      element.removeEventListener(event, handler);
    }
  },

  // Form validation
  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  validateRequired(value) {
    return value && value.trim().length > 0;
  },

  sanitizeInput(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  // Date and time formatting
  formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) { // Less than 1 minute
      return 'Just now';
    } else if (diff < 3600000) { // Less than 1 hour
      const minutes = Math.floor(diff / 60000);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diff < 86400000) { // Less than 1 day
      const hours = Math.floor(diff / 3600000);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  },

  formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // Local storage helpers
  setItem(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
      return false;
    }
  },

  getItem(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error('Failed to read from localStorage:', e);
      return defaultValue;
    }
  },

  removeItem(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error('Failed to remove from localStorage:', e);
      return false;
    }
  },

  // Emotion utilities
  getEmotionColor(emotion) {
    const colors = {
      joy: '#fbbf24',
      sadness: '#3b82f6',
      anger: '#ef4444',
      fear: '#8b5cf6',
      surprise: '#f59e0b',
      disgust: '#6b7280',
      anxiety: '#f97316',
      confidence: '#10b981',
      confusion: '#6366f1',
      curiosity: '#06b6d4',
      frustration: '#dc2626',
      excitement: '#e11d48',
      neutral: '#6b7280'
    };
    return colors[emotion] || colors.neutral;
  },

  getEmotionIcon(emotion) {
    const icons = {
      joy: '😊',
      sadness: '😢',
      anger: '😠',
      fear: '😨',
      surprise: '😲',
      disgust: '😷',
      anxiety: '😰',
      confidence: '😎',
      confusion: '😕',
      curiosity: '🤔',
      frustration: '😤',
      excitement: '🤩',
      neutral: '😐'
    };
    return icons[emotion] || icons.neutral;
  },

  // Debounce and throttle
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Scroll helpers
  scrollToBottom(element, smooth = true) {
    if (typeof element === 'string') element = this.$(element);
    if (element) {
      element.scrollTo({
        top: element.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  },

  // Loading state management
  showLoading(text = 'Loading...') {
    const overlay = this.$('#loadingOverlay');
    const textEl = this.$('#loadingText');
    if (overlay) {
      this.show(overlay);
      if (textEl) textEl.textContent = text;
    }
  },

  hideLoading() {
    const overlay = this.$('#loadingOverlay');
    if (overlay) {
      this.hide(overlay);
    }
  },

  // Modal management
  showModal(modalId) {
    const modal = this.$(modalId);
    if (modal) {
      const overlay = this.$('#modalOverlay');
      
      // Hide all other modals first
      this.$$('.modal').forEach(m => m.classList.remove('active'));
      
      // Show overlay and only the target modal
      overlay.classList.add('active');
      modal.classList.add('active');
    }
  },

  hideModal(modalId) {
    const modal = this.$(modalId);
    if (modal) {
      const overlay = this.$('#modalOverlay');
      // Hide all modals and overlay
      this.$$('.modal').forEach(m => m.classList.remove('active'));
      overlay.classList.remove('active');
    }
  },

  // Toast notifications
  showToast(message, type = 'info', duration = 3000) {
    const toast = this.createElement('div', 'toast', {
      'data-type': type
    });
    toast.innerHTML = `
      <div class="toast-content">
        <i class="fas fa-${this.getToastIcon(type)}"></i>
        <span>${this.sanitizeInput(message)}</span>
      </div>
      <button class="toast-close">
        <i class="fas fa-times"></i>
      </button>
    `;

    // Add to page
    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => toast.classList.add('show'), 100);

    // Auto remove
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, duration);

    // Close button
    this.on(toast.querySelector('.toast-close'), 'click', () => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    });
  },

  getToastIcon(type) {
    const icons = {
      success: 'check-circle',
      error: 'exclamation-circle',
      warning: 'exclamation-triangle',
      info: 'info-circle'
    };
    return icons[type] || icons.info;
  },

  // File utilities
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
  },

  // URL parameters
  getURLParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  },

  setURLParam(param, value) {
    const url = new URL(window.location);
    url.searchParams.set(param, value);
    window.history.pushState({}, '', url);
  },

  // Array helpers
  unique(array) {
    return [...new Set(array)];
  },

  chunk(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },

  // Number formatting
  formatNumber(num, decimals = 1) {
    return Number(num).toFixed(decimals);
  },

  formatPercentage(num, total) {
    if (total === 0) return '0%';
    return Math.round((num / total) * 100) + '%';
  }
};

// Add toast styles to the page
if (!document.getElementById('toast-styles')) {
  const toastStyles = document.createElement('style');
  toastStyles.id = 'toast-styles';
  toastStyles.textContent = `
    .toast {
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      padding: 12px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      max-width: 400px;
      z-index: 10000;
      transform: translateX(100%);
      transition: transform 0.3s ease-in-out;
      border-left: 4px solid var(--info-color);
    }
    
    .toast[data-type="success"] { border-left-color: var(--success-color); }
    .toast[data-type="error"] { border-left-color: var(--error-color); }
    .toast[data-type="warning"] { border-left-color: var(--warning-color); }
    .toast[data-type="info"] { border-left-color: var(--info-color); }
    
    .toast.show {
      transform: translateX(0);
    }
    
    .toast-content {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
    }
    
    .toast-content i {
      font-size: 16px;
    }
    
    .toast[data-type="success"] .toast-content i { color: var(--success-color); }
    .toast[data-type="error"] .toast-content i { color: var(--error-color); }
    .toast[data-type="warning"] .toast-content i { color: var(--warning-color); }
    .toast[data-type="info"] .toast-content i { color: var(--info-color); }
    
    .toast-close {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      color: var(--gray-500);
      border-radius: 4px;
    }
    
    .toast-close:hover {
      background: var(--gray-100);
    }
  `;
  document.head.appendChild(toastStyles);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LuMiUtils;
}