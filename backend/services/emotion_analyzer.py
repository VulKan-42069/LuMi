"""Emotion analysis service for psychological insights"""
import re
import json
from typing import Dict, List, Any, Tuple
from textblob import TextBlob
import numpy as np
from datetime import datetime

class EmotionAnalyzer:
    def __init__(self):
        # Define emotion categories and their indicators
        self.emotion_patterns = {
            'joy': {
                'keywords': ['happy', 'glad', 'excited', 'wonderful', 'amazing', 'fantastic', 'great', 'love', 'excellent', 'awesome', 'brilliant', 'perfect', 'delighted', 'thrilled'],
                'intensity_words': ['extremely', 'incredibly', 'absolutely', 'totally', 'completely'],
                'contexts': ['celebration', 'success', 'achievement', 'love', 'appreciation']
            },
            'sadness': {
                'keywords': ['sad', 'depressed', 'down', 'upset', 'heartbroken', 'disappointed', 'hurt', 'lonely', 'miserable', 'terrible', 'awful', 'devastated', 'grief', 'sorrow'],
                'intensity_words': ['deeply', 'extremely', 'completely', 'totally', 'absolutely'],
                'contexts': ['loss', 'failure', 'rejection', 'death', 'breakup', 'disappointment']
            },
            'anger': {
                'keywords': ['angry', 'mad', 'furious', 'irritated', 'annoyed', 'frustrated', 'rage', 'hate', 'outraged', 'pissed', 'livid', 'enraged', 'irate'],
                'intensity_words': ['extremely', 'absolutely', 'completely', 'utterly', 'totally'],
                'contexts': ['injustice', 'betrayal', 'frustration', 'conflict', 'annoyance']
            },
            'fear': {
                'keywords': ['scared', 'afraid', 'anxious', 'worried', 'nervous', 'terrified', 'panic', 'frightened', 'dread', 'anxiety', 'phobia', 'concerned'],
                'intensity_words': ['extremely', 'completely', 'utterly', 'absolutely', 'terribly'],
                'contexts': ['danger', 'threat', 'uncertainty', 'change', 'unknown']
            },
            'surprise': {
                'keywords': ['surprised', 'shocked', 'amazed', 'astonished', 'unexpected', 'wow', 'incredible', 'unbelievable', 'mind-blown', 'speechless'],
                'intensity_words': ['absolutely', 'completely', 'totally', 'utterly', 'extremely'],
                'contexts': ['revelation', 'twist', 'discovery', 'revelation', 'realization']
            },
            'disgust': {
                'keywords': ['disgusted', 'sickened', 'revolted', 'appalled', 'disgusting', 'gross', 'repulsive', 'horrible', 'awful', 'nasty'],
                'intensity_words': ['absolutely', 'completely', 'utterly', 'totally', 'completely'],
                'contexts': ['moral violation', 'contamination', 'aesthetic displeasure']
            },
            'anxiety': {
                'keywords': ['anxious', 'worried', 'stressed', 'overwhelmed', 'nervous', 'panic', 'tense', 'restless', 'uneasy', 'fearful'],
                'intensity_words': ['extremely', 'completely', 'utterly', 'absolutely', 'terribly'],
                'contexts': ['uncertainty', 'performance', 'social', 'health', 'future']
            },
            'confidence': {
                'keywords': ['confident', 'sure', 'certain', 'positive', 'strong', 'capable', 'able', 'ready', 'prepared', 'optimistic'],
                'intensity_words': ['very', 'extremely', 'completely', 'totally', 'absolutely'],
                'contexts': ['preparation', 'success', 'ability', 'achievement', 'readiness']
            },
            'confusion': {
                'keywords': ['confused', 'unclear', 'lost', 'perplexed', 'baffled', 'puzzled', 'bewildered', 'uncertain', 'don\'t understand'],
                'intensity_words': ['completely', 'totally', 'extremely', 'absolutely', 'utterly'],
                'contexts': ['complexity', 'ambiguity', 'information overload', 'contradiction']
            },
            'curiosity': {
                'keywords': ['curious', 'interested', 'wondering', 'want to know', 'tell me', 'explain', 'how does', 'why', 'what', 'where', 'when'],
                'intensity_words': ['very', 'extremely', 'really', 'quite', 'particularly'],
                'contexts': ['learning', 'discovery', 'exploration', 'inquiry']
            },
            'frustration': {
                'keywords': ['frustrated', 'annoyed', 'stuck', 'blocked', 'impossible', 'won\'t work', 'fail', 'can\'t', 'struggling', 'difficult'],
                'intensity_words': ['extremely', 'completely', 'totally', 'absolutely', 'utterly'],
                'contexts': ['barriers', 'obstacles', 'failures', 'limitations', 'inefficiency']
            },
            'excitement': {
                'keywords': ['excited', 'thrilled', 'can\'t wait', 'eager', 'enthusiastic', 'pumped', 'hyped', 'stoked', 'psyched'],
                'intensity_words': ['extremely', 'incredibly', 'absolutely', 'totally', 'completely'],
                'contexts': ['anticipation', 'opportunity', 'adventure', 'new experiences', 'achievement']
            }
        }
        
        # Personality trait indicators
        self.personality_patterns = {
            'openness': {
                'indicators': ['creative', 'imaginative', 'artistic', 'innovative', 'curious', 'open-minded', 'explore', 'new ideas', 'fantasy', 'abstract'],
                'questions': ['what if', 'imagine', 'creative', 'art', 'music', 'poetry', 'philosophy', 'meaning']
            },
            'conscientiousness': {
                'indicators': ['organized', 'responsible', 'disciplined', 'careful', 'thorough', 'planned', 'structured', 'goal-oriented', 'reliable'],
                'questions': ['plan', 'schedule', 'organize', 'goal', 'deadline', 'method', 'process', 'system']
            },
            'extraversion': {
                'indicators': ['social', 'outgoing', 'energetic', 'talkative', 'enthusiastic', 'people', 'party', 'group', 'team'],
                'questions': ['people', 'friends', 'social', 'group', 'team', 'party', 'event', 'conversation']
            },
            'agreeableness': {
                'indicators': ['cooperative', 'trusting', 'helpful', 'kind', 'compassionate', 'empathetic', 'understanding', 'generous', 'compromise'],
                'questions': ['help', 'care', 'support', 'understand', 'empathy', 'kindness', 'gentle', 'peace']
            },
            'neuroticism': {
                'indicators': ['anxious', 'worried', 'stressed', 'emotional', 'sensitive', 'moody', 'insecure', 'nervous', 'tension'],
                'questions': ['worry', 'stress', 'anxiety', 'fear', 'insecure', 'emotional', 'mood', 'nervous']
            }
        }
        
        # Cognitive pattern indicators
        self.cognitive_patterns = {
            'optimism': {
                'indicators': ['positive', 'optimistic', 'hopeful', 'bright future', 'good things', 'will work out', 'best case', 'silver lining', 'opportunity'],
                'contexts': ['future planning', 'problem solving', 'outcome prediction']
            },
            'pessimism': {
                'indicators': ['negative', 'pessimistic', 'hopeless', 'dark future', 'worst case', 'won\'t work', 'impossible', 'doomed'],
                'contexts': ['future planning', 'outcome prediction', 'problem assessment']
            },
            'analytical_thinking': {
                'indicators': ['analyze', 'examine', 'consider', 'evaluate', 'assess', 'research', 'data', 'evidence', 'logical', 'systematic'],
                'contexts': ['decision making', 'problem solving', 'understanding complex issues']
            },
            'creativity': {
                'indicators': ['creative', 'imaginative', 'artistic', 'innovative', 'original', 'unique', 'inventive', 'brainstorm', 'brainstorming'],
                'contexts': ['problem solving', 'artistic expression', 'innovation', 'design']
            }
        }
    
    def analyze_emotion(self, text: str) -> Dict[str, Any]:
        """
        Analyze emotion in text and return comprehensive emotion analysis
        
        Args:
            text: Text to analyze
            
        Returns:
            Dictionary containing emotion analysis results
        """
        if not text or not text.strip():
            return {
                'primary_emotion': 'neutral',
                'confidence': 0.0,
                'intensity': 0.0,
                'all_emotions': {},
                'emotional_context': 'empty',
                'personality_insights': {},
                'cognitive_patterns': {},
                'sentiment_score': 0.0
            }
        
        # Basic sentiment analysis
        blob = TextBlob(text)
        sentiment_score = blob.sentiment.polarity  # -1 to 1
        
        # Extract emotion scores
        emotion_scores = {}
        emotion_contexts = {}
        
        for emotion, patterns in self.emotion_patterns.items():
            score = self._calculate_emotion_score(text, patterns)
            if score > 0:
                emotion_scores[emotion] = score
                emotion_contexts[emotion] = self._identify_context(text, patterns)
        
        # Determine primary emotion
        if emotion_scores:
            primary_emotion = max(emotion_scores, key=emotion_scores.get)
            primary_score = emotion_scores[primary_emotion]
        else:
            primary_emotion = 'neutral'
            primary_score = 0.0
        
        # Calculate intensity
        intensity = self._calculate_intensity(text)
        
        # Analyze personality traits
        personality_insights = self._analyze_personality(text)
        
        # Analyze cognitive patterns
        cognitive_patterns = self._analyze_cognitive_patterns(text)
        
        return {
            'primary_emotion': primary_emotion,
            'confidence': min(primary_score, 1.0),
            'intensity': min(intensity, 1.0),
            'all_emotions': emotion_scores,
            'emotional_context': emotion_contexts.get(primary_emotion, 'general'),
            'personality_insights': personality_insights,
            'cognitive_patterns': cognitive_patterns,
            'sentiment_score': sentiment_score,
            'text_length': len(text),
            'analysis_timestamp': datetime.now().isoformat()
        }
    
    def _calculate_emotion_score(self, text: str, patterns: Dict) -> float:
        """Calculate emotion score based on keyword matching and context"""
        text_lower = text.lower()
        score = 0.0
        
        # Base score from keywords
        for keyword in patterns['keywords']:
            if keyword in text_lower:
                score += 1.0
        
        # Intensity modifiers
        for intensity_word in patterns['intensity_words']:
            if intensity_word in text_lower:
                score += 0.5
        
        # Context weighting
        for context in patterns['contexts']:
            if context in text_lower:
                score += 0.3
        
        # Normalize by text length
        text_length = len(text.split())
        if text_length > 0:
            score = score / (text_length / 10)  # Normalize by word count
        
        return min(score, 1.0)  # Cap at 1.0
    
    def _identify_context(self, text: str, patterns: Dict) -> str:
        """Identify the context of the emotion"""
        text_lower = text.lower()
        
        for context in patterns['contexts']:
            if context in text_lower:
                return context
        
        return 'general'
    
    def _calculate_intensity(self, text: str) -> float:
        """Calculate emotional intensity based on various factors"""
        text_lower = text.lower()
        intensity_score = 0.0
        
        # Check for intensity words
        intensity_words = ['extremely', 'very', 'really', 'absolutely', 'totally', 'completely', 'utterly', 'incredibly']
        for word in intensity_words:
            if word in text_lower:
                intensity_score += 0.2
        
        # Check for emphasis patterns
        if re.search(r'[A-Z]{3,}', text):  # CAPS LOCK
            intensity_score += 0.3
        
        if re.search(r'!{2,}', text):  # Multiple exclamation marks
            intensity_score += 0.3
        
        if re.search(r'\?{2,}', text):  # Multiple question marks
            intensity_score += 0.2
        
        # Check for emotional punctuation
        if re.search(r'[.]{3,}', text):  # Ellipsis
            intensity_score += 0.1
        
        return min(intensity_score, 1.0)
    
    def _analyze_personality(self, text: str) -> Dict[str, Any]:
        """Analyze personality traits from text"""
        text_lower = text.lower()
        personality_scores = {}
        
        for trait, patterns in self.personality_patterns.items():
            score = 0.0
            
            # Count indicators
            for indicator in patterns['indicators']:
                if indicator in text_lower:
                    score += 0.2
            
            # Count question patterns
            for question in patterns['questions']:
                if question in text_lower:
                    score += 0.1
            
            personality_scores[trait] = min(score, 1.0)
        
        return personality_scores
    
    def _analyze_cognitive_patterns(self, text: str) -> Dict[str, Any]:
        """Analyze cognitive patterns from text"""
        text_lower = text.lower()
        cognitive_scores = {}
        
        for pattern, patterns in self.cognitive_patterns.items():
            score = 0.0
            
            # Count indicators
            for indicator in patterns['indicators']:
                if indicator in text_lower:
                    score += 0.2
            
            # Context weighting
            for context in patterns['contexts']:
                if context in text_lower:
                    score += 0.3
            
            cognitive_scores[pattern] = min(score, 1.0)
        
        return cognitive_scores
    
    def compare_emotions(self, user_text: str, ai_text: str) -> Dict[str, Any]:
        """Compare emotions between user and AI responses"""
        user_analysis = self.analyze_emotion(user_text)
        ai_analysis = self.analyze_emotion(ai_text)
        
        # Calculate emotional alignment
        emotional_alignment = self._calculate_emotional_alignment(user_analysis, ai_analysis)
        
        # Identify interaction patterns
        interaction_patterns = self._identify_interaction_patterns(user_analysis, ai_analysis)
        
        return {
            'user_emotion': user_analysis,
            'ai_emotion': ai_analysis,
            'emotional_alignment': emotional_alignment,
            'interaction_patterns': interaction_patterns,
            'analysis_timestamp': datetime.now().isoformat()
        }
    
    def _calculate_emotional_alignment(self, user_analysis: Dict, ai_analysis: Dict) -> float:
        """Calculate how aligned the AI's emotional response is with the user's emotion"""
        user_emotion = user_analysis['primary_emotion']
        ai_emotion = ai_analysis['primary_emotion']
        
        # Define emotion relationships
        complementary_emotions = {
            'joy': 'excitement',
            'sadness': 'empathy',
            'anger': 'calm',
            'fear': 'reassurance',
            'anxiety': 'confidence',
            'confusion': 'clarity'
        }
        
        if user_emotion == ai_emotion:
            return 0.8  # Same emotion
        elif ai_emotion == complementary_emotions.get(user_emotion, ''):
            return 0.9  # Complementary emotion
        elif user_emotion in ['joy', 'excitement', 'confidence'] and ai_emotion in ['joy', 'excitement', 'confidence']:
            return 0.7  # Positive alignment
        else:
            return 0.3  # Neutral/negative alignment
    
    def _identify_interaction_patterns(self, user_analysis: Dict, ai_analysis: Dict) -> List[str]:
        """Identify patterns in the emotional interaction"""
        patterns = []
        
        # Check for empathy indicators
        if ai_analysis['primary_emotion'] in ['empathy', 'understanding', 'compassion']:
            patterns.append('empathetic_response')
        
        # Check for emotional amplification
        user_intensity = user_analysis['intensity']
        ai_intensity = ai_analysis['intensity']
        
        if ai_intensity > user_intensity * 1.5:
            patterns.append('emotional_amplification')
        elif ai_intensity < user_intensity * 0.5:
            patterns.append('emotional_deescalation')
        
        # Check for engagement patterns
        if user_analysis['cognitive_patterns'].get('curiosity', 0) > 0.5 and ai_analysis['cognitive_patterns'].get('curiosity', 0) > 0.5:
            patterns.append('mutual_curiosity')
        
        # Check for support patterns
        if user_analysis['primary_emotion'] in ['anxiety', 'fear', 'sadness'] and ai_analysis['primary_emotion'] in ['confidence', 'reassurance', 'support']:
            patterns.append('emotional_support')
        
        return patterns