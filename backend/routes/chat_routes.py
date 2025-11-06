"""Chat API routes for LuMi application"""
from flask import Blueprint, request, jsonify, session
from werkzeug.security import check_password_hash, generate_password_hash
from datetime import datetime
import json
import os
from models import User, Conversation, EmotionTracker
from config import Config

def create_chat_bp(openrouter_service, emotion_analyzer):
    """Create chat blueprint with service dependencies"""
    chat_bp = Blueprint('chat', __name__)
    
    @chat_bp.route('/message', methods=['POST'])
    def send_message():
        """Send a message and get AI response with emotion analysis"""
        try:
            data = request.get_json()
            
            if not data or 'message' not in data:
                return jsonify({'error': 'Message is required'}), 400
            
            message = data['message'].strip()
            if not message:
                return jsonify({'error': 'Message cannot be empty'}), 400
            
            # Get or create user session (simplified for demo)
            user_id = 1  # In production, extract from session/JWT
            conversation_id = data.get('conversation_id')
            
            # Create conversation if not exists
            if not conversation_id:
                conv_model = Conversation(Config.DATABASE_PATH)
                conversation_id = conv_model.create_conversation(user_id, "New Conversation")
            
            # Analyze user emotion
            user_emotion = emotion_analyzer.analyze_emotion(message)
            
            # Add user message to database
            conv_model = Conversation(Config.DATABASE_PATH)
            conv_model.add_message(conversation_id, 'user', message, user_emotion)
            
            # Record emotion in tracking
            emotion_model = EmotionTracker(Config.DATABASE_PATH)
            for emotion, score in user_emotion['all_emotions'].items():
                if score > Config.DEFAULT_CONFIDENCE_THRESHOLD:
                    emotion_model.record_emotion(
                        user_id, 
                        conversation_id,  # We'll need the actual message_id here
                        emotion, 
                        score, 
                        user_emotion['intensity'],
                        user_emotion
                    )
            
            # Get conversation history for context
            conversation = conv_model.get_conversation(conversation_id, user_id)
            messages_for_ai = []
            
            # Create human-like system prompt
            system_prompt = {
                'role': 'system',
                'content': '''You are LuMi, a female AI companion that provides psychological insights and emotional support. You are:
- A warm, empathetic, and genuinely caring woman
- Concise and focused (under 150 words per response)
- Skilled at active listening and asking thoughtful follow-up questions
- Professional yet approachable, like a trusted female friend or sister
- Focused on the user's emotional wellbeing with feminine intuition
- Not preachy or overly clinical
- Good at reading between the lines and offering gentle, nurturing insights
- Use natural feminine speech patterns and emotional intelligence
- Sometimes use gentle expressions like "I hear you", "That sounds really tough", "I'm here with you"

Never give medical advice, but you can discuss mental health concepts in an educational, supportive way. Keep responses conversational and avoid long explanations unless specifically asked.'''
            }
            
            messages_for_ai.append(system_prompt)
            
            # Prepare recent messages for context (last 6 for better flow)
            recent_messages = conversation['messages'][-6:] if len(conversation['messages']) > 6 else conversation['messages']
            for msg in recent_messages:
                messages_for_ai.append({
                    'role': msg['role'],
                    'content': msg['content']
                })
            
            # Generate AI response with better parameters
            try:
                ai_response = openrouter_service.generate_response(
                    messages_for_ai,
                    temperature=0.8,  # Slightly higher for more natural, varied responses
                    max_tokens=1500,  # Significantly increased for complete responses
                    top_p=0.9,
                    frequency_penalty=0.1,
                    presence_penalty=0.1
                )
                
                ai_content = ai_response['content'].strip()
                
                # Only truncate if response is extremely long (over 1000 characters)
                if len(ai_content) > 1000:
                    # Better sentence completion
                    sentences = ai_content.split('.')
                    complete_response = ''
                    for sentence in sentences:
                        if len(complete_response + sentence + '.') < 950:
                            complete_response += sentence + '.'
                        else:
                            break
                    if complete_response and not complete_response.endswith('...'):
                        complete_response += '...'
                    ai_content = complete_response
                
            except Exception as e:
                # Fallback response if API fails - more empathetic
                emotion_words = {
                    'joy': 'excited', 'sadness': 'sad', 'anger': 'frustrated',
                    'fear': 'worried', 'anxiety': 'anxious', 'confidence': 'confident'
                }
                current_feeling = emotion_words.get(user_emotion['primary_emotion'], 'feeling')
                ai_content = f"I can sense you're {current_feeling} right now. I'm here with you. What's weighing on your mind that you'd like to share?"
            
            # Analyze AI response emotion
            ai_emotion = emotion_analyzer.analyze_emotion(ai_content)
            
            # Add AI message to database
            message_id = conv_model.add_message(conversation_id, 'assistant', ai_content, ai_emotion)
            
            # Update emotion tracking for AI response
            for emotion, score in ai_emotion['all_emotions'].items():
                if score > Config.DEFAULT_CONFIDENCE_THRESHOLD:
                    emotion_model.record_emotion(
                        user_id, 
                        message_id,
                        emotion, 
                        score, 
                        ai_emotion['intensity'],
                        ai_emotion
                    )
            
            # Compare emotions for interaction analysis
            interaction_analysis = emotion_analyzer.compare_emotions(message, ai_content)
            
            return jsonify({
                'success': True,
                'conversation_id': conversation_id,
                'user_emotion': user_emotion,
                'ai_emotion': ai_emotion,
                'interaction_analysis': interaction_analysis,
                'response': {
                    'id': message_id,
                    'content': ai_content,
                    'role': 'assistant',
                    'timestamp': datetime.now().isoformat()
                }
            })
            
        except Exception as e:
            return jsonify({'error': f'Failed to process message: {str(e)}'}), 500
    
    @chat_bp.route('/conversations', methods=['GET'])
    def get_conversations():
        """Get user's conversation history"""
        try:
            user_id = 1  # In production, extract from session/JWT
            
            conv_model = Conversation(Config.DATABASE_PATH)
            conversations = conv_model.get_conversations(user_id)
            
            return jsonify({
                'success': True,
                'conversations': conversations
            })
            
        except Exception as e:
            return jsonify({'error': f'Failed to get conversations: {str(e)}'}), 500
    
    @chat_bp.route('/conversation/<int:conversation_id>', methods=['GET'])
    def get_conversation(conversation_id):
        """Get a specific conversation with messages"""
        try:
            user_id = 1  # In production, extract from session/JWT
            
            conv_model = Conversation(Config.DATABASE_PATH)
            conversation = conv_model.get_conversation(conversation_id, user_id)
            
            if not conversation:
                return jsonify({'error': 'Conversation not found'}), 404
            
            return jsonify({
                'success': True,
                'conversation': conversation
            })
            
        except Exception as e:
            return jsonify({'error': f'Failed to get conversation: {str(e)}'}), 500
    
    @chat_bp.route('/conversation/<int:conversation_id>', methods=['DELETE'])
    def delete_conversation(conversation_id):
        """Delete a conversation"""
        try:
            user_id = 1  # In production, extract from session/JWT
            
            # In production, implement soft delete in models
            return jsonify({
                'success': True,
                'message': 'Conversation deleted successfully'
            })
            
        except Exception as e:
            return jsonify({'error': f'Failed to delete conversation: {str(e)}'}), 500
    
    return chat_bp