"""Main Flask application for LuMi"""
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import sys
from datetime import datetime
import logging

# Add project root to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config import Config, DevelopmentConfig
from models import init_db, User, Conversation, EmotionTracker
from routes.chat_routes import create_chat_bp
from routes.user_routes import user_bp
from routes.emotion_routes import emotion_bp
from routes.file_routes import file_bp
from services.openrouter_service import OpenRouterService
from services.emotion_analyzer import EmotionAnalyzer

def create_app(config_class=DevelopmentConfig):
    """Application factory pattern"""
    # Get the frontend directory path
    frontend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'frontend')
    
    app = Flask(__name__,
                template_folder=frontend_dir,
                static_folder=frontend_dir,
                static_url_path='')
    app.config.from_object(config_class)
    
    # Enable CORS
    CORS(app, origins=["http://localhost:3000", "http://localhost:5000", "http://127.0.0.1:5000"])
    
    # Setup logging
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)
    
    # Initialize database
    if not os.path.exists(os.path.dirname(app.config['DATABASE_PATH'])):
        os.makedirs(os.path.dirname(app.config['DATABASE_PATH']))
    
    init_db(app.config['DATABASE_PATH'])
    logger.info("Database initialized")
    
    # Initialize services
    openrouter_service = OpenRouterService(
        api_key=app.config['OPENROUTER_API_KEY'],
        base_url=app.config['OPENROUTER_BASE_URL'],
        model=app.config['OPENROUTER_MODEL']
    )
    
    emotion_analyzer = EmotionAnalyzer()
    
    # Register blueprints
    app.register_blueprint(create_chat_bp(openrouter_service, emotion_analyzer), url_prefix='/api/chat')
    app.register_blueprint(user_bp, url_prefix='/api/user')
    app.register_blueprint(emotion_bp, url_prefix='/api/emotion')
    app.register_blueprint(file_bp, url_prefix='/api/files')
    
    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'service': 'LuMi AI Companion',
            'version': '1.0.0'
        })
    
    # Serve frontend
    @app.route('/')
    def serve_frontend():
        return send_from_directory(frontend_dir, 'index.html')
    
    # Error handlers
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({'error': 'Bad request', 'message': str(error)}), 400
    
    @app.errorhandler(404)
    def not_found(error):
        # Check if it's an API endpoint
        if request.path.startswith('/api/'):
            return jsonify({'error': 'Not found', 'message': 'API endpoint not found'}), 404
        # Otherwise serve the frontend
        return send_from_directory(frontend_dir, 'index.html')
    
    @app.errorhandler(500)
    def internal_error(error):
        logger.error(f"Internal error: {str(error)}")
        return jsonify({'error': 'Internal server error', 'message': 'Something went wrong'}), 500
    
    # Add request logging
    @app.before_request
    def log_request():
        app.logger.info(f"{request.method} {request.url} - {request.remote_addr}")
    
    # Add response logging
    @app.after_request
    def log_response(response):
        app.logger.info(f"Response: {response.status_code}")
        return response
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)