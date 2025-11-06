/* LuMi - Main Application Initialization */

const LuMi = {
  isInitialized: false,
  version: '1.0.0',
  config: {
    autoSave: true,
    realTimeUpdates: true,
    debugMode: false
  },

  // Initialize the entire application
  async init() {
    if (this.isInitialized) {
      console.warn('LuMi is already initialized');
      return;
    }

    try {
      console.log('🧠 Initializing LuMi AI Companion...');
      
      // Initialize utilities first
      this.initUtils();
      
      // Initialize API
      this.initAPI();
      
      // Initialize charts
      this.initCharts();
      
      // Initialize emotion tracking
      this.initEmotionTracking();
      
      // Initialize chat
      this.initChat();
      
      // Initialize voice
      this.initVoice();
      
      // Initialize file upload
      this.initFileUpload();
      
      // Initialize UI components
      this.initUI();
      
      // Initialize event handlers
      this.initEventHandlers();
      
      // Start the application
      await this.start();
      
      this.isInitialized = true;
      console.log('✅ LuMi initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize LuMi:', error);
      this.showInitializationError(error);
    }
  },

  // Initialize utilities
  initUtils() {
    // Make LuMiUtils globally available
    window.LuMiUtils = window.LuMiUtils || {};
    
    // Add custom methods if not already present
    if (!window.LuMiUtils.showToast) {
      window.LuMiUtils.showToast = (message, type = 'info') => {
        console.log(`Toast [${type}]: ${message}`);
      };
    }
  },

  // Initialize API
  initAPI() {
    if (!window.LuMiAPI) {
      console.error('LuMi API not found');
      return;
    }

    // Initialize session
    this.initSession();
  },

  // Initialize session
  async initSession() {
    try {
      await LuMiAPI.Session.initialize();
      console.log('✅ Session initialized');
    } catch (error) {
      console.warn('Session initialization failed:', error);
    }
  },

  // Initialize charts
  initCharts() {
    if (!window.LuMiCharts) {
      console.error('LuMi Charts not found');
      return;
    }

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        LuMiCharts.init();
      });
    } else {
      LuMiCharts.init();
    }
    console.log('✅ Charts initialized');
  },

  // Initialize emotion tracking
  initEmotionTracking() {
    if (!window.LuMiEmotionTracker) {
      console.error('LuMi Emotion Tracker not found');
      return;
    }

    // Load from storage
    LuMiEmotionTracker.loadFromStorage();
    LuMiEmotionTracker.init();
    console.log('✅ Emotion tracking initialized');
  },

  // Initialize chat
  initChat() {
    if (!window.LuMiChat) {
      console.error('LuMi Chat not found');
      return;
    }

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        LuMiChat.init();
      });
    } else {
      LuMiChat.init();
    }
    console.log('✅ Chat initialized');
  },

  // Initialize voice
  initVoice() {
    if (!window.LuMiVoice) {
      console.error('LuMi Voice not found');
      return;
    }

    LuMiVoice.init();
    console.log('✅ Voice features initialized');
  },

  // Initialize file upload
  initFileUpload() {
    if (!window.LuMiFileUpload) {
      console.error('LuMi File Upload not found');
      return;
    }

    LuMiFileUpload.init();
    console.log('✅ File upload initialized');
  },

  // Initialize UI components
  initUI() {
    this.initModals();
    this.initSettings();
    this.initProfile();
    this.initTheme();
  },

  // Initialize modals
  initModals() {
    // Direct event listeners for specific buttons (avoid event delegation conflicts)
    const profileBtn = document.getElementById('profileBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    
    if (profileBtn) {
      profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openProfileModal();
      });
    }
    
    if (settingsBtn) {
      settingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openSettingsModal();
      });
    }
    
    // Modal close events (event delegation for close buttons)
    document.addEventListener('click', (e) => {
      // Check if clicking on close button or overlay
      const isCloseButton = e.target.classList.contains('close-modal') ||
                           e.target.closest('.close-modal') ||
                           e.target.classList.contains('fas fa-times');
      const isOverlay = e.target.classList.contains('modal-overlay');
      
      if (isCloseButton || isOverlay) {
        this.closeModals();
      }
    });

    // Settings save
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    if (saveSettingsBtn) {
      saveSettingsBtn.addEventListener('click', () => this.saveSettings());
    }

    // Profile save
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    if (saveProfileBtn) {
      saveProfileBtn.addEventListener('click', () => this.saveProfile());
    }

    console.log('✅ Modals initialized');
  },

  // Initialize settings
  initSettings() {
    // Load saved settings
    const settings = LuMiUtils.getItem('lumi_settings', this.config);
    this.config = { ...this.config, ...settings };
    
    // Apply settings to UI
    this.applySettings();
    console.log('✅ Settings initialized');
  },

  // Initialize profile
  initProfile() {
    // Load user profile
    const profile = LuMiUtils.getItem('lumi_profile', {});
    this.profile = profile;
    
    // Update UI with profile data
    this.updateProfileUI();
    console.log('✅ Profile initialized');
  },

  // Initialize theme
  initTheme() {
    // Apply saved theme
    const theme = LuMiUtils.getItem('lumi_theme', 'light');
    this.applyTheme(theme);
    console.log('✅ Theme initialized');
  },

  // Initialize event handlers
  initEventHandlers() {
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + K for settings
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.openSettingsModal();
      }
      
      // Ctrl/Cmd + N for new chat
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        if (window.LuMiChat) {
          window.LuMiChat.startNewConversation();
        }
      }
      
      // Escape to close modals
      if (e.key === 'Escape') {
        this.closeModals();
      }
    });

    // Before unload - save state
    window.addEventListener('beforeunload', () => {
      this.saveState();
    });

    console.log('✅ Event handlers initialized');
  },

  // Start the application
  async start() {
    // Perform health check
    const health = await this.performHealthCheck();
    if (!health.healthy) {
      throw new Error('Health check failed: ' + health.error);
    }

    // Show welcome message
    this.showWelcomeMessage();
    
    // Auto-save state periodically
    if (this.config.autoSave) {
      setInterval(() => {
        this.saveState();
      }, 30000); // Save every 30 seconds
    }

    console.log('🎉 LuMi is ready!');
  },

  // Perform health check
  async performHealthCheck() {
    try {
      const response = await LuMiAPI.healthCheck();
      return { healthy: response.status === 'healthy', error: null };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  },

  // Show welcome message
  showWelcomeMessage() {
    if (this.config.debugMode) {
      console.log('LuMi Debug Mode: Starting in development mode');
    }
    
    // You can add a welcome toast here
    setTimeout(() => {
      LuMiUtils.showToast('Welcome to LuMi! Your AI companion is ready to help you understand your emotions.', 'success');
    }, 1000);
  },

  // Open profile modal
  openProfileModal() {
    this.loadProfileData();
    LuMiUtils.showModal('#profileModal');
  },

  // Open settings modal
  openSettingsModal() {
    this.loadSettingsData();
    LuMiUtils.showModal('#settingsModal');
  },

  // Close all modals
  closeModals() {
    LuMiUtils.hideModal('#profileModal');
    LuMiUtils.hideModal('#settingsModal');
    LuMiUtils.hideModal('#fileModal');
  },

  // Save settings
  saveSettings() {
    const sensitivity = document.getElementById('sensitivity');
    const realTimeUpdates = document.getElementById('realTimeUpdates');
    const saveConversations = document.getElementById('saveConversations');
    const shareAnalytics = document.getElementById('shareAnalytics');

    if (sensitivity) {
      this.config.emotionSensitivity = parseFloat(sensitivity.value);
    }
    if (realTimeUpdates) {
      this.config.realTimeUpdates = realTimeUpdates.checked;
    }
    if (saveConversations) {
      this.config.saveConversations = saveConversations.checked;
    }
    if (shareAnalytics) {
      this.config.shareAnalytics = shareAnalytics.checked;
    }

    // Save to storage
    LuMiUtils.setItem('lumi_settings', this.config);
    
    // Apply settings
    this.applySettings();
    
    // Close modal
    this.closeModals();
    
    // Show success message
    LuMiUtils.showToast('Settings saved successfully', 'success');
  },

  // Save profile
  saveProfile() {
    const username = document.getElementById('username');
    const email = document.getElementById('email');
    const bio = document.getElementById('bio');

    if (username && email) {
      this.profile = {
        username: username.value,
        email: email.value,
        bio: bio ? bio.value : '',
        updatedAt: new Date().toISOString()
      };
      
      // Save to storage
      LuMiUtils.setItem('lumi_profile', this.profile);
      
      // Close modal
      this.closeModals();
      
      // Show success message
      LuMiUtils.showToast('Profile updated successfully', 'success');
    }
  },

  // Load settings data
  loadSettingsData() {
    const sensitivity = document.getElementById('sensitivity');
    const sensitivityValue = document.getElementById('sensitivityValue');
    const realTimeUpdates = document.getElementById('realTimeUpdates');
    const saveConversations = document.getElementById('saveConversations');
    const shareAnalytics = document.getElementById('shareAnalytics');

    if (sensitivity) {
      sensitivity.value = this.config.emotionSensitivity || 0.5;
      if (sensitivityValue) {
        sensitivityValue.textContent = sensitivity.value;
      }
    }
    if (realTimeUpdates) {
      realTimeUpdates.checked = this.config.realTimeUpdates !== false;
    }
    if (saveConversations) {
      saveConversations.checked = this.config.saveConversations !== false;
    }
    if (shareAnalytics) {
      shareAnalytics.checked = this.config.shareAnalytics || false;
    }

    // Update sensitivity display
    if (sensitivity) {
      sensitivity.addEventListener('input', (e) => {
        if (sensitivityValue) {
          sensitivityValue.textContent = e.target.value;
        }
      });
    }
  },

  // Load profile data
  loadProfileData() {
    const username = document.getElementById('username');
    const email = document.getElementById('email');
    const bio = document.getElementById('bio');

    if (username) username.value = this.profile?.username || '';
    if (email) email.value = this.profile?.email || '';
    if (bio) bio.value = this.profile?.bio || '';
  },

  // Apply settings
  applySettings() {
    // Apply real-time updates setting
    if (window.LuMiEmotionTracker) {
      if (this.config.realTimeUpdates) {
        LuMiEmotionTracker.startRealTimeUpdates();
      } else {
        LuMiEmotionTracker.stopRealTimeUpdates();
      }
    }
  },

  // Update profile UI
  updateProfileUI() {
    // Update profile display if needed
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn && this.profile?.username) {
      profileBtn.title = `Profile: ${this.profile.username}`;
    }
  },

  // Apply theme
  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  },

  // Save application state
  saveState() {
    const state = {
      config: this.config,
      profile: this.profile,
      timestamp: new Date().toISOString()
    };
    
    LuMiUtils.setItem('lumi_app_state', state);
  },

  // Load application state
  loadState() {
    return LuMiUtils.getItem('lumi_app_state', null);
  },

  // Show initialization error
  showInitializationError(error) {
    const errorDiv = document.createElement('div');
    errorDiv.innerHTML = `
      <div style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #fff;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        max-width: 400px;
        text-align: center;
      ">
        <h3 style="color: #ef4444; margin-bottom: 1rem;">Failed to Initialize LuMi</h3>
        <p style="margin-bottom: 1rem; color: #6b7280;">
          There was an error starting the application. Please try refreshing the page.
        </p>
        <p style="font-size: 0.875rem; color: #9ca3af; margin-bottom: 1.5rem;">
          Error: ${error.message || error}
        </p>
        <button onclick="location.reload()" style="
          background: #6366f1;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
        ">
          Reload Page
        </button>
      </div>
    `;
    
    document.body.appendChild(errorDiv);
  },

  // Get app info
  getInfo() {
    return {
      version: this.version,
      initialized: this.isInitialized,
      config: this.config,
      user: this.profile
    };
  }
};

// Make available globally
window.LuMi = LuMi;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    LuMi.init();
  });
} else {
  // DOM is already ready
  setTimeout(() => {
    LuMi.init();
  }, 100);
}