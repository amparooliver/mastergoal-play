"""
Configuration for Mastergoal Web API
"""

import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Configuration settings"""
    
    # Flask settings
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'
    
    # CORS settings
    ALLOWED_ORIGINS = os.environ.get('ALLOWED_ORIGINS', 'http://localhost:5173,http://localhost:3000').split(',')
    
    # Game settings
    MAX_GAMES_PER_IP = int(os.environ.get('MAX_GAMES_PER_IP', '10'))
    GAME_TIMEOUT_MINUTES = int(os.environ.get('GAME_TIMEOUT_MINUTES', '30'))
    
    # AI settings
    AI_MOVE_TIMEOUT = float(os.environ.get('AI_MOVE_TIMEOUT', '10.0'))
    
    # Render deployment
    PORT = int(os.environ.get('PORT', '5000'))