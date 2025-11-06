"""Database models for LuMi application"""
import sqlite3
import json
from datetime import datetime
from typing import Dict, List, Any
import os

def init_db(db_path: str):
    """Initialize database with required tables"""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            profile_data TEXT DEFAULT '{}',
            settings TEXT DEFAULT '{}'
        )
    ''')
    
    # Conversations table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            metadata TEXT DEFAULT '{}',
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    ''')
    
    # Messages table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversation_id INTEGER NOT NULL,
            role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
            content TEXT NOT NULL,
            emotion_analysis TEXT DEFAULT '{}',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            metadata TEXT DEFAULT '{}',
            FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE
        )
    ''')
    
    # Emotion tracking table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS emotion_tracking (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            message_id INTEGER,
            emotion_type TEXT NOT NULL,
            confidence REAL NOT NULL,
            intensity REAL NOT NULL,
            context TEXT DEFAULT '{}',
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (message_id) REFERENCES messages (id) ON DELETE CASCADE
        )
    ''')
    
    # Session management table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            session_token TEXT UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP NOT NULL,
            is_active BOOLEAN DEFAULT 1,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    ''')
    
    # File uploads table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS file_uploads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            filename TEXT NOT NULL,
            original_filename TEXT NOT NULL,
            file_type TEXT NOT NULL,
            file_size INTEGER NOT NULL,
            upload_path TEXT NOT NULL,
            analysis_data TEXT DEFAULT '{}',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    ''')
    
    conn.commit()
    conn.close()

class User:
    def __init__(self, db_path: str):
        self.db_path = db_path
    
    def create_user(self, username: str, email: str, password_hash: str) -> int:
        """Create a new user and return user ID"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                INSERT INTO users (username, email, password_hash)
                VALUES (?, ?, ?)
            ''', (username, email, password_hash))
            user_id = cursor.lastrowid
            conn.commit()
            return user_id
        except sqlite3.IntegrityError:
            raise ValueError("Username or email already exists")
        finally:
            conn.close()
    
    def get_user_by_id(self, user_id: int) -> Dict[str, Any]:
        """Get user by ID"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, username, email, created_at, profile_data, settings
            FROM users WHERE id = ?
        ''', (user_id,))
        
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return {
                'id': row[0],
                'username': row[1],
                'email': row[2],
                'created_at': row[3],
                'profile_data': json.loads(row[4]) if row[4] else {},
                'settings': json.loads(row[5]) if row[5] else {}
            }
        return None
    
    def get_user_by_username(self, username: str) -> Dict[str, Any]:
        """Get user by username"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, username, email, password_hash, created_at, profile_data, settings
            FROM users WHERE username = ?
        ''', (username,))
        
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return {
                'id': row[0],
                'username': row[1],
                'email': row[2],
                'password_hash': row[3],
                'created_at': row[4],
                'profile_data': json.loads(row[5]) if row[5] else {},
                'settings': json.loads(row[6]) if row[6] else {}
            }
        return None
    
    def update_profile(self, user_id: int, profile_data: Dict) -> bool:
        """Update user profile data"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                UPDATE users 
                SET profile_data = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            ''', (json.dumps(profile_data), user_id))
            
            updated = cursor.rowcount > 0
            conn.commit()
            return updated
        finally:
            conn.close()
    
    def update_settings(self, user_id: int, settings: Dict) -> bool:
        """Update user settings"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                UPDATE users 
                SET settings = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            ''', (json.dumps(settings), user_id))
            
            updated = cursor.rowcount > 0
            conn.commit()
            return updated
        finally:
            conn.close()

class Conversation:
    def __init__(self, db_path: str):
        self.db_path = db_path
    
    def create_conversation(self, user_id: int, title: str = None) -> int:
        """Create a new conversation"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        title = title or f"Conversation {datetime.now().strftime('%Y-%m-%d %H:%M')}"
        
        cursor.execute('''
            INSERT INTO conversations (user_id, title)
            VALUES (?, ?)
        ''', (user_id, title))
        
        conversation_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return conversation_id
    
    def get_conversations(self, user_id: int) -> List[Dict]:
        """Get all conversations for a user"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, title, created_at, updated_at, metadata
            FROM conversations 
            WHERE user_id = ? 
            ORDER BY updated_at DESC
        ''', (user_id,))
        
        conversations = []
        for row in cursor.fetchall():
            conversations.append({
                'id': row[0],
                'title': row[1],
                'created_at': row[2],
                'updated_at': row[3],
                'metadata': json.loads(row[4]) if row[4] else {}
            })
        
        conn.close()
        return conversations
    
    def get_conversation(self, conversation_id: int, user_id: int) -> Dict:
        """Get a specific conversation with messages"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Get conversation
        cursor.execute('''
            SELECT id, title, created_at, updated_at, metadata
            FROM conversations 
            WHERE id = ? AND user_id = ?
        ''', (conversation_id, user_id))
        
        conv_row = cursor.fetchone()
        if not conv_row:
            conn.close()
            return None
        
        # Get messages
        cursor.execute('''
            SELECT id, role, content, emotion_analysis, created_at, metadata
            FROM messages 
            WHERE conversation_id = ?
            ORDER BY created_at ASC
        ''', (conversation_id,))
        
        messages = []
        for row in cursor.fetchall():
            messages.append({
                'id': row[0],
                'role': row[1],
                'content': row[2],
                'emotion_analysis': json.loads(row[3]) if row[3] else {},
                'created_at': row[4],
                'metadata': json.loads(row[5]) if row[5] else {}
            })
        
        conn.close()
        
        return {
            'id': conv_row[0],
            'title': conv_row[1],
            'created_at': conv_row[2],
            'updated_at': conv_row[3],
            'metadata': json.loads(conv_row[4]) if conv_row[4] else {},
            'messages': messages
        }
    
    def add_message(self, conversation_id: int, role: str, content: str, emotion_analysis: Dict = None) -> int:
        """Add a message to a conversation"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO messages (conversation_id, role, content, emotion_analysis)
            VALUES (?, ?, ?, ?)
        ''', (conversation_id, role, content, json.dumps(emotion_analysis or {})))
        
        message_id = cursor.lastrowid
        
        # Update conversation timestamp
        cursor.execute('''
            UPDATE conversations 
            SET updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        ''', (conversation_id,))
        
        conn.commit()
        conn.close()
        
        return message_id

class EmotionTracker:
    def __init__(self, db_path: str):
        self.db_path = db_path
    
    def record_emotion(self, user_id: int, message_id: int, emotion_type: str, 
                      confidence: float, intensity: float, context: Dict = None) -> int:
        """Record an emotion analysis result"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO emotion_tracking 
            (user_id, message_id, emotion_type, confidence, intensity, context)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (user_id, message_id, emotion_type, confidence, intensity, json.dumps(context or {})))
        
        record_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return record_id
    
    def get_user_emotions(self, user_id: int, days: int = 7) -> List[Dict]:
        """Get emotion history for a user"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT emotion_type, confidence, intensity, context, timestamp
            FROM emotion_tracking 
            WHERE user_id = ? AND timestamp >= datetime('now', '-{} days')
            ORDER BY timestamp DESC
        '''.format(days), (user_id,))
        
        emotions = []
        for row in cursor.fetchall():
            emotions.append({
                'emotion_type': row[0],
                'confidence': row[1],
                'intensity': row[2],
                'context': json.loads(row[3]) if row[3] else {},
                'timestamp': row[4]
            })
        
        conn.close()
        return emotions
    
    def get_emotion_statistics(self, user_id: int, days: int = 7) -> Dict:
        """Get emotion statistics for a user"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT emotion_type, 
                   COUNT(*) as frequency,
                   AVG(confidence) as avg_confidence,
                   AVG(intensity) as avg_intensity
            FROM emotion_tracking 
            WHERE user_id = ? AND timestamp >= datetime('now', '-{} days')
            GROUP BY emotion_type
        '''.format(days), (user_id,))
        
        stats = {}
        for row in cursor.fetchall():
            stats[row[0]] = {
                'frequency': row[1],
                'avg_confidence': row[2],
                'avg_intensity': row[3]
            }
        
        conn.close()
        return stats