/* LuMi - Voice Interaction Module */

const LuMiVoice = {
  isRecording: false,
  recognition: null,
  synth: null,
  isSupported: false,
  
  // Initialize voice functionality
  init() {
    this.checkSupport();
    this.initializeSpeechRecognition();
    this.initializeSpeechSynthesis();
    this.bindEvents();
  },

  // Check browser support
  checkSupport() {
    this.isSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition) && 'speechSynthesis' in window;
    
    if (!this.isSupported) {
      console.warn('Speech recognition or synthesis not supported');
      this.disableVoiceFeatures();
    }
  },

  // Initialize speech recognition
  initializeSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      this.isRecording = true;
      this.updateVoiceUI('recording');
    };

    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      this.handleSpeechResult(finalTranscript || interimTranscript);
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      this.stopRecording();
      LuMiUtils.showToast('Voice recognition error. Please try again.', 'error');
    };

    this.recognition.onend = () => {
      this.isRecording = false;
      this.updateVoiceUI('idle');
    };
  },

  // Initialize speech synthesis
  initializeSpeechSynthesis() {
    if ('speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  },

  // Bind voice events
  bindEvents() {
    const voiceBtn = document.getElementById('voiceBtn');
    if (voiceBtn) {
      voiceBtn.addEventListener('click', () => this.toggleRecording());
    }

    // Listen for keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'v') {
        e.preventDefault();
        this.toggleRecording();
      }
    });
  },

  // Toggle recording state
  toggleRecording() {
    if (!this.isSupported) {
      LuMiUtils.showToast('Voice features not supported in this browser', 'warning');
      return;
    }

    if (this.isRecording) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  },

  // Start recording
  startRecording() {
    if (!this.recognition) {
      LuMiUtils.showToast('Speech recognition not available', 'error');
      return;
    }

    try {
      this.recognition.start();
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      LuMiUtils.showToast('Failed to start voice recording', 'error');
    }
  },

  // Stop recording
  stopRecording() {
    if (this.recognition && this.isRecording) {
      this.recognition.stop();
    }
    this.isRecording = false;
    this.updateVoiceUI('idle');
  },

  // Handle speech recognition result
  handleSpeechResult(transcript) {
    const messageInput = document.getElementById('messageInput');
    if (messageInput && transcript) {
      // Show interim results
      messageInput.value = transcript;
      this.autoResizeTextarea(messageInput);
    }

    // If final result, process it
    if (transcript && !transcript.includes('...')) {
      setTimeout(() => {
        this.processVoiceMessage(transcript);
      }, 100);
    }
  },

  // Process voice message
  processVoiceMessage(transcript) {
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
      messageInput.value = transcript.trim();
      this.autoResizeTextarea(messageInput);
      
      // Optionally auto-send the message
      if (transcript.trim().length > 0) {
        this.autoSendMessage(transcript.trim());
      }
    }
  },

  // Auto-send message if enabled
  autoSendMessage(message) {
    const settings = LuMiUtils.getItem('lumi_voice_settings', { autoSend: false });
    if (settings.autoSend && message.length > 3) {
      setTimeout(() => {
        if (window.LuMiChat) {
          window.LuMiChat.sendMessage();
        }
      }, 500);
    }
  },

  // Speak text using TTS
  speak(text, options = {}) {
    if (!this.synth) {
      console.warn('Speech synthesis not available');
      return;
    }

    // Cancel any ongoing speech
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set voice options
    utterance.rate = options.rate || 1;
    utterance.pitch = options.pitch || 1;
    utterance.volume = options.volume || 1;
    utterance.lang = options.lang || 'en-US';

    // Try to use a preferred voice
    const voices = this.synth.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Google') || 
      voice.name.includes('Microsoft') ||
      voice.lang.startsWith('en')
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      this.updateVoiceUI('speaking');
    };

    utterance.onend = () => {
      this.updateVoiceUI('idle');
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      this.updateVoiceUI('idle');
    };

    this.synth.speak(utterance);
  },

  // Update voice UI
  updateVoiceUI(state) {
    const voiceBtn = document.getElementById('voiceBtn');
    if (!voiceBtn) return;

    const icon = voiceBtn.querySelector('i');
    
    // Remove all state classes
    voiceBtn.classList.remove('recording', 'speaking');
    
    switch (state) {
      case 'recording':
        voiceBtn.classList.add('recording');
        if (icon) {
          icon.className = 'fas fa-stop';
        }
        voiceBtn.title = 'Stop Recording (Ctrl+V)';
        break;
        
      case 'speaking':
        voiceBtn.classList.add('speaking');
        if (icon) {
          icon.className = 'fas fa-volume-up';
        }
        voiceBtn.title = 'Speaking...';
        break;
        
      default:
        if (icon) {
          icon.className = 'fas fa-microphone';
        }
        voiceBtn.title = 'Start Voice Input (Ctrl+V)';
    }
  },

  // Auto-resize textarea
  autoResizeTextarea(textarea) {
    if (!textarea) return;
    
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  },

  // Stop all speech
  stopSpeaking() {
    if (this.synth) {
      this.synth.cancel();
      this.updateVoiceUI('idle');
    }
  },

  // Get available voices
  getVoices() {
    if (this.synth) {
      return this.synth.getVoices();
    }
    return [];
  },

  // Set voice settings
  setVoiceSettings(settings) {
    LuMiUtils.setItem('lumi_voice_settings', settings);
  },

  // Get voice settings
  getVoiceSettings() {
    return LuMiUtils.getItem('lumi_voice_settings', {
      rate: 1,
      pitch: 1,
      volume: 1,
      autoSend: false,
      speakResponses: true
    });
  },

  // Disable voice features (fallback)
  disableVoiceFeatures() {
    const voiceBtn = document.getElementById('voiceBtn');
    if (voiceBtn) {
      voiceBtn.disabled = true;
      voiceBtn.title = 'Voice features not supported';
      voiceBtn.style.opacity = '0.5';
    }
  },

  // Clean up
  destroy() {
    this.stopRecording();
    this.stopSpeaking();
    
    if (this.recognition) {
      this.recognition.onstart = null;
      this.recognition.onresult = null;
      this.recognition.onerror = null;
      this.recognition.onend = null;
    }
  }
};

// Make available globally
window.LuMiVoice = LuMiVoice;