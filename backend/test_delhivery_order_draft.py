import requests
import json
import uuid
import sys
from datetime import datetime

BASE_URL = "http://localhost:8000/api"

def print_step(msg):
    print(f"\n{'='*50}\n{msg}\n{'='*50}")

def print_json(data):
    print(json.dumps(data, indent=2))

def register_and_login_user():
    print_step("1. Registering and Logging in User")
    
    email = f"test_user_{uuid.uuid4().hex[:8]}@example.com"
    password = "password123"
    name = "Test User"
    
    # Register
    reg_payload = {
        "email": email,
        "password": password,
        "name": name,
        "phone": "9876543210"
    }
    
    try:
        # Note: server.py might not have a public register endpoint shown in my snippets, 
        # but usually it's /auth/register or similar. Let's check api_router prefix.
        # Wait, I didn't verify the register endpoint. Let's assume /auth/register based on common patterns 
        # or check server.py again. 
        # Actually, let's look for user registration in server.py.
        pass
    except Exception as e:
        print(f"Error preparing registration: {e}")

    # I'll check for register endpoint in a moment. 
    # For now I will assume /auth/register and /auth/login based on standard practices 
    # but I should verify if I can.
    
    # Re-reading server.py snippets... I don't see /auth/register.
    # I see @api_router defined with prefix="/api".
    # I should check if there are auth routes.
    
    return email, password

# Let's verify auth routes first.
