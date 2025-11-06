/* LuMi - Real-time Emotion Tracking */

const LuMiEmotionTracker = {
  currentEmotion: null,
  emotionHistory: [],
  personalityInsights: {},
  isTracking: false,
  updateInterval: 1000, // 1 second
  
  // Initialize emotion tracking
  init() {
    // Load from storage first
    this.loadFromStorage();
    
    // Load history from server
    this.loadHistory();
    this.updateRealTime();
    
    // Start real-time updates if enabled
    this.startRealTimeUpdates();
  },

  // Load emotion history
  async loadHistory(days = 7) {
    try {
      const response = await LuMiAPI.getEmotionHistory(days);
      if (response.success) {
        this.emotionHistory = response.emotions;
        this.updateCharts();
        this.updatePersonalityInsights();
      }
    } catch (error) {
      console.error('Failed to load emotion history:', error);
    }
  },

  // Update from chat response
  updateFromChatResponse(response) {
    if (!response) return;

    // Update current emotion
    const userEmotion = response.user_emotion;
    if (userEmotion) {
      this.currentEmotion = userEmotion;
      this.updateCurrentEmotionDisplay();
    }

    // Update history with new emotion data
    this.addEmotionToHistory(userEmotion);
    
    // Update charts and visualizations
    this.updateCharts();
    
    // Update personality insights
    this.updatePersonalityInsights();
    
    // Update session statistics
    this.updateSessionStatistics();
  },

  // Add emotion to history
  addEmotionToHistory(emotionData) {
    if (!emotionData) return;

    const historyEntry = {
      timestamp: new Date().toISOString(),
      primary_emotion: emotionData.primary_emotion,
      confidence: emotionData.confidence,
      intensity: emotionData.intensity,
      all_emotions: emotionData.all_emotions,
      personality_insights: emotionData.personality_insights,
      cognitive_patterns: emotionData.cognitive_patterns,
      sentiment_score: emotionData.sentiment_score
    };

    this.emotionHistory.unshift(historyEntry);
    
    // Keep only last 1000 entries
    if (this.emotionHistory.length > 1000) {
      this.emotionHistory = this.emotionHistory.slice(0, 1000);
    }

    // Save to local storage for persistence
    LuMiUtils.setItem('lumi_emotion_history', this.emotionHistory);
  },

  // Update current emotion display
  updateCurrentEmotionDisplay() {
    if (!this.currentEmotion) return;

    const emotionEl = document.getElementById('currentEmotion');
    const emotionName = document.getElementById('emotionName');
    const emotionScore = document.getElementById('emotionScore');

    if (emotionName) {
      emotionName.textContent = this.capitalizeFirst(this.currentEmotion.primary_emotion);
    }

    if (emotionScore) {
      const percentage = Math.round(this.currentEmotion.confidence * 100);
      emotionScore.textContent = `${percentage}%`;
    }

    // Update gauge color
    this.updateEmotionGauge(this.currentEmotion);

    // Add floating emotion animation
    this.createFloatingEmotion();
  },

  // Update emotion gauge
  updateEmotionGauge(emotionData) {
    const gaugeChart = Chart.getChart('gaugeChart');
    if (!gaugeChart || !emotionData) return;

    const emotion = emotionData.primary_emotion;
    const confidence = emotionData.confidence;
    const color = LuMiUtils.getEmotionColor(emotion);

    // Update the gauge data
    gaugeChart.data.datasets[0].data = [confidence, 1 - confidence];
    gaugeChart.data.datasets[0].backgroundColor = [color, '#e5e7eb'];
    
    gaugeChart.update('active');
  },

  // Create floating emotion animation
  createFloatingEmotion() {
    if (!this.currentEmotion) return;

    const emotion = this.currentEmotion.primary_emotion;
    const icon = LuMiUtils.getEmotionIcon(emotion);
    
    const floatEl = document.createElement('div');
    floatEl.className = 'emotion-float';
    floatEl.textContent = icon;
    floatEl.style.color = LuMiUtils.getEmotionColor(emotion);
    
    // Random position near emotion display
    const container = document.getElementById('emotionPanel');
    if (container) {
      const rect = container.getBoundingClientRect();
      const x = Math.random() * 200 + 50;
      const y = 20;
      
      floatEl.style.left = x + 'px';
      floatEl.style.top = y + 'px';
      
      container.appendChild(floatEl);
      
      // Remove after animation
      setTimeout(() => {
        if (floatEl.parentNode) {
          floatEl.parentNode.removeChild(floatEl);
        }
      }, 3000);
    }
  },

  // Update charts
  updateCharts() {
    this.updateRadarChart();
    this.updateTimelineChart();
    this.updatePersonalityBars();
    
    // Also update the standalone charts module
    if (window.LuMiCharts && this.emotionHistory.length > 0) {
      window.LuMiCharts.updateTimeline(this.emotionHistory);
    }
  },

  // Update radar chart
  updateRadarChart() {
    const radarChart = Chart.getChart('radarChart');
    if (!radarChart || this.emotionHistory.length === 0) return;

    // Calculate average emotion scores
    const emotionSums = {};
    const emotionCounts = {};
    
    this.emotionHistory.slice(0, 20).forEach(entry => { // Last 20 emotions
      if (entry.all_emotions) {
        Object.entries(entry.all_emotions).forEach(([emotion, score]) => {
          emotionSums[emotion] = (emotionSums[emotion] || 0) + score;
          emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
        });
      }
    });

    const emotions = ['joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust', 
                     'anxiety', 'confidence', 'confusion', 'curiosity'];
    const data = emotions.map(emotion => {
      if (emotionSums[emotion] && emotionCounts[emotion]) {
        return emotionSums[emotion] / emotionCounts[emotion];
      }
      return 0;
    });

    radarChart.data.datasets[0].data = data;
    radarChart.update('active');
  },

  // Update timeline chart
  updateTimelineChart() {
    const timelineChart = Chart.getChart('timelineChart');
    if (!timelineChart) return;

    // Process emotion history for timeline - last 24 hours
    const last24Hours = this.emotionHistory.filter(entry => {
      const entryTime = new Date(entry.timestamp);
      const now = new Date();
      return (now - entryTime) < 24 * 60 * 60 * 1000; // Last 24 hours
    });

    // Group emotions by hour
    const hourlyData = {};
    for (let i = 0; i < 24; i++) {
      hourlyData[i] = { positive: 0, total: 0 };
    }

    last24Hours.forEach(entry => {
      const hour = new Date(entry.timestamp).getHours();
      const isPositive = ['joy', 'confidence', 'curiosity', 'excitement'].includes(entry.primary_emotion);
      
      hourlyData[hour].total++;
      if (isPositive) {
        hourlyData[hour].positive++;
      }
    });

    // Calculate percentages
    const data = Object.values(hourlyData).map(hour => {
      if (hour.total === 0) return 0;
      return Math.round((hour.positive / hour.total) * 100);
    });

    // Update chart
    timelineChart.data.datasets[0].data = data;
    timelineChart.update('active');
  },

  // Update personality bars
  updatePersonalityBars() {
    const personalityContainer = document.getElementById('personalityBars');
    if (!personalityContainer) return;

    if (this.emotionHistory.length === 0) return;

    // Calculate personality scores
    const personalityScores = {
      openness: 0,
      conscientiousness: 0,
      extraversion: 0,
      agreeableness: 0,
      neuroticism: 0
    };

    const counts = { openness: 0, conscientiousness: 0, extraversion: 0, agreeableness: 0, neuroticism: 0 };

    this.emotionHistory.slice(0, 50).forEach(entry => { // Last 50 entries
      if (entry.personality_insights) {
        Object.entries(entry.personality_insights).forEach(([trait, score]) => {
          if (personalityScores[trait] !== undefined) {
            personalityScores[trait] += score;
            counts[trait] += 1;
          }
        });
      }
    });

    // Calculate averages
    const averages = {};
    Object.entries(personalityScores).forEach(([trait, total]) => {
      averages[trait] = counts[trait] > 0 ? total / counts[trait] : 0;
    });

    // Render personality bars
    personalityContainer.innerHTML = '';
    Object.entries(averages).forEach(([trait, score]) => {
      const bar = this.createPersonalityBar(trait, score);
      personalityContainer.appendChild(bar);
    });
  },

  // Create personality bar
  createPersonalityBar(trait, score) {
    const bar = LuMiUtils.createElement('div', 'personality-bar');
    
    const label = LuMiUtils.createElement('div', 'personality-label');
    label.textContent = trait;
    
    const container = LuMiUtils.createElement('div', 'personality-bar-container');
    const fill = LuMiUtils.createElement('div', 'personality-bar-fill');
    fill.style.width = `${score * 100}%`;
    container.appendChild(fill);
    
    const value = LuMiUtils.createElement('div', 'personality-value');
    value.textContent = Math.round(score * 100);
    
    bar.appendChild(label);
    bar.appendChild(container);
    bar.appendChild(value);
    
    return bar;
  },

  // Update session statistics
  updateSessionStatistics() {
    if (this.emotionHistory.length === 0) return;

    // Calculate statistics
    const totalMessages = this.emotionHistory.length;
    const avgIntensity = this.emotionHistory.reduce((sum, entry) => 
      sum + (entry.intensity || 0), 0) / totalMessages;
    
    const emotionCounts = {};
    this.emotionHistory.forEach(entry => {
      const emotion = entry.primary_emotion || 'neutral';
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
    });
    
    const dominantEmotion = Object.entries(emotionCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'none';

    // Update UI
    const totalEl = document.getElementById('totalMessages');
    const intensityEl = document.getElementById('avgEmotionIntensity');
    const dominantEl = document.getElementById('dominantEmotion');

    if (totalEl) totalEl.textContent = totalMessages;
    if (intensityEl) intensityEl.textContent = Math.round(avgIntensity * 100) + '%';
    if (dominantEl) dominantEl.textContent = this.capitalizeFirst(dominantEmotion);
  },

  // Update personality insights
  updatePersonalityInsights() {
    if (this.emotionHistory.length === 0) return;

    const insights = {
      dominant_emotions: this.getTopEmotions(),
      emotional_stability: this.calculateEmotionalStability(),
      communication_style: this.analyzeCommunicationStyle(),
      stress_indicators: this.identifyStressIndicators()
    };

    this.personalityInsights = insights;
    LuMiUtils.setItem('lumi_personality_insights', insights);
  },

  // Get top emotions
  getTopEmotions() {
    const emotionCounts = {};
    this.emotionHistory.forEach(entry => {
      const emotion = entry.primary_emotion || 'neutral';
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
    });

    return Object.entries(emotionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([emotion, count]) => ({ emotion, count }));
  },

  // Calculate emotional stability
  calculateEmotionalStability() {
    if (this.emotionHistory.length < 2) return 0.5;

    const recent = this.emotionHistory.slice(0, 10);
    const emotions = recent.map(e => e.primary_emotion);
    
    const unique = new Set(emotions).size;
    const stability = 1 - (unique / emotions.length);
    
    return Math.max(0, Math.min(1, stability));
  },

  // Analyze communication style
  analyzeCommunicationStyle() {
    const analysis = {
      sentiment: 0,
      complexity: 0,
      expressiveness: 0
    };

    this.emotionHistory.slice(0, 20).forEach(entry => {
      if (entry.sentiment_score) {
        analysis.sentiment += entry.sentiment_score;
      }
      if (entry.text_length) {
        analysis.complexity += entry.text_length;
      }
      if (entry.intensity) {
        analysis.expressiveness += entry.intensity;
      }
    });

    const count = Math.min(20, this.emotionHistory.length);
    analysis.sentiment /= count;
    analysis.complexity = Math.min(1, analysis.complexity / (count * 100));
    analysis.expressiveness /= count;

    return analysis;
  },

  // Identify stress indicators
  identifyStressIndicators() {
    const stressEmotions = ['anxiety', 'fear', 'frustration'];
    const stressCount = this.emotionHistory.filter(entry => 
      stressEmotions.includes(entry.primary_emotion)
    ).length;

    return {
      level: stressCount / this.emotionHistory.length,
      dominant_stress_emotion: this.getTopEmotions().find(e => 
        stressEmotions.includes(e.emotion)
      )?.emotion || 'none'
    };
  },

  // Update real-time tracking
  updateRealTime() {
    if (this.isTracking) {
      this.updateCurrentEmotionDisplay();
    }
  },

  // Start/stop real-time updates
  startRealTimeUpdates() {
    if (this.isTracking) return;
    
    this.isTracking = true;
    this.realTimeInterval = setInterval(() => {
      this.updateRealTime();
    }, this.updateInterval);
  },

  stopRealTimeUpdates() {
    this.isTracking = false;
    if (this.realTimeInterval) {
      clearInterval(this.realTimeInterval);
      this.realTimeInterval = null;
    }
  },

  // Export emotion data
  exportEmotionData() {
    const data = {
      emotion_history: this.emotionHistory,
      personality_insights: this.personalityInsights,
      export_timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lumi_emotion_data_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
  },

  // Utility methods
  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  // Initialize from local storage
  loadFromStorage() {
    const history = LuMiUtils.getItem('lumi_emotion_history', []);
    const insights = LuMiUtils.getItem('lumi_personality_insights', {});
    
    this.emotionHistory = history;
    this.personalityInsights = insights;
  }
};

// Make available globally
window.LuMiEmotionTracker = LuMiEmotionTracker;