import os
import requests
import json
from typing import Dict, Any, List, Optional
from datetime import datetime

class DelhiveryClient:
    """
    Client for interacting with the Delhivery CMU API
    """
    BASE_URL = "https://track.delhivery.com"
    STAGING_URL = "https://staging-express.delhivery.com"
    
    def __init__(self, api_key: str = None, client_name: str = None, warehouse_name: str = None, is_production: bool = True):
        """
        Initialize the Delhivery client
        """
        self.api_key = api_key or os.environ.get("DELHIVERY_API_KEY")
        self.client_name = client_name or os.environ.get("DELHIVERY_CLIENT")
        self.warehouse_name = warehouse_name or os.environ.get("DELHIVERY_WAREHOUSE")
        self.warehouse_details = {
            "name": self.warehouse_name,
            "add": os.environ.get("WAREHOUSE_ADDRESS", ""),
            "pin_code": os.environ.get("WAREHOUSE_PIN", ""),
            "city": os.environ.get("WAREHOUSE_CITY", ""),
            "state": os.environ.get("WAREHOUSE_STATE", ""),
            "country": "India",
            "phone": os.environ.get("WAREHOUSE_PHONE", "")
        }
        self.base_url = self.BASE_URL if is_production else self.STAGING_URL
        
        if not self.api_key:
            print("Warning: DELHIVERY_API_KEY is not set")

    def _make_request(self, method: str, endpoint: str, data: Dict = None, params: Dict = None, use_json_format_param: bool = False) -> Dict:
        """
        Make a request to the Delhivery API
        """
        url = f"{self.base_url}/{endpoint}"
        headers = {
            "Authorization": f"Token {self.api_key}",
            "Content-Type": "application/json"
        }
        
        try:
            if method.lower() == "get":
                # For GET requests, usually token is passed as query param or header
                # Some Delhivery APIs require token in query params
                if params is None:
                    params = {}
                if "token" not in params:
                    params["token"] = self.api_key
                
                response = requests.get(url, headers=headers, params=params)
            
            elif method.lower() == "post":
                if use_json_format_param:
                    # For CMU API, payload is often passed as 'format=json&data={...}'
                    # But providing it as raw JSON usually works with correct headers
                    # Or we can send as form-data
                    payload = {
                        "format": "json",
                        "data": json.dumps(data)
                    }
                    # When sending as form data, don't set Content-Type: application/json
                    headers.pop("Content-Type", None) 
                    response = requests.post(url, headers={"Authorization": f"Token {self.api_key}"}, data=payload)
                else:
                    response = requests.post(url, headers=headers, json=data)
            
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            response.raise_for_status()
            
            # Try to parse JSON, but some endpoints might return other formats
            try:
                return response.json()
            except json.JSONDecodeError:
                return {"text": response.text, "success": response.ok}
                
        except requests.exceptions.RequestException as e:
            print(f"Delhivery API Request Error: {str(e)}")
            if hasattr(e.response, 'text'):
                print(f"Response: {e.response.text}")
            raise e

    def fetch_waybill(self, count: int = 1) -> str:
        """
        Fetch a new Waybill from Delhivery
        """
        # The endpoint usually requires 'token' in query params even if Authorization header is set,
        # or relies on header. _make_request handles token in params for GET.
        response = self._make_request("get", "waybill/api/fetch/json/", params={"count": count})
        
        # Handle various response formats
        if isinstance(response, dict) and "waybill" in response:
            return response["waybill"]
        elif isinstance(response, list) and len(response) > 0:
            return response[0]
        elif isinstance(response, str):
            return response
            
        return str(response)

    def create_shipment(self, order: Dict[str, Any], user: Dict[str, Any], 
                       address: Dict[str, Any], items: List[Dict[str, Any]], waybill: str = "") -> Dict[str, Any]:
        """
        Create a shipment (Manifest) in Delhivery
        """
        # Calculate total weight (default to 0.5kg if not specified)
        total_weight = order.get("weight", 0.5) * 1000  # Convert to grams

        
        # Prepare products
        products = []
        for item in items:
            # Fix: safely get product_id or fallback
            sku_fallback = f"MIRVAA-{item.get('product_id', 'UNKNOWN')}"
            products.append({
                "name": item.get("name") or item.get("title") or item.get("product_title") or "Product",
                "sku": item.get("sku") or sku_fallback,
                "units": item.get("quantity", 1),
                "price": item.get("price", 0),
                "gross_amount": item.get("price", 0) * item.get("quantity", 1),
                # "tax_rate": 0, # Optional
                # "hsn_code": "" # Optional but recommended
            })

        # Payment mode
        payment_mode = "COD" if order.get("payment_method") == "cod" else "Prepaid"
        
        # Construct payload
        payload = {
            "shipments": [{
                "name": address.get("name", "Customer"),
                "add": address.get("street") or address.get("address") or "",
                "pin": address.get("pincode") or address.get("pin") or "",
                "city": address.get("city", ""),
                "state": address.get("state", ""),
                "country": "India",
                "phone": address.get("phone", ""),
                "order": str(order.get("id", "")), # Ensure string
                "payment_mode": payment_mode,
                "return_pin": "", # Optional, uses warehouse default
                "return_city": "",
                "return_phone": "",
                "return_add": "",
                "products_desc": ", ".join([p["name"] for p in products])[:150], # Truncate if too long
                "hsn_code": "", # Optional
                "cod_amount": float(order.get("total", 0)) if payment_mode == "COD" else 0,
                "order_date": datetime.now().isoformat(),
                "total_amount": float(order.get("total", 0)),
                "seller_add": "", # Optional, uses warehouse default
                "seller_name": self.client_name,
                "seller_inv": "", # Optional
                "quantity": sum(item.get("quantity", 1) for item in items),
                "waybill": waybill, # Use provided waybill or empty for auto-generation
                "shipment_width": order.get("width", 10),
                "shipment_height": order.get("height", 10),
                "shipment_depth": order.get("length", 10), # Length
                "shipment_weight": int(total_weight * 1000) if total_weight < 100 else int(total_weight), # Ensure grams logic
            }],
            "pickup_location": {
                "name": self.warehouse_name,
                "add": "", # Optional if registered
                "city": "",
                "pin_code": "",
                "country": "India",
                "phone": ""
            }
        }

        # Note: 'pickup_location' in payload structure for CMU might differ.
        # Often it's just "pickup_location": "NameOfWarehouse" as a string in the shipment object or separate field.
        # Let's re-verify the payload structure.
        # Based on search result: "Pickup location to be passed in the API needs to be exactly the same as the name of the warehouse registered"
        # And payload usually has `pickup_location` at root or inside.
        
        # Correct Payload Structure for CMU Create:
        # { "format": "json", "data": { "pickup_location": "...", "shipments": [...] } }
        
        final_payload = {
            "pickup_location": self.warehouse_details,
            "shipments": payload["shipments"]
        }
        
        return self._make_request("post", "api/cmu/create.json", data=final_payload, use_json_format_param=True)

    def create_return_shipment(self, order: Dict[str, Any], address: Dict[str, Any], items: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Create a Reverse Pickup (Return) shipment in Delhivery
        """
        # Calculate total weight
        total_weight = order.get("weight", 0.5) * 1000
        
        # Prepare products
        products = []
        for item in items:
            products.append({
                "name": item.get("name") or item.get("product_title") or "Product",
                "sku": item.get("sku", f"MIRVAA-{item.get('product_id', 'RET')}"),
                "units": item.get("quantity", 1),
                "price": item.get("price", 0),
                "gross_amount": item.get("price", 0) * item.get("quantity", 1),
            })

        # For Reverse Pickup:
        # Pickup Location = Customer Address
        # Consignee (Destination) = Warehouse (or Seller)
        
        # Note: Since we might not have the full Warehouse address in env, 
        # we'll use a placeholder or assume the user will configure it.
        # Ideally, this should come from settings.
        warehouse_address = {
            "name": self.client_name or "Mirvaa Fashions",
            "add": os.environ.get("WAREHOUSE_ADDRESS", "Warehouse Address, Hyderabad"),
            "pin": os.environ.get("WAREHOUSE_PIN", "500001"),
            "city": os.environ.get("WAREHOUSE_CITY", "Hyderabad"),
            "state": os.environ.get("WAREHOUSE_STATE", "Telangana"),
            "phone": os.environ.get("WAREHOUSE_PHONE", "9999999999")
        }
        
        payload = {
            "pickup_location": {
                "name": address["name"],
                "add": address["street"],
                "pin": address["pincode"],
                "city": address["city"],
                "state": address["state"],
                "country": "India",
                "phone": address["phone"]
            },
            "shipments": [{
                "name": warehouse_address["name"],
                "add": warehouse_address["add"],
                "pin": warehouse_address["pin"],
                "city": warehouse_address["city"],
                "state": warehouse_address["state"],
                "country": "India",
                "phone": warehouse_address["phone"],
                "order": f"RET-{order.get('order_number', order.get('id'))}",
                "payment_mode": "Prepaid", # Seller pays for return
                "products_desc": ", ".join([p["name"] for p in products])[:150],
                "cod_amount": 0,
                "order_date": datetime.now().isoformat(),
                "total_amount": order.get("total", 0),
                "quantity": sum(item.get("quantity", 1) for item in items),
                "shipment_width": order.get("width", 10),
                "shipment_height": order.get("height", 10),
                "shipment_depth": order.get("length", 10),
                "shipment_weight": int(total_weight * 1000) if total_weight < 100 else int(total_weight),
            }]
        }
        
        # Use the same create endpoint but with swapped locations
        return self._make_request("post", "api/cmu/create.json", data=payload, use_json_format_param=True)

    def track_shipment(self, waybill: str) -> Dict[str, Any]:
        """
        Track a shipment by Waybill
        """
        return self._make_request("get", "api/v1/packages/json/", params={"waybill": waybill, "verbose": 0})

    def generate_label_url(self, waybill: str) -> str:
        """
        Generate URL for the shipping label
        """
        # Delhivery label URL usually works like this
        return f"{self.base_url}/api/p-packing-slip?wb={waybill}&pdf=true"

    def get_label_pdf(self, waybill: str) -> bytes:
        """
        Fetch the shipping label PDF
        """
        url = f"{self.base_url}/api/p-packing-slip"
        params = {"wbns": waybill, "pdf": "true"}
        
        try:
            # We use requests directly here to get raw bytes
            response = requests.get(url, params=params, headers={"Authorization": f"Token {self.api_key}"})
            response.raise_for_status()
            return response.content
        except requests.exceptions.RequestException as e:
            print(f"Error fetching label PDF: {e}")
            raise e

    def schedule_pickup(self, pickup_time: str, pickup_date: str, pickup_location: str, expected_package_count: int = 1) -> Dict[str, Any]:
        """
        Schedule a pickup
        """
        payload = {
            "pickup_time": pickup_time,
            "pickup_date": pickup_date,
            "pickup_location": pickup_location,
            "expected_package_count": expected_package_count
        }
        return self._make_request("post", "fm/request/new/", data=payload)

    def check_serviceability(self, pincode: str) -> Dict[str, Any]:
        """
        Check serviceability for a pincode
        """
        return self._make_request("get", "c/api/pin-codes/json/", params={"filter_codes": pincode})
