"""OpenRouter API service for AI model integration"""
import requests
import json
import time
from typing import Dict, List, Any, Optional
from config import Config

class OpenRouterService:
    def __init__(self, api_key: str, base_url: str, model: str):
        self.api_key = api_key
        self.base_url = base_url
        self.model = model
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://lumi-ai-companion.com',
            'X-Title': 'LuMi AI Companion'
        }
    
    def generate_response(self, messages: List[Dict[str, str]], **kwargs) -> Dict[str, Any]:
        """
        Generate AI response using OpenRouter API
        
        Args:
            messages: List of message dictionaries with 'role' and 'content'
            **kwargs: Additional parameters like temperature, max_tokens, etc.
        
        Returns:
            Dictionary containing the AI response and metadata
        """
        if not self.api_key:
            raise ValueError("OpenRouter API key not configured")
        
        payload = {
            'model': self.model,
            'messages': messages,
            'stream': False
        }
        
        # Add optional parameters
        if 'temperature' in kwargs:
            payload['temperature'] = kwargs['temperature']
        if 'max_tokens' in kwargs:
            payload['max_tokens'] = kwargs['max_tokens']
        if 'top_p' in kwargs:
            payload['top_p'] = kwargs['top_p']
        if 'frequency_penalty' in kwargs:
            payload['frequency_penalty'] = kwargs['frequency_penalty']
        if 'presence_penalty' in kwargs:
            payload['presence_penalty'] = kwargs['presence_penalty']
        
        try:
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=self.headers,
                json=payload,
                timeout=30
            )
            
            response.raise_for_status()
            result = response.json()
            
            if 'choices' not in result or not result['choices']:
                raise ValueError("No response choices from OpenRouter API")
            
            choice = result['choices'][0]
            
            return {
                'content': choice.get('message', {}).get('content', ''),
                'role': choice.get('message', {}).get('role', 'assistant'),
                'model': result.get('model', self.model),
                'usage': result.get('usage', {}),
                'finish_reason': choice.get('finish_reason', ''),
                'timestamp': time.time()
            }
            
        except requests.exceptions.RequestException as e:
            raise Exception(f"OpenRouter API request failed: {str(e)}")
        except json.JSONDecodeError as e:
            raise Exception(f"Failed to parse OpenRouter API response: {str(e)}")
        except Exception as e:
            raise Exception(f"OpenRouter service error: {str(e)}")
    
    def get_models(self) -> List[Dict[str, Any]]:
        """
        Get available models from OpenRouter
        
        Returns:
            List of available models
        """
        if not self.api_key:
            raise ValueError("OpenRouter API key not configured")
        
        try:
            response = requests.get(
                f"{self.base_url}/models",
                headers=self.headers,
                timeout=10
            )
            
            response.raise_for_status()
            result = response.json()
            return result.get('data', [])
            
        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to get models from OpenRouter: {str(e)}")
        except Exception as e:
            raise Exception(f"OpenRouter models service error: {str(e)}")