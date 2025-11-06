/* LuMi - Chart Visualization Module */

const LuMiCharts = {
  gaugeChart: null,
  radarChart: null,
  timelineChart: null,

  // Initialize all charts
  init() {
    this.initGaugeChart();
    this.initRadarChart();
    this.initTimelineChart();
  },

  // Initialize emotion gauge chart
  initGaugeChart() {
    const ctx = document.getElementById('gaugeChart');
    if (!ctx) return;

    this.gaugeChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        datasets: [{
          data: [0.5, 0.5],
          backgroundColor: ['#6b7280', '#e5e7eb'],
          borderWidth: 0,
          cutout: '75%'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            enabled: false
          }
        },
        elements: {
          arc: {
            borderWidth: 0
          }
        },
        animation: {
          animateRotate: true,
          duration: 1000
        }
      }
    });
  },

  // Initialize radar chart for emotion profile
  initRadarChart() {
    const ctx = document.getElementById('radarChart');
    if (!ctx) return;

    this.radarChart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['Joy', 'Sadness', 'Anger', 'Fear', 'Surprise', 'Disgust', 
                 'Anxiety', 'Confidence', 'Confusion', 'Curiosity'],
        datasets: [{
          label: 'Emotion Profile',
          data: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
          backgroundColor: 'rgba(99, 102, 241, 0.2)',
          borderColor: '#6366f1',
          borderWidth: 2,
          pointBackgroundColor: '#6366f1',
          pointBorderColor: '#ffffff',
          pointHoverBackgroundColor: '#ffffff',
          pointHoverBorderColor: '#6366f1',
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.label}: ${Math.round(context.parsed.r * 100)}%`;
              }
            }
          }
        },
        scales: {
          r: {
            beginAtZero: true,
            max: 1,
            ticks: {
              stepSize: 0.2,
              callback: function(value) {
                return Math.round(value * 100) + '%';
              }
            },
            grid: {
              color: '#e5e7eb'
            },
            angleLines: {
              color: '#e5e7eb'
            },
            pointLabels: {
              font: {
                size: 11
              },
              color: '#6b7280'
            }
          }
        },
        animation: {
          duration: 1000,
          easing: 'easeInOutQuart'
        }
      }
    });
  },

  // Initialize timeline chart
  initTimelineChart() {
    const ctx = document.getElementById('timelineChart');
    if (!ctx) return;

    this.timelineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: Array.from({length: 24}, (_, i) => i + ':00'),
        datasets: [{
          label: 'Positive Emotions %',
          data: Array(24).fill(0),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `Positive: ${Math.round(context.parsed.y)}%`;
              }
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Time',
              font: {
                size: 11
              },
              color: '#6b7280'
            },
            grid: {
              display: false
            },
            ticks: {
              color: '#6b7280',
              font: {
                size: 10
              },
              maxRotation: 45
            }
          },
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Positive %',
              font: {
                size: 11
              },
              color: '#6b7280'
            },
            grid: {
              color: '#f3f4f6'
            },
            ticks: {
              callback: function(value) {
                return value + '%';
              },
              color: '#6b7280',
              font: {
                size: 10
              }
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        },
        animation: {
          duration: 1000,
          easing: 'easeInOutQuart'
        }
      }
    });
  },

  // Update gauge chart
  updateGauge(emotion, confidence) {
    if (!this.gaugeChart) return;

    const color = LuMiUtils.getEmotionColor(emotion);
    this.gaugeChart.data.datasets[0].data = [confidence, 1 - confidence];
    this.gaugeChart.data.datasets[0].backgroundColor = [color, '#e5e7eb'];
    this.gaugeChart.update('active');
  },

  // Update radar chart with emotion data
  updateRadar(emotionData) {
    if (!this.radarChart || !emotionData) return;

    const emotions = ['joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust', 
                     'anxiety', 'confidence', 'confusion', 'curiosity'];
    
    const data = emotions.map(emotion => {
      return emotionData[emotion] || 0;
    });

    this.radarChart.data.datasets[0].data = data;
    this.radarChart.update('active');
  },

  // Update timeline chart
  updateTimeline(emotionHistory) {
    if (!this.timelineChart || !emotionHistory || emotionHistory.length === 0) return;

    // Group emotions by hour
    const hourlyData = {};
    const now = new Date();
    
    // Initialize all 24 hours
    for (let i = 0; i < 24; i++) {
      hourlyData[i] = { positive: 0, total: 0 };
    }

    // Process emotion history for last 24 hours
    emotionHistory.forEach(entry => {
      const entryTime = new Date(entry.timestamp);
      const hoursDiff = (now - entryTime) / (1000 * 60 * 60);
      
      if (hoursDiff <= 24) {
        const hour = entryTime.getHours();
        const isPositive = ['joy', 'confidence', 'curiosity', 'excitement'].includes(entry.primary_emotion);
        
        hourlyData[hour].total++;
        if (isPositive) {
          hourlyData[hour].positive++;
        }
      }
    });

    // Calculate percentages
    const data = Object.values(hourlyData).map(hour => {
      if (hour.total === 0) return 0;
      return Math.round((hour.positive / hour.total) * 100);
    });

    this.timelineChart.data.datasets[0].data = data;
    this.timelineChart.update('active');
  },

  // Create emotion heatmap
  createEmotionHeatmap(emotionData) {
    const emotions = ['joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust'];
    const heatmapContainer = document.createElement('div');
    heatmapContainer.className = 'emotion-heatmap';

    emotions.forEach(emotion => {
      const cell = document.createElement('div');
      cell.className = 'heatmap-cell';
      const score = emotionData[emotion] || 0;
      
      cell.style.backgroundColor = LuMiUtils.getEmotionColor(emotion);
      cell.style.opacity = Math.max(0.3, score);
      cell.textContent = LuMiUtils.getEmotionIcon(emotion);
      cell.title = `${emotion}: ${Math.round(score * 100)}%`;
      
      heatmapContainer.appendChild(cell);
    });

    return heatmapContainer;
  },

  // Create emotion calendar
  createEmotionCalendar(emotionHistory) {
    const calendar = document.createElement('div');
    calendar.className = 'emotion-calendar';
    
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const startDate = new Date(monthStart);
    startDate.setDate(startDate.getDate() - monthStart.getDay());

    // Process emotions by date
    const emotionByDate = {};
    emotionHistory.forEach(entry => {
      const date = new Date(entry.timestamp).toDateString();
      if (!emotionByDate[date]) {
        emotionByDate[date] = { emotions: [], count: 0 };
      }
      emotionByDate[date].emotions.push(entry.primary_emotion);
      emotionByDate[date].count++;
    });

    // Generate calendar days
    const current = new Date(startDate);
    for (let i = 0; i < 42; i++) { // 6 weeks
      const day = document.createElement('div');
      day.className = 'calendar-day';
      
      const dayNumber = current.getDate();
      const isCurrentMonth = current.getMonth() === today.getMonth();
      const isToday = current.toDateString() === today.toDateString();
      const dateKey = current.toDateString();
      
      day.textContent = dayNumber;
      
      if (!isCurrentMonth) {
        day.style.opacity = '0.3';
      }
      
      if (isToday) {
        day.classList.add('today');
      }
      
      // Add emotion data if available
      if (emotionByDate[dateKey]) {
        const dominantEmotion = this.getMostFrequentEmotion(emotionByDate[dateKey].emotions);
        day.classList.add('has-emotion');
        day.style.backgroundColor = LuMiUtils.getEmotionColor(dominantEmotion);
        day.title = `${dominantEmotion} (${emotionByDate[dateKey].count} entries)`;
      }
      
      calendar.appendChild(day);
      current.setDate(current.getDate() + 1);
    }

    return calendar;
  },

  // Get most frequent emotion
  getMostFrequentEmotion(emotions) {
    const counts = {};
    emotions.forEach(emotion => {
      counts[emotion] = (counts[emotion] || 0) + 1;
    });
    
    return Object.entries(counts).sort(([,a], [,b]) => b - a)[0]?.[0] || 'neutral';
  },

  // Resize charts on window resize
  resize() {
    if (this.gaugeChart) this.gaugeChart.resize();
    if (this.radarChart) this.radarChart.resize();
    if (this.timelineChart) this.timelineChart.resize();
  },

  // Destroy all charts
  destroy() {
    if (this.gaugeChart) {
      this.gaugeChart.destroy();
      this.gaugeChart = null;
    }
    if (this.radarChart) {
      this.radarChart.destroy();
      this.radarChart = null;
    }
    if (this.timelineChart) {
      this.timelineChart.destroy();
      this.timelineChart = null;
    }
  }
};

// Make available globally
window.LuMiCharts = LuMiCharts;

// Add resize listener
window.addEventListener('resize', LuMiUtils.debounce(() => {
  if (window.LuMiCharts) {
    LuMiCharts.resize();
  }
}, 300));