import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
import requests
from dotenv import load_dotenv
import traceback

# Load environment variables
load_dotenv('d:/Projects/Mirvaa/backend/.env')

MONGO_URL = os.environ.get('MONGO_URL')
DELHIVERY_API_KEY = "e4513a669ba8bca907821ed53d3fc22039dc8cce"  # From server.py
ORDER_ID = "444658df-c9d2-4685-abf3-e02352df078d"

async def debug_label():
    try:
        print(f"Connecting to MongoDB: {MONGO_URL}")
        client = AsyncIOMotorClient(MONGO_URL)
        db = client[os.environ.get('DB_NAME', 'mirvaa_fashions')]
        
        print(f"Fetching order: {ORDER_ID}")
        order = await db.orders.find_one({"id": ORDER_ID})
        
        if not order:
            print("Order not found!")
            return
            
        print(f"Order found: {order.get('order_number')}")
        wb = order.get("delhivery_waybill")
        print(f"Waybill: {wb}")
        
        if not wb:
            print("No waybill found for this order.")
            return

        url = f"https://track.delhivery.com/api/p/packing_slip?wbns={wb}"
        print(f"Requesting URL: {url}")
        
        try:
            resp = requests.get(url, headers={"Authorization": f"Token {DELHIVERY_API_KEY}"}, timeout=15)
            print(f"Response Status Code: {resp.status_code}")
            print(f"Response Headers: {resp.headers}")
            
            if resp.ok:
                print("Success! Label content length:", len(resp.content))
                # Save to file to verify
                with open("debug_label.pdf", "wb") as f:
                    f.write(resp.content)
                print("Saved to debug_label.pdf")
            else:
                print("Failed!")
                print("Response text:", resp.text)
                
        except requests.exceptions.RequestException as e:
            print(f"Network/Request Error: {e}")
            
    except Exception as e:
        print(f"General Error: {e}")
        traceback.print_exc()
    finally:
        if 'client' in locals():
            client.close()

if __name__ == "__main__":
    asyncio.run(debug_label())
