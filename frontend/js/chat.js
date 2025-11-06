/* LuMi - Chat Interface Functionality */

const LuMiChat = {
  currentConversation: null,
  conversations: [],
  isTyping: false,
  messageQueue: [],
  shouldRefreshConversations: false,
  
  // Initialize chat interface
  init() {
    this.bindEvents();
    this.loadConversations();
    this.updateEmotionDisplay({ primary_emotion: 'neutral', confidence: 0.5 });
  },

  // Event bindings
  bindEvents() {
    // Send message
    const sendBtn = document.getElementById('sendBtn');
    const messageInput = document.getElementById('messageInput');
    
    if (sendBtn) {
      sendBtn.addEventListener('click', () => this.sendMessage());
    }
    
    if (messageInput) {
      // Enter to send, Shift+Enter for new line
      messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
      
      // Auto-resize textarea
      messageInput.addEventListener('input', this.autoResizeTextarea.bind(this));
      
      // Track typing for emotion analysis
      let typingTimeout;
      messageInput.addEventListener('input', () => {
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
          this.analyzeInputEmotion(messageInput.value);
        }, 1000);
      });
    }

    // Conversation list
    const newChatBtn = document.getElementById('newChatBtn');
    if (newChatBtn) {
      newChatBtn.addEventListener('click', () => this.startNewConversation());
    }

    // Sidebar toggle
    const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
    if (toggleSidebarBtn) {
      toggleSidebarBtn.addEventListener('click', () => this.toggleSidebar());
    }

    // Emotion panel toggle
    const emotionAnalysisBtn = document.getElementById('emotionAnalysisBtn');
    const closeEmotionPanel = document.getElementById('closeEmotionPanel');
    
    if (emotionAnalysisBtn) {
      emotionAnalysisBtn.addEventListener('click', () => this.toggleEmotionPanel());
    }
    
    if (closeEmotionPanel) {
      closeEmotionPanel.addEventListener('click', () => this.toggleEmotionPanel());
    }
  },

  // Auto-resize textarea
  autoResizeTextarea() {
    const textarea = event.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  },

  // Send message
  async sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (!message) {
      LuMiUtils.showToast('Please enter a message', 'warning');
      return;
    }

    // Clear input
    messageInput.value = '';
    this.autoResizeTextarea();

    // Disable send button
    this.setSendButtonState(false);

    try {
      // Add user message to UI immediately
      this.addMessage('user', message);
      
      // Show typing indicator
      this.showTypingIndicator();
      
      // Send to API
      const response = await LuMiAPI.sendMessage(message, this.currentConversation?.id);
      
      // Hide typing indicator
      this.hideTypingIndicator();
      
      // Add AI response
      if (response.success) {
        this.currentConversation = response;
        this.addMessage('assistant', response.response.content, response.response);
        
        // Update emotion analysis
        this.updateEmotionDisplay(response.user_emotion);
        this.updateEmotionPanel(response);
        
        // Only refresh conversations if this is a new conversation that just got created
        // Don't refresh on every message - only when the conversation ID changes
        if (this.currentConversation?.id && this.currentConversation.id !== this.conversations.find(c => c.id === this.currentConversation.id)?.id) {
          this.refreshConversations();
        }
      }
      
    } catch (error) {
      this.hideTypingIndicator();
      const errorMessage = LuMiAPI.ErrorHandler.handle(error, 'Send Message');
      LuMiUtils.showToast(errorMessage, 'error');
      
      // Re-enable send button
      this.setSendButtonState(true);
    }
  },

  // Add message to chat
  addMessage(role, content, messageData = null) {
    const messagesContainer = document.getElementById('messagesContainer');
    if (!messagesContainer) return;

    // Remove welcome message if it exists
    const welcomeMessage = messagesContainer.querySelector('.welcome-message');
    if (welcomeMessage) {
      welcomeMessage.remove();
    }

    const messageEl = this.createMessageElement(role, content, messageData);
    messagesContainer.appendChild(messageEl);
    
    // Scroll to bottom
    LuMiUtils.scrollToBottom(messagesContainer);
    
    // Re-enable send button after user message
    if (role === 'user') {
      setTimeout(() => this.setSendButtonState(true), 500);
    }
  },

  // Create message element
  createMessageElement(role, content, messageData = null) {
    const message = LuMiUtils.createElement('div', `message ${role}`);
    
    const avatar = LuMiUtils.createElement('div', 'message-avatar');
    avatar.innerHTML = role === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-brain"></i>';
    
    const contentEl = LuMiUtils.createElement('div', 'message-content');
    const bubble = LuMiUtils.createElement('div', 'message-bubble');
    bubble.innerHTML = this.formatMessageContent(content);
    
    const timestamp = LuMiUtils.createElement('div', 'message-timestamp');
    timestamp.textContent = LuMiUtils.formatTime(new Date());
    
    // Add emotion analysis badge if available
    if (messageData && messageData.emotion_analysis) {
      const emotionBadge = this.createEmotionBadge(messageData.emotion_analysis);
      timestamp.appendChild(emotionBadge);
    }
    
    contentEl.appendChild(bubble);
    contentEl.appendChild(timestamp);
    message.appendChild(avatar);
    message.appendChild(contentEl);
    
    return message;
  },

  // Format message content
  formatMessageContent(content) {
    if (!content) return '';
    
    let formatted = content
      // Headers
      .replace(/^### (.*$)/gm, '<h3 class="message-h3">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="message-h2">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="message-h1">$1</h1>')
      // Bold and italic
      .replace(/\*\*(.*?)\*\*/g, '<strong class="message-bold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="message-italic">$1</em>')
      .replace(/`([^`]+)`/g, '<code class="message-code">$1</code>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="message-link" target="_blank" rel="noopener noreferrer">$1</a>')
      // Line breaks
      .replace(/\n/g, '\n');
    
    // Handle lists
    formatted = this.formatLists(formatted);
    
    // Handle code blocks
    formatted = this.formatCodeBlocks(formatted);
    
    // Handle tables
    formatted = this.formatTables(formatted);
    
    // Handle simple line breaks
    formatted = formatted.replace(/\n\n/g, '</p><p class="message-paragraph">')
                         .replace(/\n/g, '<br>');
    
    return `<p class="message-paragraph">${formatted}</p>`;
  },

  // Format lists
  formatLists(content) {
    // Ordered lists
    content = content.replace(/^(\d+)\. (.*)$/gm, '<li class="message-list-item">$2</li>');
    content = content.replace(/(<li class="message-list-item">.*<\/li>)/gs, '<ol class="message-list">$1</ol>');
    
    // Unordered lists
    content = content.replace(/^[-*+] (.*)$/gm, '<li class="message-list-item">$1</li>');
    content = content.replace(/(<li class="message-list-item">.*<\/li>)/gs, '<ul class="message-list">$1</ul>');
    
    return content;
  },

  // Format code blocks
  formatCodeBlocks(content) {
    // Block code with triple backticks
    content = content.replace(/```([\s\S]*?)```/g, '<pre class="message-codeblock"><code>$1</code></pre>');
    return content;
  },

  // Format tables
  formatTables(content) {
    const lines = content.split('\n');
    let tableStart = -1;
    let tableLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('|') && lines[i].split('|').length > 2) {
        if (tableStart === -1) tableStart = i;
        tableLines.push(lines[i]);
      } else if (tableStart !== -1) {
        // Process the table
        const table = this.createTable(tableLines);
        content = content.split('\n').slice(0, tableStart).join('\n').concat(
          '\n' + table + '\n' +
          lines.slice(i).join('\n')
        );
        tableStart = -1;
        tableLines = [];
      }
    }
    
    // Handle table at end of content
    if (tableStart !== -1) {
      const table = this.createTable(tableLines);
      content = content.split('\n').slice(0, tableStart).join('\n').concat('\n' + table);
    }
    
    return content;
  },

  // Create HTML table from markdown-like syntax
  createTable(lines) {
    if (lines.length < 2) return lines.join('<br>');
    
    let headers = lines[0].split('|').map(h => h.trim()).filter(h => h);
    let separator = lines[1].split('|').map(s => s.trim()).filter(s => s);
    
    let tableHTML = '<table class="message-table">';
    tableHTML += '<thead><tr>';
    headers.forEach(header => {
      tableHTML += `<th class="message-table-header">${header}</th>`;
    });
    tableHTML += '</tr></thead><tbody>';
    
    for (let i = 2; i < lines.length; i++) {
      const cells = lines[i].split('|').map(c => c.trim()).filter(c => c);
      if (cells.length > 0) {
        tableHTML += '<tr>';
        cells.forEach(cell => {
          tableHTML += `<td class="message-table-cell">${cell}</td>`;
        });
        tableHTML += '</tr>';
      }
    }
    
    tableHTML += '</tbody></table>';
    return tableHTML;
  },

  // Create emotion badge
  createEmotionBadge(emotionData) {
    const badge = LuMiUtils.createElement('span', 'emotion-analysis-badge');
    const emotion = emotionData.primary_emotion || 'neutral';
    const confidence = Math.round((emotionData.confidence || 0) * 100);
    
    badge.innerHTML = `
      <span>${LuMiUtils.getEmotionIcon(emotion)}</span>
      <span>${emotion} ${confidence}%</span>
    `;
    
    badge.addEventListener('click', () => {
      this.showDetailedEmotionAnalysis(emotionData);
    });
    
    return badge;
  },

  // Show typing indicator
  showTypingIndicator() {
    if (this.isTyping) return;
    
    const messagesContainer = document.getElementById('messagesContainer');
    if (!messagesContainer) return;

    const typingEl = LuMiUtils.createElement('div', 'message assistant typing-indicator');
    typingEl.innerHTML = `
      <div class="message-avatar">
        <i class="fas fa-brain"></i>
      </div>
      <div class="message-content">
        <div class="message-bubble">
          <div class="typing-dots">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
          </div>
        </div>
      </div>
    `;
    
    messagesContainer.appendChild(typingEl);
    LuMiUtils.scrollToBottom(messagesContainer);
    this.isTyping = true;
  },

  // Hide typing indicator
  hideTypingIndicator() {
    const typingEl = document.querySelector('.typing-indicator');
    if (typingEl) {
      typingEl.remove();
    }
    this.isTyping = false;
  },

  // Set send button state
  setSendButtonState(enabled) {
    const sendBtn = document.getElementById('sendBtn');
    if (sendBtn) {
      sendBtn.disabled = !enabled;
    }
  },

  // Start new conversation
  startNewConversation() {
    this.currentConversation = null;
    
    // Clear messages
    const messagesContainer = document.getElementById('messagesContainer');
    if (messagesContainer) {
      messagesContainer.innerHTML = `
        <div class="welcome-message">
          <div class="welcome-content">
            <i class="fas fa-heart"></i>
            <h2>Hi there! I'm LuMi 💜</h2>
            <p>I'm here to listen and support you. Share what's on your mind, and together we'll explore your emotions and thoughts. What's on your heart today?</p>
          </div>
        </div>
      `;
    }
    
    // Update header
    this.updateHeaderTitle('Chat with LuMi');
    
    // Reset emotion display
    this.updateEmotionDisplay({ primary_emotion: 'neutral', confidence: 0.5 });
  },

  // Load conversations
  async loadConversations() {
    try {
      const response = await LuMiAPI.getConversations();
      if (response.success) {
        this.conversations = response.conversations;
        this.renderConversations();
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  },

  // Render conversations
  renderConversations() {
    const conversationList = document.getElementById('conversationList');
    if (!conversationList) return;

    conversationList.innerHTML = '';
    
    this.conversations.forEach(conv => {
      const item = this.createConversationItem(conv);
      conversationList.appendChild(item);
    });
  },

  // Create conversation item
  createConversationItem(conversation) {
    const item = LuMiUtils.createElement('div', 'conversation-item');
    if (this.currentConversation?.id === conversation.id) {
      item.classList.add('active');
    }
    
    const icon = LuMiUtils.createElement('div', 'conversation-icon');
    icon.innerHTML = '<i class="fas fa-comments"></i>';
    
    const info = LuMiUtils.createElement('div', 'conversation-info');
    const title = LuMiUtils.createElement('div', 'conversation-title');
    // Better title handling - use actual title or generate from first message
    title.textContent = this.getConversationTitle(conversation);
    
    const preview = LuMiUtils.createElement('div', 'conversation-preview');
    preview.textContent = this.getConversationPreview(conversation);
    
    const meta = LuMiUtils.createElement('div', 'conversation-meta');
    meta.innerHTML = `
      <i class="fas fa-clock"></i>
      <span>${this.formatConversationTime(conversation.updated_at)}</span>
    `;
    
    info.appendChild(title);
    info.appendChild(preview);
    info.appendChild(meta);
    
    item.appendChild(icon);
    item.appendChild(info);
    
    item.addEventListener('click', () => this.loadConversation(conversation.id));
    
    return item;
  },

  // Get conversation title
  getConversationTitle(conversation) {
    // Use the actual conversation title if available
    if (conversation.title && conversation.title !== 'New Conversation') {
      return conversation.title;
    }
    
    // Generate title from first user message
    if (conversation.messages && conversation.messages.length > 0) {
      const firstUserMessage = conversation.messages.find(msg => msg.role === 'user');
      if (firstUserMessage) {
        const titleText = firstUserMessage.content.substring(0, 30);
        return titleText + (firstUserMessage.content.length > 30 ? '...' : '');
      }
    }
    
    return 'New Conversation';
  },

  // Get conversation preview
  getConversationPreview(conversation) {
    if (conversation.messages && conversation.messages.length > 0) {
      const lastMessage = conversation.messages[conversation.messages.length - 1];
      const content = lastMessage.content || 'No content';
      return content.substring(0, 60) + (content.length > 60 ? '...' : '');
    }
    return 'No messages yet';
  },

  // Format conversation time (better time handling)
  formatConversationTime(timestamp) {
    if (!timestamp) return 'Unknown time';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  },

  // Load conversation
  async loadConversation(conversationId) {
    try {
      const response = await LuMiAPI.getConversation(conversationId);
      if (response.success) {
        this.currentConversation = response.conversation;
        this.renderConversation();
        this.updateHeaderTitle(this.currentConversation.title);
      }
    } catch (error) {
      LuMiAPI.ErrorHandler.showError(error, 'Load Conversation');
    }
  },

  // Render conversation
  renderConversation() {
    if (!this.currentConversation) return;
    
    const messagesContainer = document.getElementById('messagesContainer');
    if (!messagesContainer) return;

    messagesContainer.innerHTML = '';
    
    this.currentConversation.messages.forEach(msg => {
      const messageEl = this.createMessageElement(msg.role, msg.content, msg);
      messagesContainer.appendChild(messageEl);
    });
    
    LuMiUtils.scrollToBottom(messagesContainer);
    this.renderConversations();
  },

  // Refresh conversations list
  refreshConversations() {
    this.loadConversations();
  },

  // Update header title
  updateHeaderTitle(title) {
    const titleEl = document.getElementById('currentConversationTitle');
    if (titleEl) {
      titleEl.textContent = title;
    }
  },

  // Update emotion display
  updateEmotionDisplay(emotionData) {
    const emotionEl = document.getElementById('currentEmotion');
    if (!emotionEl) return;

    const label = emotionEl.querySelector('.emotion-label');
    const pulse = emotionEl.querySelector('.emotion-pulse');
    
    if (label) {
      label.textContent = emotionData.primary_emotion || 'neutral';
    }
    
    // Update color based on emotion
    const color = LuMiUtils.getEmotionColor(emotionData.primary_emotion);
    if (pulse) {
      pulse.style.backgroundColor = color;
    }
    
    // Add animation class
    emotionEl.classList.add('emotion-update');
    setTimeout(() => {
      emotionEl.classList.remove('emotion-update');
    }, 500);
  },

  // Analyze input emotion
  analyzeInputEmotion(text) {
    if (text.length < 10) return; // Only analyze substantial text
    
    LuMiAPI.analyzeText(text)
      .then(response => {
        if (response.success) {
          this.updateEmotionDisplay(response.analysis);
        }
      })
      .catch(error => {
        console.error('Input emotion analysis failed:', error);
      });
  },

  // Update emotion panel
  updateEmotionPanel(response) {
    if (window.LuMiEmotionTracker) {
      window.LuMiEmotionTracker.updateFromChatResponse(response);
    }
  },

  // Toggle sidebar
  toggleSidebar() {
    const sidebar = document.getElementById('conversationSidebar');
    if (sidebar) {
      sidebar.classList.toggle('collapsed');
    }
  },

  // Toggle emotion panel
  toggleEmotionPanel() {
    const panel = document.getElementById('emotionPanel');
    if (panel) {
      panel.classList.toggle('collapsed');
    }
  },

  // Show detailed emotion analysis
  showDetailedEmotionAnalysis(emotionData) {
    // This would open a modal with detailed analysis
    console.log('Detailed emotion analysis:', emotionData);
  },

  // Clear chat
  clearChat() {
    const messagesContainer = document.getElementById('messagesContainer');
    if (messagesContainer) {
      messagesContainer.innerHTML = '';
    }
    this.startNewConversation();
  }
};

// Make available globally
window.LuMiChat = LuMiChat;