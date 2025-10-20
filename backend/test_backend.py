#!/usr/bin/env python3
"""
Simple script to test if the backend is working
"""
import requests
import json

def test_backend():
    base_url = "http://localhost:8000"
    
    print("Testing Mirvaa Backend...")
    print(f"Base URL: {base_url}")
    
    try:
        # Test root endpoint
        print("\n1. Testing root endpoint...")
        response = requests.get(f"{base_url}/")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        # Test health endpoint
        print("\n2. Testing health endpoint...")
        response = requests.get(f"{base_url}/api/health")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        # Test CORS
        print("\n3. Testing CORS...")
        headers = {
            'Origin': 'http://localhost:3000',
            'Access-Control-Request-Method': 'GET',
            'Access-Control-Request-Headers': 'Content-Type'
        }
        response = requests.options(f"{base_url}/api/health", headers=headers)
        print(f"Status: {response.status_code}")
        print(f"CORS Headers: {dict(response.headers)}")
        
        print("\n✅ Backend is working correctly!")
        
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend. Make sure the server is running on http://localhost:8000")
        print("Run: python start_server.py")
    except Exception as e:
        print(f"❌ Error testing backend: {e}")

if __name__ == "__main__":
    test_backend()
