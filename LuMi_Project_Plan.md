# LuMi - AI Companion Chatbot with Psychological Analysis

## Project Overview
A closed-companion AI chatbot that provides real-time emotional and psychological analysis of user conversations, with comprehensive visualization and user profiling capabilities.

## Architecture Summary
- **Frontend**: HTML5, CSS3, JavaScript (with Chart.js for visualizations)
- **Backend**: Flask (Python)
- **AI Model**: OpenRouter API (minimax/minimax-m2:free)
- **Data Storage**: Local SQLite for user profiles and conversation history
- **Privacy**: All data processing and storage handled locally

## Detailed Task Breakdown

### 1. Project Setup & Basic Structure
**File Structure:**
```
LuMi/
├── backend/
│   ├── app.py (Flask main application)
│   ├── config.py (API keys, settings)
│   ├── models/ (database models)
│   ├── routes/ (API endpoints)
│   ├── services/ (emotion analysis, AI integration)
│   └── utils/ (helper functions)
├── frontend/
│   ├── index.html (main chat interface)
│   ├── css/
│   │   ├── style.css (main styles)
│   │   ├── emotion-viz.css (emotion visualization styles)
│   │   └── chat.css (chat interface styles)
│   ├── js/
│   │   ├── chat.js (chat functionality)
│   │   ├── emotion-tracker.js (real-time emotion analysis)
│   │   ├── charts.js (data visualization)
│   │   ├── voice.js (voice interaction)
│   │   └── file-upload.js (PDF/TXT file handling)
│   └── assets/
│       └── icons/ (emotion icons, UI elements)
├── static/ (shared resources)
├── data/ (local database and user data)
└── requirements.txt
```

### 2. Backend API Integration with OpenRouter
**Features:**
- Flask RESTful API endpoints
- OpenRouter API integration with minimax-minimax-m2:free model
- Error handling and rate limiting
- Request/response logging for debugging

### 3. Chat Interface Development
**Features:**
- Modern, responsive chat UI similar to ChatGPT
- Real-time message streaming
- Message history with timestamps
- Typing indicators
- Message export functionality

### 4. Emotion Analysis Engine Implementation
**Analysis Capabilities:**
- **Basic Emotions**: Joy, Sadness, Anger, Fear, Surprise, Disgust
- **Complex Emotions**: Anxiety, Confidence, Confusion, Curiosity, Frustration, Excitement
- **Personality Traits**: Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism
- **Cognitive Patterns**: Optimism, Pessimism, Analytical thinking, Creativity indicators
- **Intent Analysis**: Question types, advice-seeking, emotional support needs, problem-solving

**Technical Implementation:**
- Text analysis using sentiment analysis libraries
- Keyword pattern matching for emotion indicators
- Context analysis for deeper psychological insights
- Confidence scoring for each analysis

### 5. Real-time Emotion Visualization System
**Visualization Types:**
- **Real-time Emotion Meter**: Circular gauge showing dominant emotion
- **Emotion Flow**: Live updating emotion timeline
- **Emotion Radar Chart**: Multi-dimensional emotion profile
- **Mood Progression**: Line chart showing emotional changes over conversation
- **Emotion Heatmap**: Color-coded emotional intensity

**Update Frequency**: Every user message and AI response
**Visual Effects**: Smooth animations, color transitions, dynamic sizing

### 6. User Profile & Session Management
**Features:**
- User registration and login system
- Personal emotion profiles and baselines
- Conversation history with emotional analysis
- Settings for analysis preferences
- Data export functionality
- Privacy controls and data deletion options

### 7. Advanced Data Visualizations
**Chart Types:**
- **Sentiment Over Time**: Line chart with conversation sessions
- **Emotion Distribution**: Pie/donut chart of emotion types
- **Conversation Insights**: Bar charts for interaction patterns
- **Psychological Metrics**: Gauge charts for personality indicators
- **Comparative Analysis**: Multi-user or session comparisons

### 8. Voice Interaction & File Upload Features
**Voice Features:**
- Speech-to-text using Web Speech API
- Text-to-speech for AI responses
- Voice emotion analysis (tone, pace, pauses)
- Voice recording controls

**File Upload Features:**
- PDF file analysis and summarization
- TXT file processing and discussion
- File-based emotion analysis
- Document context in conversations

### 9. Testing & UI/UX Polish
**Quality Assurance:**
- Unit tests for emotion analysis accuracy
- Integration tests for API endpoints
- User interface testing across devices
- Performance optimization
- Security testing for local data protection
- Accessibility compliance

## Technical Specifications

### Required Dependencies
**Backend (Flask):**
```
flask
flask-cors
requests
sqlite3
numpy
textblob (for sentiment analysis)
```

**Frontend:**
```
Chart.js (for data visualization)
Web Speech API (built-in)
DOMPurify (for security)
```

### Security & Privacy
- All user data stored locally
- No external API calls for user data
- Input sanitization and validation
- Secure session management
- Data encryption for stored profiles

### Performance Considerations
- Real-time analysis with <2s response time
- Efficient emotion calculation algorithms
- Optimized database queries
- Progressive loading for large conversation histories
- Caching for repeated analysis patterns

## Implementation Timeline
1. **Phase 1** (Tasks 1-3): Basic chat functionality
2. **Phase 2** (Task 4): Core emotion analysis
3. **Phase 3** (Task 5): Visualization system
4. **Phase 4** (Tasks 6-7): Advanced features
5. **Phase 5** (Tasks 8-9): Polish and testing

## Next Steps
Ready to proceed with implementation based on your approval of this plan.