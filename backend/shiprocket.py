import os
import requests
from typing import Dict, Any, List, Optional
from datetime import datetime
import json

class ShiprocketClient:
    """
    Client for interacting with the Shiprocket API
    """
    BASE_URL = "https://apiv2.shiprocket.in/v1/external"
    
    def __init__(self, email: str = None, password: str = None, token: str = None):
        """
        Initialize the Shiprocket client with either credentials or a token
        """
        self.token = token
        
        # If token is not provided, use credentials from environment or params
        if not self.token:
            self.email = email or os.environ.get("SHIPROCKET_EMAIL")
            self.password = password or os.environ.get("SHIPROCKET_PASSWORD")
            self.token = self._get_token()
    
    def _get_token(self) -> str:
        """
        Get authentication token from Shiprocket
        """
        url = f"{self.BASE_URL}/auth/login"
        payload = {
            "email": self.email,
            "password": self.password
        }
        
        response = requests.post(url, json=payload)
        response.raise_for_status()
        
        return response.json().get("token")
    
    def _make_request(self, method: str, endpoint: str, data: Dict = None, params: Dict = None) -> Dict:
        """
        Make a request to the Shiprocket API
        """
        url = f"{self.BASE_URL}/{endpoint}"
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        
        if method.lower() == "get":
            response = requests.get(url, headers=headers, params=params)
        elif method.lower() == "post":
            response = requests.post(url, headers=headers, json=data)
        elif method.lower() == "put":
            response = requests.put(url, headers=headers, json=data)
        elif method.lower() == "delete":
            response = requests.delete(url, headers=headers)
        else:
            raise ValueError(f"Unsupported HTTP method: {method}")
        
        response.raise_for_status()
        return response.json()
    
    def create_order(self, order_data: Dict[str, Any]) -> Dict:
        """
        Create a new order in Shiprocket
        
        Args:
            order_data: Order details as per Shiprocket API requirements
            
        Returns:
            Response from Shiprocket API
        """
        return self._make_request("post", "orders/create/adhoc", data=order_data)
    
    def track_order(self, shipment_id: str) -> Dict:
        """
        Track an order by shipment ID
        
        Args:
            shipment_id: Shiprocket shipment ID
            
        Returns:
            Tracking information
        """
        return self._make_request("get", f"courier/track/shipment/{shipment_id}")
    
    def get_courier_serviceability(self, pickup_postcode: str, delivery_postcode: str, 
                                  weight: float, cod: bool = False) -> Dict:
        """
        Check courier serviceability between locations
        
        Args:
            pickup_postcode: Pickup location postcode
            delivery_postcode: Delivery location postcode
            weight: Package weight in kg
            cod: Whether Cash on Delivery is required
            
        Returns:
            Available courier services
        """
        params = {
            "pickup_postcode": pickup_postcode,
            "delivery_postcode": delivery_postcode,
            "weight": weight,
            "cod": 1 if cod else 0
        }
        
        return self._make_request("get", "courier/serviceability", params=params)
    
    def generate_label(self, shipment_id: str) -> Dict:
        """
        Generate shipping label for an order
        
        Args:
            shipment_id: Shiprocket shipment ID
            
        Returns:
            Label information including URL
        """
        return self._make_request("post", "courier/generate/label", data={"shipment_id": shipment_id})
    
    def generate_invoice(self, order_id: str) -> Dict:
        """
        Generate invoice for an order
        
        Args:
            order_id: Shiprocket order ID
            
        Returns:
            Invoice information including URL
        """
        return self._make_request("post", "orders/print/invoice", data={"ids": [order_id]})
    
    def cancel_order(self, order_id: str) -> Dict:
        """
        Cancel an order
        
        Args:
            order_id: Shiprocket order ID
            
        Returns:
            Cancellation status
        """
        return self._make_request("post", "orders/cancel", data={"ids": [order_id]})
    
    def format_mirvaa_order(self, order: Dict[str, Any], user: Dict[str, Any], 
                           address: Dict[str, Any], items: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Format a Mirvaa order for Shiprocket
        
        Args:
            order: Order details from Mirvaa
            user: User information
            address: Shipping address
            items: Order items
            
        Returns:
            Formatted order data for Shiprocket API
        """
        # Format order items for Shiprocket
        order_items = []
        for item in items:
            order_items.append({
                "name": item["name"],
                "sku": item["sku"] if "sku" in item else f"MIRVAA-{item['product_id']}",
                "units": item["quantity"],
                "selling_price": item["price"],
                "discount": item.get("discount", 0),
                "tax": item.get("tax", 0),
                "hsn": item.get("hsn", "")
            })
        
        # Format the order for Shiprocket
        shiprocket_order = {
            "order_id": order["order_id"],
            "order_date": datetime.fromisoformat(order["created_at"]).strftime("%Y-%m-%d %H:%M"),
            "pickup_location": "Primary",  # Default pickup location name
            "channel_id": "",  # Can be set if using multiple channels
            "comment": order.get("notes", ""),
            "billing_customer_name": address["name"],
            "billing_last_name": "",
            "billing_address": address["street"],
            "billing_city": address["city"],
            "billing_pincode": address["pincode"],
            "billing_state": address["state"],
            "billing_country": "India",
            "billing_email": user["email"],
            "billing_phone": address["phone"],
            "shipping_is_billing": True,
            "shipping_customer_name": address["name"],
            "shipping_address": address["street"],
            "shipping_city": address["city"],
            "shipping_pincode": address["pincode"],
            "shipping_state": address["state"],
            "shipping_country": "India",
            "shipping_email": user["email"],
            "shipping_phone": address["phone"],
            "order_items": order_items,
            "payment_method": "COD" if order["payment_method"] == "cod" else "Prepaid",
            "sub_total": order["subtotal"],
            "length": order.get("length", 10),
            "breadth": order.get("breadth", 10),
            "height": order.get("height", 10),
            "weight": order.get("weight", 0.5)
        }
        
        return shiprocket_order