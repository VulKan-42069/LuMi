"""File upload API routes for LuMi application"""
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
import os
import PyPDF2
import json
from datetime import datetime
from models import User
from config import Config
import hashlib

file_bp = Blueprint('files', __name__)

# Allowed file extensions
ALLOWED_EXTENSIONS = {'txt', 'pdf'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@file_bp.route('/upload', methods=['POST'])
def upload_file():
    """Upload and process file (PDF or TXT)"""
    try:
        user_id = 1  # In production, extract from session/JWT
        
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            
            # Create uploads directory if it doesn't exist
            upload_dir = current_app.config.get('UPLOAD_FOLDER', '../uploads')
            os.makedirs(upload_dir, exist_ok=True)
            
            # Generate unique filename
            file_hash = hashlib.md5(file.read()).hexdigest()[:8]
            file.seek(0)  # Reset file pointer
            filename = f"{file_hash}_{filename}"
            filepath = os.path.join(upload_dir, filename)
            
            # Save file
            file.save(filepath)
            
            # Process file content
            content = ""
            analysis_data = {}
            
            if filename.lower().endswith('.pdf'):
                try:
                    with open(filepath, 'rb') as pdf_file:
                        pdf_reader = PyPDF2.PdfReader(pdf_file)
                        for page in pdf_reader.pages:
                            content += page.extract_text() + "\n"
                    
                    # Basic PDF analysis
                    analysis_data = {
                        'type': 'pdf',
                        'pages': len(pdf_reader.pages),
                        'word_count': len(content.split()),
                        'char_count': len(content),
                        'processed_at': datetime.now().isoformat()
                    }
                    
                except Exception as e:
                    return jsonify({'error': f'Failed to process PDF: {str(e)}'}), 500
            
            elif filename.lower().endswith('.txt'):
                try:
                    with open(filepath, 'r', encoding='utf-8') as txt_file:
                        content = txt_file.read()
                    
                    # Basic text analysis
                    analysis_data = {
                        'type': 'txt',
                        'word_count': len(content.split()),
                        'char_count': len(content),
                        'lines': len(content.splitlines()),
                        'processed_at': datetime.now().isoformat()
                    }
                    
                except Exception as e:
                    return jsonify({'error': f'Failed to process text file: {str(e)}'}), 500
            
            # Store file info in database (simplified)
            # In production, implement proper file tracking
            
            return jsonify({
                'success': True,
                'file_info': {
                    'filename': filename,
                    'original_filename': file.filename,
                    'content': content[:1000] + "..." if len(content) > 1000 else content,  # Truncate for demo
                    'analysis_data': analysis_data,
                    'upload_timestamp': datetime.now().isoformat()
                }
            })
        
        return jsonify({'error': 'File type not allowed'}), 400
        
    except Exception as e:
        return jsonify({'error': f'File upload failed: {str(e)}'}), 500

@file_bp.route('/list', methods=['GET'])
def list_files():
    """List uploaded files for user"""
    try:
        user_id = 1  # In production, extract from session/JWT
        
        # In production, implement proper file listing from database
        return jsonify({
            'success': True,
            'files': []
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to list files: {str(e)}'}), 500

@file_bp.route('/analyze', methods=['POST'])
def analyze_file_content():
    """Analyze file content for emotions and insights"""
    try:
        data = request.get_json()
        
        if not data or 'content' not in data:
            return jsonify({'error': 'File content is required'}), 400
        
        content = data['content']
        
        # Import emotion analyzer
        from services.emotion_analyzer import EmotionAnalyzer
        analyzer = EmotionAnalyzer()
        
        # Analyze the content
        analysis = analyzer.analyze_emotion(content)
        
        # Extract key themes
        themes = extract_themes(content)
        
        # Generate summary
        summary = generate_summary(content, analysis)
        
        return jsonify({
            'success': True,
            'analysis': {
                'emotion_analysis': analysis,
                'themes': themes,
                'summary': summary,
                'content_length': len(content),
                'word_count': len(content.split())
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to analyze file: {str(e)}'}), 500

def extract_themes(content):
    """Extract themes from content using keyword analysis"""
    # Simple theme extraction based on common topics
    themes = {
        'work': ['work', 'job', 'career', 'office', 'business', 'meeting', 'colleague'],
        'relationships': ['family', 'friend', 'relationship', 'love', 'partner', 'marriage'],
        'health': ['health', 'medical', 'doctor', 'exercise', 'diet', 'stress', 'anxiety'],
        'education': ['study', 'learn', 'school', 'university', 'course', 'exam', 'knowledge'],
        'technology': ['computer', 'software', 'tech', 'digital', 'internet', 'app', 'device'],
        'finance': ['money', 'financial', 'budget', 'cost', 'price', 'expensive', 'cheap']
    }
    
    content_lower = content.lower()
    found_themes = {}
    
    for theme, keywords in themes.items():
        score = 0
        found_keywords = []
        for keyword in keywords:
            if keyword in content_lower:
                score += 1
                found_keywords.append(keyword)
        
        if score > 0:
            found_themes[theme] = {
                'score': score,
                'keywords': found_keywords,
                'confidence': min(score / len(keywords), 1.0)
            }
    
    return found_themes

def generate_summary(content, analysis):
    """Generate a brief summary of the content"""
    sentences = content.split('.')
    key_sentences = []
    
    # Select first 2-3 meaningful sentences
    for sentence in sentences[:3]:
        if len(sentence.strip()) > 20:  # Filter out very short sentences
            key_sentences.append(sentence.strip())
    
    summary = '. '.join(key_sentences)
    
    if len(summary) > 500:
        summary = summary[:500] + "..."
    
    return {
        'content': summary,
        'key_emotions': list(analysis['all_emotions'].keys())[:3],
        'sentiment': 'positive' if analysis['sentiment_score'] > 0.1 else 'negative' if analysis['sentiment_score'] < -0.1 else 'neutral',
        'readability': 'easy' if len(sentences) < 20 else 'medium' if len(sentences) < 50 else 'complex'
    }