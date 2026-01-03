import requests
import json
import uuid
import sys
import time

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
    
    print(f"Registering user: {email}")
    res = requests.post(f"{BASE_URL}/auth/register", json=reg_payload)
    if res.status_code != 200:
        print(f"Registration failed: {res.text}")
        sys.exit(1)
        
    data = res.json()
    token = data.get("token")
    user_id = data.get("user")["id"]
    print(f"User registered. Token acquired. User ID: {user_id}")
    return token, user_id

def login_admin():
    print_step("2. Logging in Admin")
    
    payload = {
        "username": "test_admin",
        "password": "password123"
    }
    
    res = requests.post(f"{BASE_URL}/admin/login", json=payload)
    if res.status_code != 200:
        print(f"Admin login failed: {res.text}")
        sys.exit(1)
        
    data = res.json()
    token = data.get("token")
    print("Admin logged in. Token acquired.")
    return token

def create_order(user_token):
    print_step("3. Creating COD Order")
    
    headers = {"Authorization": f"Bearer {user_token}"}
    
    # Dummy Order Data
    order_payload = {
        "items": [
            {
                "product_id": "dummy_product_id",
                "title": "Test Product",
                "price": 500,
                "quantity": 1,
                "image": "http://example.com/image.jpg"
            }
        ],
        "subtotal": 500,
        "tax": 0,
        "shipping": 0,
        "total": 500,
        "payment_method": "cod",
        "shipping_address": {
            "name": "Test Customer",
            "email": "customer@example.com",
            "phone": "9876543210",
            "address": "123 Test Street",
            "city": "Test City",
            "state": "Test State",
            "pincode": "110001" # Valid pincode for Delhivery usually needed, using generic Delhi one
        }
    }
    
    res = requests.post(f"{BASE_URL}/orders/create", json=order_payload, headers=headers)
    if res.status_code != 200:
        print(f"Order creation failed: {res.text}")
        sys.exit(1)
        
    order_data = res.json()
    order_id = order_data["id"] # Use 'id' (UUID) not '_id' (Mongo ID) if endpoints use 'id'
    # The response says: response_dict["_id"] = str(result.inserted_id)
    # But the model has an 'id' field which is a UUID.
    # Let's check what ID the admin endpoint expects.
    # server.py: @api_router.post("/admin/orders/{order_id}/confirm-shipping")
    # order = await db.orders.find_one({"id": order_id})
    # So it expects the UUID 'id'.
    
    print(f"Order created successfully. Order ID: {order_id}")
    print(f"Order Number: {order_data.get('order_number')}")
    return order_id

def confirm_shipping(admin_token, order_id):
    print_step("4. Confirming Shipping (Admin)")
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    url = f"{BASE_URL}/admin/orders/{order_id}/confirm-shipping"
    print(f"Calling: {url}")
    
    res = requests.post(url, headers=headers)
    
    print(f"Status Code: {res.status_code}")
    try:
        data = res.json()
        print_json(data)
        
        if res.status_code == 200:
            if "waybill" in data or "message" in data:
                print("\nSUCCESS: Shipping confirmed and waybill generated (or already exists).")
            else:
                print("\nWARNING: Response OK but no waybill found explicitly?")
        else:
            print("\nFAILURE: Shipping confirmation failed.")
            
    except Exception as e:
        print(f"Error parsing response: {res.text}")

def track_order(user_token, order_id):
    print_step("6. Tracking Shipment")
    headers = {"Authorization": f"Bearer {user_token}"}
    url = f"{BASE_URL}/shipping/track/{order_id}"
    print(f"Calling: {url}")
    res = requests.get(url, headers=headers)
    print(f"Status Code: {res.status_code}")
    try:
        data = res.json()
        print_json(data)
    except Exception:
        print(res.text)

def fetch_label(admin_token, order_id):
    print_step("5. Fetching Label PDF")
    headers = {"Authorization": f"Bearer {admin_token}"}
    url = f"{BASE_URL}/admin/orders/{order_id}/label"
    print(f"Calling: {url}")
    # Retry few times to allow Delhivery to register the package
    for attempt in range(1, 6):
        res = requests.get(url, headers=headers)
        print(f"Attempt {attempt} - Status Code: {res.status_code}")
        content_type = res.headers.get("Content-Type", "")
        if res.status_code == 200 and ("application/pdf" in content_type or res.content.startswith(b"%PDF")):
            filename = f"label_{order_id}.pdf"
            with open(filename, "wb") as f:
                f.write(res.content)
            print(f"Label saved to {filename}")
            return
        else:
            try:
                data = res.json()
                print_json(data)
            except Exception:
                print(res.text)
        if attempt < 5:
            time.sleep(3)

def main():
    try:
        # Check if server is running
        try:
            requests.get(f"{BASE_URL}/health", timeout=2)
        except requests.exceptions.ConnectionError:
            print("Server is not running. Please start the server first.")
            # sys.exit(1) 
            # I will not exit, I will assume I might run this in a context where I start server next.
            # But for this script, it needs a running server.
            pass

        user_token, _ = register_and_login_user()
        admin_token = login_admin()
        order_id = create_order(user_token)
        confirm_shipping(admin_token, order_id)
        fetch_label(admin_token, order_id)
        track_order(user_token, order_id)
        
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

if __name__ == "__main__":
    main()
