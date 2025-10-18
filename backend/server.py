from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import razorpay

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Razorpay client (will be mocked for now)
RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID', 'mock_key_id')
RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET', 'mock_secret')

# JWT Secret
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_DAYS = 7

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# ==================== Models ====================

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    phone: Optional[str] = None
    addresses: List[Dict[str, Any]] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    token: str
    user: User

class AdminLogin(BaseModel):
    username: str
    password: str

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    category: str
    subcategory: Optional[str] = None
    brand: Optional[str] = None
    price: float
    mrp: float
    discount_percent: Optional[int] = 0
    images: List[str] = Field(default_factory=list)
    sizes: List[str] = Field(default_factory=list)
    colors: List[str] = Field(default_factory=list)
    stock: int = 0
    sku: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    rating: float = 0.0
    reviews_count: int = 0
    is_featured: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductCreate(BaseModel):
    title: str
    description: str
    category: str
    subcategory: Optional[str] = None
    brand: Optional[str] = None
    price: float
    mrp: float
    images: List[str] = Field(default_factory=list)
    sizes: List[str] = Field(default_factory=list)
    colors: List[str] = Field(default_factory=list)
    stock: int
    sku: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    is_featured: bool = False

class CartItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    product_id: str
    quantity: int
    size: Optional[str] = None
    color: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CartItemAdd(BaseModel):
    product_id: str
    quantity: int = 1
    size: Optional[str] = None
    color: Optional[str] = None

class WishlistItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    product_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_number: str
    user_id: str
    items: List[Dict[str, Any]]
    subtotal: float
    tax: float
    shipping: float
    total: float
    status: str = "pending"
    payment_method: str
    payment_status: str = "pending"
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    shipping_address: Dict[str, Any]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OrderCreate(BaseModel):
    items: List[Dict[str, Any]]
    subtotal: float
    tax: float
    shipping: float
    total: float
    payment_method: str
    shipping_address: Dict[str, Any]

class Review(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_id: str
    user_id: str
    rating: int
    comment: str
    user_name: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ReviewCreate(BaseModel):
    product_id: str
    rating: int
    comment: str

# CMS Models
class CMSPage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    slug: str  # privacy-policy, return-policy, terms-conditions
    title: str
    content: str
    meta_description: Optional[str] = None
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CMSPageUpdate(BaseModel):
    title: str
    content: str
    meta_description: Optional[str] = None

# Admin Profile Models
class AdminProfile(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None

class AdminPasswordChange(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str

class AdminUsernameChange(BaseModel):
    current_password: str
    new_username: str

# Store Settings Models
class StoreSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    store_name: str = "Mirvaa Fashions"
    business_address: Optional[str] = None
    customer_care_email: Optional[str] = None
    customer_support_phone: Optional[str] = None
    return_address: Optional[str] = None
    social_facebook: Optional[str] = None
    social_instagram: Optional[str] = None
    social_twitter: Optional[str] = None
    maintenance_mode: bool = False
    store_logo_url: Optional[str] = None
    favicon_url: Optional[str] = None
    theme: str = "light"
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StoreSettingsUpdate(BaseModel):
    store_name: Optional[str] = None
    business_address: Optional[str] = None
    customer_care_email: Optional[str] = None
    customer_support_phone: Optional[str] = None
    return_address: Optional[str] = None
    social_facebook: Optional[str] = None
    social_instagram: Optional[str] = None
    social_twitter: Optional[str] = None
    maintenance_mode: Optional[bool] = None
    store_logo_url: Optional[str] = None
    favicon_url: Optional[str] = None
    theme: Optional[str] = None

# Audit Log Model
class AuditLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    admin_id: str
    admin_username: str
    action: str
    details: str
    ip_address: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== Helper Functions ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str) -> str:
    expiration = datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRATION_DAYS)
    payload = {
        'user_id': user_id,
        'email': email,
        'exp': expiration
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(token: str) -> Dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict:
    payload = verify_token(credentials.credentials)
    user = await db.users.find_one({"id": payload['user_id']}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict:
    payload = verify_token(credentials.credentials)
    admin = await db.admins.find_one({"id": payload['user_id']}, {"_id": 0})
    if not admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return admin

# ==================== Auth Routes ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserRegister):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    hashed_pw = hash_password(user_data.password)
    user = User(
        email=user_data.email,
        name=user_data.name,
        phone=user_data.phone
    )
    
    user_dict = user.model_dump()
    user_dict['password'] = hashed_pw
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    
    await db.users.insert_one(user_dict)
    
    token = create_token(user.id, user.email)
    return TokenResponse(token=token, user=user)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user_doc = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user_doc['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Convert datetime
    if isinstance(user_doc['created_at'], str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    user_doc.pop('password', None)
    user = User(**user_doc)
    
    token = create_token(user.id, user.email)
    return TokenResponse(token=token, user=user)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: Dict = Depends(get_current_user)):
    if isinstance(current_user['created_at'], str):
        current_user['created_at'] = datetime.fromisoformat(current_user['created_at'])
    current_user.pop('password', None)
    return User(**current_user)

# ==================== Admin Auth ====================

@api_router.post("/admin/login")
async def admin_login(credentials: AdminLogin):
    # Check if admin exists, if not create default admin
    admin_doc = await db.admins.find_one({"username": credentials.username}, {"_id": 0})
    
    if not admin_doc:
        # Create default admin on first login attempt with correct credentials
        if credentials.username == "admin" and credentials.password == "admin123":
            default_admin = {
                "id": str(uuid.uuid4()),
                "username": "admin",
                "password": hash_password("admin123"),
                "role": "admin",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.admins.insert_one(default_admin)
            token = create_token(default_admin['id'], credentials.username)
            return {"token": token, "username": credentials.username, "role": "admin"}
        else:
            raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, admin_doc['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(admin_doc['id'], credentials.username)
    return {"token": token, "username": credentials.username, "role": admin_doc['role']}

# ==================== Product Routes ====================

@api_router.get("/products", response_model=List[Product])
async def get_products(
    category: Optional[str] = None,
    subcategory: Optional[str] = None,
    search: Optional[str] = None,
    sort: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    limit: int = 50,
    skip: int = 0
):
    query = {}
    
    if category:
        query['category'] = category
    if subcategory:
        query['subcategory'] = subcategory
    if search:
        query['$or'] = [
            {'title': {'$regex': search, '$options': 'i'}},
            {'description': {'$regex': search, '$options': 'i'}},
            {'tags': {'$regex': search, '$options': 'i'}}
        ]
    if min_price is not None or max_price is not None:
        query['price'] = {}
        if min_price is not None:
            query['price']['$gte'] = min_price
        if max_price is not None:
            query['price']['$lte'] = max_price
    
    sort_option = None
    if sort == 'price_low':
        sort_option = [('price', 1)]
    elif sort == 'price_high':
        sort_option = [('price', -1)]
    elif sort == 'newest':
        sort_option = [('created_at', -1)]
    elif sort == 'rating':
        sort_option = [('rating', -1)]
    
    cursor = db.products.find(query, {"_id": 0})
    
    if sort_option:
        cursor = cursor.sort(sort_option)
    
    products = await cursor.skip(skip).limit(limit).to_list(limit)
    
    for product in products:
        if isinstance(product['created_at'], str):
            product['created_at'] = datetime.fromisoformat(product['created_at'])
    
    return products

@api_router.get("/products/featured", response_model=List[Product])
async def get_featured_products():
    products = await db.products.find({"is_featured": True}, {"_id": 0}).limit(8).to_list(8)
    
    for product in products:
        if isinstance(product['created_at'], str):
            product['created_at'] = datetime.fromisoformat(product['created_at'])
    
    return products

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if isinstance(product['created_at'], str):
        product['created_at'] = datetime.fromisoformat(product['created_at'])
    
    return Product(**product)

@api_router.post("/products", response_model=Product)
async def create_product(product_data: ProductCreate, admin: Dict = Depends(get_current_admin)):
    product = Product(**product_data.model_dump())
    product.discount_percent = int(((product.mrp - product.price) / product.mrp) * 100) if product.mrp > 0 else 0
    
    product_dict = product.model_dump()
    product_dict['created_at'] = product_dict['created_at'].isoformat()
    
    await db.products.insert_one(product_dict)
    return product

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product_data: ProductCreate, admin: Dict = Depends(get_current_admin)):
    existing = await db.products.find_one({"id": product_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = product_data.model_dump()
    update_data['discount_percent'] = int(((update_data['mrp'] - update_data['price']) / update_data['mrp']) * 100) if update_data['mrp'] > 0 else 0
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.products.update_one({"id": product_id}, {"$set": update_data})
    
    updated_product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if isinstance(updated_product['created_at'], str):
        updated_product['created_at'] = datetime.fromisoformat(updated_product['created_at'])
    
    return Product(**updated_product)

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, admin: Dict = Depends(get_current_admin)):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}

# ==================== Cart Routes ====================

@api_router.get("/cart")
async def get_cart(current_user: Dict = Depends(get_current_user)):
    cart_items = await db.cart.find({"user_id": current_user['id']}, {"_id": 0}).to_list(100)
    
    # Populate product details
    enriched_items = []
    for item in cart_items:
        product = await db.products.find_one({"id": item['product_id']}, {"_id": 0})
        if product:
            if isinstance(item['created_at'], str):
                item['created_at'] = datetime.fromisoformat(item['created_at'])
            if isinstance(product['created_at'], str):
                product['created_at'] = datetime.fromisoformat(product['created_at'])
            enriched_items.append({
                **item,
                "product": product
            })
    
    return enriched_items

@api_router.post("/cart")
async def add_to_cart(item_data: CartItemAdd, current_user: Dict = Depends(get_current_user)):
    # Check if item already exists in cart
    existing = await db.cart.find_one({
        "user_id": current_user['id'],
        "product_id": item_data.product_id,
        "size": item_data.size,
        "color": item_data.color
    })
    
    if existing:
        # Update quantity
        new_quantity = existing['quantity'] + item_data.quantity
        await db.cart.update_one(
            {"id": existing['id']},
            {"$set": {"quantity": new_quantity}}
        )
        return {"message": "Cart updated", "id": existing['id']}
    else:
        # Create new cart item
        cart_item = CartItem(
            user_id=current_user['id'],
            product_id=item_data.product_id,
            quantity=item_data.quantity,
            size=item_data.size,
            color=item_data.color
        )
        
        cart_dict = cart_item.model_dump()
        cart_dict['created_at'] = cart_dict['created_at'].isoformat()
        
        await db.cart.insert_one(cart_dict)
        return {"message": "Added to cart", "id": cart_item.id}

@api_router.put("/cart/{item_id}")
async def update_cart_item(item_id: str, quantity: int, current_user: Dict = Depends(get_current_user)):
    result = await db.cart.update_one(
        {"id": item_id, "user_id": current_user['id']},
        {"$set": {"quantity": quantity}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Cart item not found")
    
    return {"message": "Cart updated"}

@api_router.delete("/cart/{item_id}")
async def remove_from_cart(item_id: str, current_user: Dict = Depends(get_current_user)):
    result = await db.cart.delete_one({"id": item_id, "user_id": current_user['id']})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cart item not found")
    
    return {"message": "Removed from cart"}

@api_router.delete("/cart")
async def clear_cart(current_user: Dict = Depends(get_current_user)):
    await db.cart.delete_many({"user_id": current_user['id']})
    return {"message": "Cart cleared"}

# ==================== Wishlist Routes ====================

@api_router.get("/wishlist")
async def get_wishlist(current_user: Dict = Depends(get_current_user)):
    wishlist_items = await db.wishlist.find({"user_id": current_user['id']}, {"_id": 0}).to_list(100)
    
    # Populate product details
    enriched_items = []
    for item in wishlist_items:
        product = await db.products.find_one({"id": item['product_id']}, {"_id": 0})
        if product:
            if isinstance(item['created_at'], str):
                item['created_at'] = datetime.fromisoformat(item['created_at'])
            if isinstance(product['created_at'], str):
                product['created_at'] = datetime.fromisoformat(product['created_at'])
            enriched_items.append({
                **item,
                "product": product
            })
    
    return enriched_items

@api_router.post("/wishlist/{product_id}")
async def add_to_wishlist(product_id: str, current_user: Dict = Depends(get_current_user)):
    # Check if already in wishlist
    existing = await db.wishlist.find_one({
        "user_id": current_user['id'],
        "product_id": product_id
    })
    
    if existing:
        return {"message": "Already in wishlist", "id": existing['id']}
    
    wishlist_item = WishlistItem(
        user_id=current_user['id'],
        product_id=product_id
    )
    
    wishlist_dict = wishlist_item.model_dump()
    wishlist_dict['created_at'] = wishlist_dict['created_at'].isoformat()
    
    await db.wishlist.insert_one(wishlist_dict)
    return {"message": "Added to wishlist", "id": wishlist_item.id}

@api_router.delete("/wishlist/{product_id}")
async def remove_from_wishlist(product_id: str, current_user: Dict = Depends(get_current_user)):
    result = await db.wishlist.delete_one({
        "user_id": current_user['id'],
        "product_id": product_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found in wishlist")
    
    return {"message": "Removed from wishlist"}

# ==================== Order Routes ====================

@api_router.post("/orders/create")
async def create_order(order_data: OrderCreate, current_user: Dict = Depends(get_current_user)):
    # Generate order number
    order_number = f"ORD{datetime.now().strftime('%Y%m%d')}{str(uuid.uuid4())[:8].upper()}"
    
    # For Razorpay integration (mocked for now)
    razorpay_order_id = None
    if order_data.payment_method == "razorpay":
        # Mock Razorpay order creation
        razorpay_order_id = f"order_mock_{str(uuid.uuid4())[:12]}"
    
    order = Order(
        order_number=order_number,
        user_id=current_user['id'],
        items=order_data.items,
        subtotal=order_data.subtotal,
        tax=order_data.tax,
        shipping=order_data.shipping,
        total=order_data.total,
        payment_method=order_data.payment_method,
        shipping_address=order_data.shipping_address,
        razorpay_order_id=razorpay_order_id
    )
    
    order_dict = order.model_dump()
    order_dict['created_at'] = order_dict['created_at'].isoformat()
    order_dict['updated_at'] = order_dict['updated_at'].isoformat()
    
    await db.orders.insert_one(order_dict)
    
    # Clear cart after order
    await db.cart.delete_many({"user_id": current_user['id']})
    
    return {**order_dict, "razorpay_key_id": RAZORPAY_KEY_ID}

@api_router.post("/orders/{order_id}/payment-success")
async def payment_success(
    order_id: str,
    razorpay_payment_id: str,
    current_user: Dict = Depends(get_current_user)
):
    # Update order with payment info
    await db.orders.update_one(
        {"id": order_id, "user_id": current_user['id']},
        {
            "$set": {
                "payment_status": "completed",
                "razorpay_payment_id": razorpay_payment_id,
                "status": "confirmed",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    return {"message": "Payment successful", "order_id": order_id}

@api_router.get("/orders")
async def get_orders(current_user: Dict = Depends(get_current_user)):
    orders = await db.orders.find(
        {"user_id": current_user['id']},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    for order in orders:
        if isinstance(order['created_at'], str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
        if isinstance(order['updated_at'], str):
            order['updated_at'] = datetime.fromisoformat(order['updated_at'])
    
    return orders

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, current_user: Dict = Depends(get_current_user)):
    order = await db.orders.find_one(
        {"id": order_id, "user_id": current_user['id']},
        {"_id": 0}
    )
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if isinstance(order['created_at'], str):
        order['created_at'] = datetime.fromisoformat(order['created_at'])
    if isinstance(order['updated_at'], str):
        order['updated_at'] = datetime.fromisoformat(order['updated_at'])
    
    return order

# ==================== Admin Order Routes ====================

@api_router.get("/admin/orders")
async def get_all_orders(admin: Dict = Depends(get_current_admin)):
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    for order in orders:
        if isinstance(order['created_at'], str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
        if isinstance(order['updated_at'], str):
            order['updated_at'] = datetime.fromisoformat(order['updated_at'])
    
    return orders

@api_router.put("/admin/orders/{order_id}/status")
async def update_order_status(
    order_id: str,
    status: str,
    admin: Dict = Depends(get_current_admin)
):
    result = await db.orders.update_one(
        {"id": order_id},
        {
            "$set": {
                "status": status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {"message": "Order status updated", "status": status}

# ==================== Review Routes ====================

@api_router.get("/products/{product_id}/reviews")
async def get_product_reviews(product_id: str):
    reviews = await db.reviews.find({"product_id": product_id}, {"_id": 0}).to_list(100)
    
    for review in reviews:
        if isinstance(review['created_at'], str):
            review['created_at'] = datetime.fromisoformat(review['created_at'])
    
    return reviews

@api_router.post("/reviews", response_model=Review)
async def create_review(review_data: ReviewCreate, current_user: Dict = Depends(get_current_user)):
    review = Review(
        product_id=review_data.product_id,
        user_id=current_user['id'],
        rating=review_data.rating,
        comment=review_data.comment,
        user_name=current_user['name']
    )
    
    review_dict = review.model_dump()
    review_dict['created_at'] = review_dict['created_at'].isoformat()
    
    await db.reviews.insert_one(review_dict)
    
    # Update product rating
    all_reviews = await db.reviews.find({"product_id": review_data.product_id}, {"_id": 0}).to_list(1000)
    avg_rating = sum(r['rating'] for r in all_reviews) / len(all_reviews)
    
    await db.products.update_one(
        {"id": review_data.product_id},
        {
            "$set": {
                "rating": round(avg_rating, 1),
                "reviews_count": len(all_reviews)
            }
        }
    )
    
    return review

# ==================== Categories ====================

@api_router.get("/categories")
async def get_categories():
    categories = [
        {"name": "Sarees", "slug": "sarees", "image": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400"},
        {"name": "T-Shirts", "slug": "t-shirts", "image": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400"},
        {"name": "Shirts", "slug": "shirts", "image": "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400"},
        {"name": "Hoodies", "slug": "hoodies", "image": "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400"},
        {"name": "Jewelry", "slug": "jewelry", "image": "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400"},
        {"name": "Ladies Dresses", "slug": "ladies-dresses", "image": "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400"},
        {"name": "Kids Wear", "slug": "kids-wear", "image": "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=400"},
        {"name": "Men's Wear", "slug": "mens-wear", "image": "https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=400"}
    ]
    return categories

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
