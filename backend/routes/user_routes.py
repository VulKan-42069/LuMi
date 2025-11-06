"""User management API routes for LuMi application"""
from flask import Blueprint, request, jsonify, session
from werkzeug.security import check_password_hash, generate_password_hash
from datetime import datetime, timedelta
import secrets
import os
from models import User
from config import Config

user_bp = Blueprint('user', __name__)

@user_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        
        if not data or 'username' not in data or 'email' not in data or 'password' not in data:
            return jsonify({'error': 'Username, email, and password are required'}), 400
        
        username = data['username'].strip()
        email = data['email'].strip()
        password = data['password']
        
        if not username or not email or not password:
            return jsonify({'error': 'All fields are required'}), 400
        
        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters long'}), 400
        
        # Check if user already exists
        user_model = User(Config.DATABASE_PATH)
        existing_user = user_model.get_user_by_username(username)
        if existing_user:
            return jsonify({'error': 'Username already exists'}), 400
        
        # Create new user
        password_hash = generate_password_hash(password)
        user_id = user_model.create_user(username, email, password_hash)
        
        return jsonify({
            'success': True,
            'message': 'User registered successfully',
            'user_id': user_id
        })
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': f'Registration failed: {str(e)}'}), 500

@user_bp.route('/login', methods=['POST'])
def login():
    """Login user"""
    try:
        data = request.get_json()
        
        if not data or 'username' not in data or 'password' not in data:
            return jsonify({'error': 'Username and password are required'}), 400
        
        username = data['username'].strip()
        password = data['password']
        
        # Get user
        user_model = User(Config.DATABASE_PATH)
        user = user_model.get_user_by_username(username)
        
        if not user or not check_password_hash(user['password_hash'], password):
            return jsonify({'error': 'Invalid username or password'}), 401
        
        # Create session (simplified)
        session_token = secrets.token_urlsafe(32)
        session['user_id'] = user['id']
        session['username'] = user['username']
        session['session_token'] = session_token
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'user': {
                'id': user['id'],
                'username': user['username'],
                'email': user['email']
            },
            'session_token': session_token
        })
        
    except Exception as e:
        return jsonify({'error': f'Login failed: {str(e)}'}), 500

@user_bp.route('/logout', methods=['POST'])
def logout():
    """Logout user"""
    session.clear()
    return jsonify({
        'success': True,
        'message': 'Logout successful'
    })

@user_bp.route('/profile', methods=['GET'])
def get_profile():
    """Get user profile"""
    try:
        if 'user_id' not in session:
            return jsonify({'error': 'Not authenticated'}), 401
        
        user_id = session['user_id']
        user_model = User(Config.DATABASE_PATH)
        user = user_model.get_user_by_id(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'success': True,
            'user': {
                'id': user['id'],
                'username': user['username'],
                'email': user['email'],
                'created_at': user['created_at'],
                'profile_data': user['profile_data'],
                'settings': user['settings']
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to get profile: {str(e)}'}), 500

@user_bp.route('/profile', methods=['PUT'])
def update_profile():
    """Update user profile"""
    try:
        if 'user_id' not in session:
            return jsonify({'error': 'Not authenticated'}), 401
        
        user_id = session['user_id']
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        user_model = User(Config.DATABASE_PATH)
        
        if 'profile_data' in data:
            success = user_model.update_profile(user_id, data['profile_data'])
            if not success:
                return jsonify({'error': 'Failed to update profile'}), 500
        
        if 'settings' in data:
            success = user_model.update_settings(user_id, data['settings'])
            if not success:
                return jsonify({'error': 'Failed to update settings'}), 500
        
        return jsonify({
            'success': True,
            'message': 'Profile updated successfully'
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to update profile: {str(e)}'}), 500

@user_bp.route('/check', methods=['GET'])
def check_auth():
    """Check if user is authenticated"""
    if 'user_id' in session:
        return jsonify({
            'authenticated': True,
            'user': {
                'id': session['user_id'],
                'username': session.get('username', 'Unknown')
            }
        })
    else:
        return jsonify({'authenticated': False})