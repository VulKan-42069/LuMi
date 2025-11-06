"""Emotion analysis API routes for LuMi application"""
from flask import Blueprint, request, jsonify
from models import EmotionTracker
from config import Config
from datetime import datetime, timedelta

emotion_bp = Blueprint('emotion', __name__)

@emotion_bp.route('/history', methods=['GET'])
def get_emotion_history():
    """Get user's emotion history"""
    try:
        user_id = 1  # In production, extract from session/JWT
        days = request.args.get('days', 7, type=int)  # Default to 7 days
        
        emotion_model = EmotionTracker(Config.DATABASE_PATH)
        emotions = emotion_model.get_user_emotions(user_id, days)
        
        return jsonify({
            'success': True,
            'emotions': emotions,
            'days': days
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to get emotion history: {str(e)}'}), 500

@emotion_bp.route('/statistics', methods=['GET'])
def get_emotion_statistics():
    """Get emotion statistics for a user"""
    try:
        user_id = 1  # In production, extract from session/JWT
        days = request.args.get('days', 7, type=int)
        
        emotion_model = EmotionTracker(Config.DATABASE_PATH)
        stats = emotion_model.get_emotion_statistics(user_id, days)
        
        return jsonify({
            'success': True,
            'statistics': stats,
            'days': days
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to get emotion statistics: {str(e)}'}), 500

@emotion_bp.route('/analyze-text', methods=['POST'])
def analyze_text_emotion():
    """Analyze emotion in provided text"""
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({'error': 'Text is required'}), 400
        
        text = data['text'].strip()
        if not text:
            return jsonify({'error': 'Text cannot be empty'}), 400
        
        # Import emotion analyzer
        from services.emotion_analyzer import EmotionAnalyzer
        analyzer = EmotionAnalyzer()
        
        analysis = analyzer.analyze_emotion(text)
        
        return jsonify({
            'success': True,
            'analysis': analysis
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to analyze text: {str(e)}'}), 500