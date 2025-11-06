"""Flask application configuration"""
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-luMi-2024'
    
    # OpenRouter API Configuration
    OPENROUTER_API_KEY = os.environ.get('OPENROUTER_API_KEY', '')
    OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'
    OPENROUTER_MODEL = 'minimax/minimax-m2:free'
    
    # Database Configuration
    DATABASE_PATH = os.path.join(os.path.dirname(__file__), '../data/lumi.db')
    
    # Upload Configuration
    UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), '../uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    
    # Emotion Analysis Configuration
    EMOTION_UPDATE_INTERVAL = 1  # seconds
    DEFAULT_CONFIDENCE_THRESHOLD = 0.3
    
    # Security Configuration
    WTF_CSRF_ENABLED = True
    WTF_CSRF_TIME_LIMIT = None
    
    # Development Configuration
    DEBUG = os.environ.get('FLASK_DEBUG', 'True').lower() == 'true'
    
class ProductionConfig(Config):
    DEBUG = False
    
class DevelopmentConfig(Config):
    DEBUG = True
    DEVELOPMENT = True
    
class TestingConfig(Config):
    TESTING = True
    DATABASE_PATH = ':memory:'
    WTF_CSRF_ENABLED = False