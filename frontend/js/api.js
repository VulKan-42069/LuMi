/* LuMi - API Communication Module */

const LuMiAPI = {
  baseURL: window.location.origin + '/api',
  timeout: 30000, // 30 seconds

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    // Add auth token if available
    const token = localStorage.getItem('lumi_session_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          error: 'Network error' 
        }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${url}`, error);
      throw error;
    }
  },

  // Chat API methods
  async sendMessage(message, conversationId = null) {
    try {
      return await this.request('/chat/message', {
        method: 'POST',
        body: JSON.stringify({
          message,
          conversation_id: conversationId
        })
      });
    } catch (error) {
      throw new Error(`Failed to send message: ${error.message}`);
    }
  },

  async getConversations() {
    try {
      return await this.request('/chat/conversations');
    } catch (error) {
      throw new Error(`Failed to get conversations: ${error.message}`);
    }
  },

  async getConversation(conversationId) {
    try {
      return await this.request(`/chat/conversation/${conversationId}`);
    } catch (error) {
      throw new Error(`Failed to get conversation: ${error.message}`);
    }
  },

  async deleteConversation(conversationId) {
    try {
      return await this.request(`/chat/conversation/${conversationId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      throw new Error(`Failed to delete conversation: ${error.message}`);
    }
  },

  // User API methods
  async register(userData) {
    try {
      return await this.request('/user/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
    } catch (error) {
      throw new Error(`Registration failed: ${error.message}`);
    }
  },

  async login(username, password) {
    try {
      return await this.request('/user/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    }
  },

  async logout() {
    try {
      return await this.request('/user/logout', {
        method: 'POST'
      });
    } catch (error) {
      console.error('Logout failed:', error);
      return { success: true }; // Continue with logout locally
    }
  },

  async getProfile() {
    try {
      return await this.request('/user/profile');
    } catch (error) {
      throw new Error(`Failed to get profile: ${error.message}`);
    }
  },

  async updateProfile(profileData) {
    try {
      return await this.request('/user/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData)
      });
    } catch (error) {
      throw new Error(`Failed to update profile: ${error.message}`);
    }
  },

  async checkAuth() {
    try {
      return await this.request('/user/check');
    } catch (error) {
      return { authenticated: false };
    }
  },

  // Emotion API methods
  async getEmotionHistory(days = 7) {
    try {
      return await this.request(`/emotion/history?days=${days}`);
    } catch (error) {
      throw new Error(`Failed to get emotion history: ${error.message}`);
    }
  },

  async getEmotionStatistics(days = 7) {
    try {
      return await this.request(`/emotion/statistics?days=${days}`);
    } catch (error) {
      throw new Error(`Failed to get emotion statistics: ${error.message}`);
    }
  },

  async analyzeText(text) {
    try {
      return await this.request('/emotion/analyze-text', {
        method: 'POST',
        body: JSON.stringify({ text })
      });
    } catch (error) {
      throw new Error(`Failed to analyze text: ${error.message}`);
    }
  },

  // File API methods
  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('lumi_session_token');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseURL}/files/upload`, {
        method: 'POST',
        headers,
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          error: 'Upload failed' 
        }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`File upload failed: ${error.message}`);
    }
  },

  async listFiles() {
    try {
      return await this.request('/files/list');
    } catch (error) {
      throw new Error(`Failed to list files: ${error.message}`);
    }
  },

  async analyzeFileContent(content) {
    try {
      return await this.request('/files/analyze', {
        method: 'POST',
        body: JSON.stringify({ content })
      });
    } catch (error) {
      throw new Error(`Failed to analyze file: ${error.message}`);
    }
  },

  // Health check
  async healthCheck() {
    try {
      return await this.request('/health');
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }
};

// Session management
LuMiAPI.Session = {
  token: null,
  user: null,

  setToken(token) {
    this.token = token;
    localStorage.setItem('lumi_session_token', token);
  },

  getToken() {
    if (!this.token) {
      this.token = localStorage.getItem('lumi_session_token');
    }
    return this.token;
  },

  clearToken() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('lumi_session_token');
    localStorage.removeItem('lumi_user');
  },

  setUser(user) {
    this.user = user;
    localStorage.setItem('lumi_user', JSON.stringify(user));
  },

  getUser() {
    if (!this.user) {
      const userData = localStorage.getItem('lumi_user');
      if (userData) {
        this.user = JSON.parse(userData);
      }
    }
    return this.user;
  },

  async initialize() {
    try {
      const authStatus = await LuMiAPI.checkAuth();
      if (authStatus.authenticated) {
        this.setToken(authStatus.session_token);
        this.setUser(authStatus.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Session initialization failed:', error);
      return false;
    }
  }
};

// Error handling
LuMiAPI.ErrorHandler = {
  handle(error, context = 'API Request') {
    console.error(`${context}:`, error);
    
    let userMessage = 'An unexpected error occurred';
    
    if (error.message.includes('Network')) {
      userMessage = 'Network connection error. Please check your internet connection.';
    } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      userMessage = 'You are not authorized. Please log in again.';
      // Clear session on auth errors
      LuMiAPI.Session.clearToken();
    } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
      userMessage = 'You do not have permission to perform this action.';
    } else if (error.message.includes('404')) {
      userMessage = 'The requested resource was not found.';
    } else if (error.message.includes('500')) {
      userMessage = 'Server error. Please try again later.';
    } else if (error.message.includes('timeout')) {
      userMessage = 'Request timed out. Please try again.';
    }

    return userMessage;
  },

  showError(error, context = 'Error') {
    const userMessage = this.handle(error, context);
    if (window.LuMiUtils) {
      window.LuMiUtils.showToast(userMessage, 'error');
    } else {
      alert(userMessage);
    }
  }
};

// Rate limiting
LuMiAPI.RateLimiter = {
  requests: new Map(),
  maxRequests: 10, // Max requests per minute
  windowMs: 60000, // 1 minute

  canMakeRequest(endpoint) {
    const now = Date.now();
    const key = endpoint;
    
    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }
    
    const timestamps = this.requests.get(key);
    
    // Remove old timestamps
    const validTimestamps = timestamps.filter(timestamp => 
      now - timestamp < this.windowMs
    );
    
    this.requests.set(key, validTimestamps);
    
    if (validTimestamps.length >= this.maxRequests) {
      return false;
    }
    
    validTimestamps.push(now);
    return true;
  },

  getWaitTime(endpoint) {
    const timestamps = this.requests.get(endpoint) || [];
    if (timestamps.length === 0) return 0;
    
    const oldest = Math.min(...timestamps);
    const now = Date.now();
    return Math.max(0, this.windowMs - (now - oldest));
  }
};

// Auto-retry with exponential backoff
LuMiAPI.retry = async function(endpoint, options, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        // Rate limiting
        const waitTime = this.RateLimiter.getWaitTime(endpoint);
        if (waitTime > 0) {
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      return await this.request(endpoint, options);
    } catch (error) {
      lastError = error;
      
      // Don't retry on certain errors
      if (error.message.includes('401') || 
          error.message.includes('403') || 
          error.message.includes('404')) {
        break;
      }
      
      if (attempt === maxRetries) {
        break;
      }
    }
  }
  
  throw lastError;
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LuMiAPI;
}