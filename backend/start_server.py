#!/usr/bin/env python3
"""
Simple script to start the backend server for local development
"""
import os
import sys
import subprocess
from pathlib import Path

def main():
    # Change to backend directory
    backend_dir = Path(__file__).parent
    os.chdir(backend_dir)
    
    print("Starting Mirvaa Backend Server...")
    print("Backend directory:", backend_dir)
    print("Python executable:", sys.executable)
    
    # Check if .env file exists
    env_file = backend_dir / '.env'
    if not env_file.exists():
        print("Warning: .env file not found. Creating a basic one...")
        with open(env_file, 'w') as f:
            f.write("""# MongoDB Configuration
MONGO_URL=mongodb://localhost:27017
DB_NAME=mirvaa_fashions

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRATION_DAYS=7

# Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=true

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,https://mirvaa-fashions.vercel.app
""")
        print("Created .env file with default values. Please update MONGO_URL if needed.")
    
    # Start the server
    try:
        print("Starting server on http://localhost:8000")
        print("API documentation available at http://localhost:8000/docs")
        print("Press Ctrl+C to stop the server")
        subprocess.run([sys.executable, "server.py"], check=True)
    except KeyboardInterrupt:
        print("\nServer stopped.")
    except Exception as e:
        print(f"Error starting server: {e}")
        print("Make sure you have all dependencies installed:")
        print("pip install -r requirements.txt")

if __name__ == "__main__":
    main()
