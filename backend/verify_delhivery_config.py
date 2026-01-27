import os
import sys
import json
from dotenv import load_dotenv

# Load env vars from .env file
load_dotenv("backend/.env")

# Ensure we can import delhivery module
sys.path.append(os.path.join(os.getcwd(), "backend"))

from delhivery import DelhiveryClient

def verify_config():
    print("--- Verifying Delhivery Configuration ---")
    
    warehouse_name = os.getenv("DELHIVERY_WAREHOUSE")
    print(f"Warehouse Name from .env: '{warehouse_name}'")
    
    if warehouse_name != "Mirvaa Fashions":
        print("❌ Error: Warehouse name should be 'Mirvaa Fashions'")
        return

    print("Initializing Delhivery Client...")
    try:
        client = DelhiveryClient(is_production=True)
        print("✅ Client initialized successfully.")
        print(f"Client Warehouse: '{client.warehouse_name}'")
        print(f"Client Warehouse Details: {client.warehouse_details}")
        
        # We can try to fetch the waybill to ensure API key is good
        print("\nTesting connection (Fetch Waybill)...")
        waybill = client.fetch_waybill()
        print(f"✅ Connection Successful! Generated Waybill: {waybill}")
        
        print("\n✅ Configuration looks correct. The 'ClientWarehouse matching query does not exist' error should be resolved.")
        
        print("\n--- Attempting Dummy Shipment Creation to Verify Warehouse Name ---")
        dummy_order = {
            "id": "TEST_VERIFY_001",
            "weight": 0.5,
            "payment_method": "prepaid",
            "total": 500,
            "width": 10,
            "height": 10,
            "length": 10
        }
        
        dummy_address = {
            "name": "Mirvaa Tech Test",
            "street": "Test Street",
            "pincode": "500074", 
            "city": "Hyderabad",
            "state": "Telangana",
            "phone": "9876543210"
        }
        
        items = [{
            "name": "Test Product",
            "quantity": 1,
            "price": 500,
            "sku": "TEST-SKU-VERIFY",
            "product_id": "TEST-PID-1"
        }]
        
        resp = client.create_shipment(
            order=dummy_order,
            user={"name": "Test User", "phone": "9876543210"},
            address=dummy_address,
            items=items,
            waybill=waybill
        )
        print(f"✅ Shipment Creation Response: {resp}")
        
        if resp.get('success') or resp.get('packages'):
            print("🎉 SUCCESS! Warehouse name is accepted.")
        else:
            print("⚠️ API returned error (check if related to Warehouse Name):")
            print(resp)

    except Exception as e:
        print(f"❌ Verification Failed: {e}")

if __name__ == "__main__":
    verify_config()
