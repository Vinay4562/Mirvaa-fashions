#!/usr/bin/env python3
"""
Test script to verify all admin settings functionality
"""
import requests
import json

def test_admin_settings():
    base_url = "http://localhost:8000"
    
    print("Testing Admin Settings Functionality...")
    print(f"Base URL: {base_url}")
    
    # Test admin login
    print("\n1. Testing admin login...")
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    try:
        login_response = requests.post(f"{base_url}/api/admin/login", json=login_data)
        print(f"Login Status: {login_response.status_code}")
        
        if login_response.status_code == 200:
            token = login_response.json()['token']
            headers = {'Authorization': f'Bearer {token}'}
            print("✅ Admin login successful")
            
            # Test admin profile endpoints
            print("\n2. Testing admin profile endpoints...")
            
            # Get admin profile
            profile_response = requests.get(f"{base_url}/api/admin/profile", headers=headers)
            print(f"Get Profile Status: {profile_response.status_code}")
            if profile_response.status_code == 200:
                print("✅ Get admin profile successful")
                print(f"Profile data: {profile_response.json()}")
            else:
                print("❌ Get admin profile failed")
                print(f"Error: {profile_response.text}")
            
            # Update admin profile
            profile_update_data = {
                "name": "Test Admin",
                "email": "admin@mirvaa.com",
                "phone": "+1234567890",
                "address": "Test Address"
            }
            
            update_profile_response = requests.put(f"{base_url}/api/admin/profile", 
                                                 json=profile_update_data, headers=headers)
            print(f"Update Profile Status: {update_profile_response.status_code}")
            if update_profile_response.status_code == 200:
                print("✅ Update admin profile successful")
            else:
                print("❌ Update admin profile failed")
                print(f"Error: {update_profile_response.text}")
            
            # Test store settings endpoints
            print("\n3. Testing store settings endpoints...")
            
            # Get store settings
            store_response = requests.get(f"{base_url}/api/settings/store", headers=headers)
            print(f"Get Store Settings Status: {store_response.status_code}")
            if store_response.status_code == 200:
                print("✅ Get store settings successful")
                print(f"Store settings: {store_response.json()}")
            else:
                print("❌ Get store settings failed")
                print(f"Error: {store_response.text}")
            
            # Update store settings
            store_update_data = {
                "store_name": "Mirvaa Fashions Test",
                "business_address": "Test Business Address",
                "customer_care_email": "support@mirvaa.com",
                "customer_support_phone": "+1234567890",
                "return_address": "Test Return Address",
                "social_facebook": "https://facebook.com/mirvaa",
                "social_instagram": "https://instagram.com/mirvaa",
                "social_twitter": "https://twitter.com/mirvaa",
                "logo_url": "https://example.com/logo.png",
                "favicon_url": "https://example.com/favicon.ico",
                "maintenance_mode": False,
                "theme": "light"
            }
            
            update_store_response = requests.put(f"{base_url}/api/settings/store", 
                                               json=store_update_data, headers=headers)
            print(f"Update Store Settings Status: {update_store_response.status_code}")
            if update_store_response.status_code == 200:
                print("✅ Update store settings successful")
            else:
                print("❌ Update store settings failed")
                print(f"Error: {update_store_response.text}")
            
            # Test password change
            print("\n4. Testing password change...")
            password_data = {
                "current_password": "admin123",
                "new_password": "newpassword123"
            }
            
            password_response = requests.post(f"{base_url}/api/admin/change-password", 
                                            json=password_data, headers=headers)
            print(f"Password Change Status: {password_response.status_code}")
            if password_response.status_code == 200:
                print("✅ Password change successful")
            else:
                print("❌ Password change failed")
                print(f"Error: {password_response.text}")
            
            # Test username change
            print("\n5. Testing username change...")
            username_data = {
                "current_password": "newpassword123",
                "new_username": "admin_new"
            }
            
            username_response = requests.post(f"{base_url}/api/admin/change-username", 
                                           json=username_data, headers=headers)
            print(f"Username Change Status: {username_response.status_code}")
            if username_response.status_code == 200:
                print("✅ Username change successful")
                print(f"New token: {username_response.json().get('token', 'N/A')}")
            else:
                print("❌ Username change failed")
                print(f"Error: {username_response.text}")
            
            print("\n✅ All admin settings tests completed!")
            
        else:
            print("❌ Admin login failed")
            print(f"Error: {login_response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend. Make sure the server is running on http://localhost:8000")
        print("Run: python start_server.py")
    except Exception as e:
        print(f"❌ Error testing admin settings: {e}")

if __name__ == "__main__":
    test_admin_settings()
