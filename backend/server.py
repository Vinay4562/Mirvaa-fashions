from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, Request, File, UploadFile, Body
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
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
from shiprocket import ShiprocketClient

ROOT_DIR = Path(__file__).parent
# Handle .env file loading with error handling
try:
    load_dotenv(ROOT_DIR / '.env', encoding='utf-8')
    print("Successfully loaded .env file")
except Exception as e:
    print(f"Warning: Error loading .env file: {e}")
    # Continue execution even if .env file is missing or has encoding issues

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL')
if not mongo_url:
    raise RuntimeError("MONGO_URL is not set. Please define it in backend/.env")
print("Using MongoDB URL from environment")

try:
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'mirvaa_fashions')]
    print("MongoDB client initialized; will verify connectivity on startup")
except Exception as e:
    print(f"Error initializing MongoDB client: {e}")
    client = None
    db = None

# Razorpay client
RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID')
RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET')

if RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET:
    razorpay_client = razorpay.Client(
        auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)
    )
else:
    print("Warning: Razorpay credentials not provided, using mock client")
    razorpay_client = None

# Initialize Shiprocket client
SHIPROCKET_EMAIL = os.environ.get("SHIPROCKET_EMAIL")
SHIPROCKET_PASSWORD = os.environ.get("SHIPROCKET_PASSWORD")

if SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD:
    try:
        shiprocket_client = ShiprocketClient(
            email=SHIPROCKET_EMAIL,
            password=SHIPROCKET_PASSWORD
        )
    except Exception as e:
        print(f"Warning: Failed to initialize Shiprocket client: {e}")
        shiprocket_client = None
else:
    print("Warning: Shiprocket credentials not provided")
    shiprocket_client = None

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-super-secret-jwt-key-change-this-in-production')
print(f"JWT Secret configured")

JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
JWT_EXPIRATION_DAYS = int(os.environ.get('JWT_EXPIRATION_DAYS', '7'))

# Create the main app
app = FastAPI()

# CORS Configuration
ALLOWED_ORIGINS = os.environ.get('ALLOWED_ORIGINS', 'http://localhost:3000').split(',')
print(f"CORS allowed origins: {ALLOWED_ORIGINS}")

# Add CORS middleware with expanded configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins temporarily for debugging
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["Content-Type", "Authorization"],
)

# Create uploads directory if it doesn't exist
os.makedirs("uploads", exist_ok=True)

# Mount the uploads directory to serve static files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

api_router = APIRouter(prefix="/api")
security = HTTPBearer()
# Health endpoint and startup check
@app.on_event("startup")
async def verify_db_connection_on_startup():
    try:
        if db is None:
            raise RuntimeError("DB is not initialized")
        # motor connects lazily; force a ping to verify credentials/network
        await db.command("ping")
        print("MongoDB connectivity check: OK")
    except Exception as e:
        print(f"MongoDB connectivity check failed: {e}")


@api_router.get("/health")
async def health():
    try:
        if db is None:
            return {"ok": False, "db": "uninitialized"}
        await db.command("ping")
        return {"ok": True, "db": "connected"}
    except Exception as e:
        return {"ok": False, "db": "error", "error": str(e)}


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
    returnable: bool = False
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
    
class ReturnRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    order_id: str
    product_id: str
    reason: str
    status: str = "pending"  # pending, approved, rejected, completed
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
class ReturnRequestCreate(BaseModel):
    order_id: str
    product_id: str
    reason: str

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

# User profile update model
class UserProfileUpdate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    currentPassword: Optional[str] = None
    newPassword: Optional[str] = None

@api_router.put("/users/profile")
async def update_user_profile(profile_data: UserProfileUpdate, current_user: Dict = Depends(get_current_user)):
    # Check if email is being changed and if it's already taken
    if profile_data.email != current_user['email']:
        existing_user = await db.users.find_one({"email": profile_data.email, "id": {"$ne": current_user['id']}})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already in use")
    
    # Prepare update data
    update_data = {
        "name": profile_data.name,
        "email": profile_data.email,
        "phone": profile_data.phone
    }
    
    # Handle password change if provided
    if profile_data.newPassword:
        if not profile_data.currentPassword:
            raise HTTPException(status_code=400, detail="Current password is required to change password")
        
        # Verify current password
        user_doc = await db.users.find_one({"id": current_user['id']})
        if not verify_password(profile_data.currentPassword, user_doc['password']):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        
        # Hash new password
        update_data['password'] = hash_password(profile_data.newPassword)
    
    # Update user in database
    result = await db.users.update_one(
        {"id": current_user['id']},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get updated user data
    updated_user = await db.users.find_one({"id": current_user['id']}, {"_id": 0, "password": 0})
    if isinstance(updated_user['created_at'], str):
        updated_user['created_at'] = datetime.fromisoformat(updated_user['created_at'])
    
    return updated_user

@api_router.put("/users/addresses")
async def update_user_addresses(addresses: List[Dict[str, Any]] = Body(...), current_user: Dict = Depends(get_current_user)):
    result = await db.users.update_one(
        {"id": current_user['id']},
        {"$set": {"addresses": addresses}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    updated_user = await db.users.find_one({"id": current_user['id']}, {"_id": 0})
    if isinstance(updated_user['created_at'], str):
        updated_user['created_at'] = datetime.fromisoformat(updated_user['created_at'])
    
    return {"message": "Addresses updated", "user": updated_user}

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

@api_router.get("/admin/dashboard/stats")
async def get_dashboard_stats(admin: Dict = Depends(get_current_admin)):
    # Get total products count
    products_count = await db.products.count_documents({})
    
    # Get total orders count
    orders_count = await db.orders.count_documents({})
    
    # Get total users count
    users_count = await db.users.count_documents({})
    
    # Calculate total revenue
    pipeline = [
        {"$match": {"status": {"$ne": "cancelled"}}},
        {"$group": {"_id": None, "total_revenue": {"$sum": "$total"}}}
    ]
    revenue_result = await db.orders.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total_revenue"] if revenue_result else 0
    
    return {
        "products_count": products_count,
        "orders_count": orders_count,
        "users_count": users_count,
        "total_revenue": total_revenue
    }

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
        # Convert hyphenated category to proper format (e.g., "men's-wear" to "Men's Wear")
        formatted_category = category.replace('-', ' ').title()
        # Special cases to handle apostrophes and specific formatting
        if formatted_category == "Men S Wear":
            formatted_category = "Men's Wear"
        elif formatted_category == "T Shirts":
            formatted_category = "T-Shirts"
        query['category'] = formatted_category
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
    
    # Ensure images field exists
    if not product.images:
        product.images = []
    
    # If main image exists, add it to images array if not already there
    if hasattr(product_data, 'image') and product_data.image and product_data.image not in product.images:
        product.images.insert(0, product_data.image)
    
    # Set returnable flag if not present
    if not hasattr(product, 'returnable'):
        product.returnable = False
    
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

@api_router.get("/cart/count")
async def get_cart_count(current_user: Dict = Depends(get_current_user)):
    count = await db.cart.count_documents({"user_id": current_user['id']})
    return {"count": count}

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

@api_router.get("/wishlist/count")
async def get_wishlist_count(current_user: Dict = Depends(get_current_user)):
    count = await db.wishlist.count_documents({"user_id": current_user['id']})
    return {"count": count}

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

# ==================== Shipping Routes ====================

@api_router.post("/shipping/create")
async def create_shipping(order_id: str, current_user: Dict = Depends(get_current_user)):
    """Create a shipping order with Shiprocket"""
    try:
        # Get order details
        order = await db.orders.find_one({"id": order_id})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Get user details
        user = await db.users.find_one({"id": order["user_id"]})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get address from order
        address = order["shipping_address"]
        
        # Get order items
        items = order["items"]
        
        # Format order for Shiprocket
        shiprocket_order = shiprocket_client.format_mirvaa_order(order, user, address, items)
        
        # Create order in Shiprocket
        response = shiprocket_client.create_order(shiprocket_order)
        
        # Update order with Shiprocket details
        await db.orders.update_one(
            {"id": order_id},
            {"$set": {
                "shiprocket_order_id": response.get("order_id"),
                "shiprocket_shipment_id": response.get("shipment_id"),
                "shipping_status": "created"
            }}
        )
        
        return {"success": True, "shiprocket_data": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create shipping: {str(e)}")

@api_router.get("/shipping/track/{order_id}")
async def track_shipping(order_id: str, current_user: Dict = Depends(get_current_user)):
    """Track a shipping order"""
    try:
        # Get order details
        order = await db.orders.find_one({"id": order_id})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Check if order has Shiprocket shipment ID
        if "shiprocket_shipment_id" not in order:
            raise HTTPException(status_code=400, detail="Order not shipped yet")
        
        # Track shipment
        tracking_data = shiprocket_client.track_order(order["shiprocket_shipment_id"])
        
        return {"success": True, "tracking_data": tracking_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to track shipping: {str(e)}")

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
    
    result = await db.orders.insert_one(order_dict)
    
    # Clear cart after order
    await db.cart.delete_many({"user_id": current_user['id']})
    
    # Convert ObjectId to string to make it JSON serializable
    response_dict = {**order_dict, "razorpay_key_id": RAZORPAY_KEY_ID}
    response_dict["_id"] = str(result.inserted_id)
    
    return response_dict

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

# ==================== Admin Routes ====================

# Admin audit log
class AuditLogEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    admin_id: str
    action: str
    details: Dict[str, Any] = {}
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

@api_router.post("/admin/audit-log", status_code=201)
async def create_audit_log(
    log_entry: AuditLogEntry,
    admin: dict = Depends(get_current_admin)
):
    """Create an audit log entry for admin actions"""
    log_entry.admin_id = admin["id"]
    await db.audit_logs.insert_one(log_entry.dict())
    return {"status": "success"}

# Store settings model
class StoreSettings(BaseModel):
    store_name: str
    business_address: str
    customer_care_email: EmailStr
    customer_support_phone: str
    return_address: str
    social_facebook: Optional[str] = None
    social_instagram: Optional[str] = None
    social_twitter: Optional[str] = None
    logo_url: Optional[str] = None
    favicon_url: Optional[str] = None
    maintenance_mode: bool = False
    theme: str = "light"

@api_router.get("/settings/store")
async def get_store_settings(admin: dict = Depends(get_current_admin)):
    """Get store settings"""
    settings = await db.settings.find_one({"type": "store"})
    if not settings:
        # Create default settings if not exist
        default_settings = StoreSettings(
            store_name="Mirvaa Fashions",
            business_address="",
            customer_care_email="support@mirvaa.com",
            customer_support_phone="",
            return_address="",
            maintenance_mode=False,
            theme="light"
        )
        await db.settings.insert_one({"type": "store", **default_settings.dict()})
        return default_settings.dict()
    return settings

@api_router.put("/settings/store")
async def update_store_settings(
    settings: StoreSettings,
    admin: dict = Depends(get_current_admin)
):
    """Update store settings"""
    # Create audit log
    await create_audit_log(
        AuditLogEntry(
            action="update_store_settings",
            details={"settings": settings.dict()}
        )
    )
    
    result = await db.settings.update_one(
        {"type": "store"},
        {"$set": settings.dict()},
        upsert=True
    )
    return {"status": "success", "updated": result.modified_count > 0}

# Admin profile model
class AdminProfile(BaseModel):
    name: str
    email: EmailStr
    phone: str
    address: str

@api_router.get("/admin/profile")
async def get_admin_profile(admin: dict = Depends(get_current_admin)):
    """Get admin profile"""
    admin_data = await db.admins.find_one({"_id": ObjectId(admin["id"])})
    if not admin_data:
        raise HTTPException(status_code=404, detail="Admin not found")
    
    return {
        "name": admin_data.get("name", ""),
        "email": admin_data.get("email", ""),
        "phone": admin_data.get("phone", ""),
        "address": admin_data.get("address", "")
    }

@api_router.put("/admin/profile")
async def update_admin_profile(
    profile: AdminProfile,
    admin: dict = Depends(get_current_admin)
):
    """Update admin profile"""
    # Create audit log
    await create_audit_log(
        AuditLogEntry(
            action="update_admin_profile",
            details={"profile": profile.dict()}
        )
    )
    
    result = await db.admins.update_one(
        {"_id": ObjectId(admin["id"])},
        {"$set": profile.dict()}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Admin not found")
    
    return {"status": "success"}

# Password change model
class PasswordChange(BaseModel):
    current_password: str
    new_password: str

@api_router.put("/admin/change-password")
async def change_admin_password(
    password_data: PasswordChange,
    admin: dict = Depends(get_current_admin)
):
    """Change admin password"""
    # Verify current password
    admin_data = await db.admins.find_one({"_id": ObjectId(admin["id"])})
    if not admin_data:
        raise HTTPException(status_code=404, detail="Admin not found")
    
    if not verify_password(password_data.current_password, admin_data["password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Hash new password
    hashed_password = get_password_hash(password_data.new_password)
    
    # Create audit log
    await create_audit_log(
        AuditLogEntry(
            action="change_password",
            details={"admin_id": str(admin_data["_id"])}
        )
    )
    
    # Update password
    await db.admins.update_one(
        {"_id": ObjectId(admin["id"])},
        {"$set": {"password": hashed_password}}
    )
    
    return {"status": "success"}

# Username change model
class UsernameChange(BaseModel):
    current_password: str
    new_username: str

@api_router.put("/admin/change-username")
async def change_admin_username(
    username_data: UsernameChange,
    admin: dict = Depends(get_current_admin)
):
    """Change admin username"""
    # Verify current password
    admin_data = await db.admins.find_one({"_id": ObjectId(admin["id"])})
    if not admin_data:
        raise HTTPException(status_code=404, detail="Admin not found")
    
    if not verify_password(username_data.current_password, admin_data["password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Check if username already exists
    existing = await db.admins.find_one({"username": username_data.new_username})
    if existing and str(existing["_id"]) != admin["id"]:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Create audit log
    await create_audit_log(
        AuditLogEntry(
            action="change_username",
            details={"admin_id": str(admin_data["_id"]), "old_username": admin_data["username"]}
        )
    )
    
    # Update username
    await db.admins.update_one(
        {"_id": ObjectId(admin["id"])},
        {"$set": {"username": username_data.new_username}}
    )
    
    return {"status": "success"}

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
    # Get the order first to check if status is changing to "shipped"
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Update order status
    result = await db.orders.update_one(
        {"id": order_id},
        {
            "$set": {
                "status": status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    # If status is changed to "shipped", update product stock and sold_count
    if status == "shipped" and order["status"] != "shipped":
        for item in order["items"]:
            product_id = item["product_id"]
            quantity = item["quantity"]
            
            # Get current product data
            product = await db.products.find_one({"id": product_id})
            if product:
                # Update product stock and sold_count
                current_sold_count = product.get('sold_count', 0)
                new_sold_count = current_sold_count + quantity
                
                await db.products.update_one(
                    {"id": product_id},
                    {
                        "$inc": {
                            "stock": -quantity  # Decrease available stock
                        },
                        "$set": {
                            "sold_count": new_sold_count  # Set the sold count explicitly
                        }
                    }
                )
                print(f"Stock updated for product {product_id}: new stock = {product['stock'] - quantity}, sold count = {new_sold_count}")
    
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

# ==================== CMS Routes ====================

@api_router.get("/cms/{slug}")
async def get_cms_page(slug: str):
    page = await db.cms_pages.find_one({"slug": slug}, {"_id": 0})
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    if isinstance(page.get('created_at'), str):
        page['created_at'] = datetime.fromisoformat(page['created_at'])
    if isinstance(page.get('updated_at'), str):
        page['updated_at'] = datetime.fromisoformat(page['updated_at'])
    
    return page

@api_router.get("/cms")
async def get_all_cms_pages():
    pages = await db.cms_pages.find({}, {"_id": 0}).to_list(100)
    for page in pages:
        if isinstance(page.get('created_at'), str):
            page['created_at'] = datetime.fromisoformat(page['created_at'])
        if isinstance(page.get('updated_at'), str):
            page['updated_at'] = datetime.fromisoformat(page['updated_at'])
    return pages

@api_router.put("/admin/cms/{slug}")
async def update_cms_page(slug: str, page_data: CMSPageUpdate, admin: Dict = Depends(get_current_admin)):
    existing = await db.cms_pages.find_one({"slug": slug})
    if not existing:
        # Create new page
        new_page = CMSPage(
            slug=slug,
            title=page_data.title,
            content=page_data.content,
            meta_description=page_data.meta_description
        )
        page_dict = new_page.model_dump()
        page_dict['created_at'] = page_dict['created_at'].isoformat()
        page_dict['updated_at'] = page_dict['updated_at'].isoformat()
        await db.cms_pages.insert_one(page_dict)
    else:
        # Update existing
        await db.cms_pages.update_one(
            {"slug": slug},
            {
                "$set": {
                    "title": page_data.title,
                    "content": page_data.content,
                    "meta_description": page_data.meta_description,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
    
    updated_page = await db.cms_pages.find_one({"slug": slug}, {"_id": 0})
    return updated_page

# ==================== File Upload Routes ====================

@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload a file"""
    try:
        contents = await file.read()
        filename = f"{uuid.uuid4()}_{file.filename}"
        file_path = os.path.join("uploads", filename)
        
        # Create uploads directory if it doesn't exist
        os.makedirs("uploads", exist_ok=True)
        
        with open(file_path, "wb") as f:
            f.write(contents)
        
        return {"filename": filename, "path": f"/uploads/{filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/upload-multiple")
async def upload_multiple_files(files: List[UploadFile] = File(...)):
    """Upload multiple files"""
    try:
        uploaded_files = []
        
        # Create uploads directory if it doesn't exist
        os.makedirs("uploads", exist_ok=True)
        
        for file in files:
            contents = await file.read()
            filename = f"{uuid.uuid4()}_{file.filename}"
            file_path = os.path.join("uploads", filename)
            
            with open(file_path, "wb") as f:
                f.write(contents)
            
            uploaded_files.append({
                "filename": filename,
                "path": f"/uploads/{filename}"
            })
        
        return {"files": uploaded_files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== Admin Settings Routes ====================

async def create_audit_log(admin_id: str, admin_username: str, action: str, details: str, ip_address: Optional[str] = None):
    log = AuditLog(
        admin_id=admin_id,
        admin_username=admin_username,
        action=action,
        details=details,
        ip_address=ip_address
    )
    log_dict = log.model_dump()
    log_dict['created_at'] = log_dict['created_at'].isoformat()
    await db.audit_logs.insert_one(log_dict)

@api_router.get("/admin/profile")
async def get_admin_profile(admin: Dict = Depends(get_current_admin)):
    return {
        "id": admin['id'],
        "username": admin['username'],
        "name": admin.get('name', ''),
        "email": admin.get('email', ''),
        "phone": admin.get('phone', ''),
        "address": admin.get('address', ''),
        "role": admin['role']
    }

@api_router.put("/admin/profile")
async def update_admin_profile(profile_data: AdminProfile, admin: Dict = Depends(get_current_admin)):
    await db.admins.update_one(
        {"id": admin['id']},
        {
            "$set": {
                "name": profile_data.name,
                "email": profile_data.email,
                "phone": profile_data.phone,
                "address": profile_data.address
            }
        }
    )
    
    await create_audit_log(admin['id'], admin['username'], "profile_update", "Admin profile updated")
    
    return {"message": "Profile updated successfully"}

@api_router.post("/admin/change-password")
async def change_admin_password(
    password_data: AdminPasswordChange,
    admin: Dict = Depends(get_current_admin),
    request: Request = None
):
    # Verify current password
    admin_doc = await db.admins.find_one({"id": admin['id']})
    if not verify_password(password_data.current_password, admin_doc['password']):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Validate new password
    if password_data.new_password != password_data.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    
    if len(password_data.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
    
    # Update password
    new_hashed = hash_password(password_data.new_password)
    await db.admins.update_one(
        {"id": admin['id']},
        {"$set": {"password": new_hashed}}
    )
    
    # Create audit log
    ip_address = request.client.host if request else None
    await create_audit_log(admin['id'], admin['username'], "password_change", "Admin password changed", ip_address)
    
    return {"message": "Password changed successfully"}

@api_router.post("/admin/change-username")
async def change_admin_username(
    username_data: AdminUsernameChange,
    admin: Dict = Depends(get_current_admin),
    request: Request = None
):
    # Verify current password
    admin_doc = await db.admins.find_one({"id": admin['id']})
    if not verify_password(username_data.current_password, admin_doc['password']):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Check if new username already exists
    existing = await db.admins.find_one({"username": username_data.new_username})
    if existing and existing['id'] != admin['id']:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    old_username = admin['username']
    
    # Update username
    await db.admins.update_one(
        {"id": admin['id']},
        {"$set": {"username": username_data.new_username}}
    )
    
    # Create audit log
    ip_address = request.client.host if request else None
    await create_audit_log(
        admin['id'],
        username_data.new_username,
        "username_change",
        f"Username changed from {old_username} to {username_data.new_username}",
        ip_address
    )
    
    # Generate new token
    token = create_token(admin['id'], username_data.new_username)
    
    return {
        "message": "Username changed successfully",
        "token": token,
        "username": username_data.new_username
    }

# ==================== Store Settings Routes ====================

@api_router.get("/settings/store")
async def get_store_settings():
    settings = await db.store_settings.find_one({}, {"_id": 0})
    
    if not settings:
        # Create default settings
        default_settings = StoreSettings()
        settings_dict = default_settings.model_dump()
        settings_dict['updated_at'] = settings_dict['updated_at'].isoformat()
        await db.store_settings.insert_one(settings_dict)
        return default_settings.model_dump()
    
    if isinstance(settings.get('updated_at'), str):
        settings['updated_at'] = datetime.fromisoformat(settings['updated_at'])
    
    return settings

@api_router.put("/admin/settings/store")
async def update_store_settings(
    settings_data: StoreSettingsUpdate,
    admin: Dict = Depends(get_current_admin)
):
    update_dict = {k: v for k, v in settings_data.model_dump().items() if v is not None}
    update_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.store_settings.update_one(
        {},
        {"$set": update_dict},
        upsert=True
    )
    
    await create_audit_log(admin['id'], admin['username'], "store_settings_update", "Store settings updated")
    
    updated_settings = await db.store_settings.find_one({}, {"_id": 0})
    return updated_settings

@api_router.get("/admin/audit-logs")
async def get_audit_logs(admin: Dict = Depends(get_current_admin), limit: int = 50):
    logs = await db.audit_logs.find({}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    
    for log in logs:
        if isinstance(log.get('created_at'), str):
            log['created_at'] = datetime.fromisoformat(log['created_at'])
    
    return logs

# ==================== Admin Orders Management ====================

@api_router.get("/admin/orders")
async def get_admin_orders(
    page: int = 1,
    limit: int = 50,
    status: Optional[str] = None,
    user_id: Optional[str] = None,
    admin: Dict = Depends(get_current_admin)
):
    """Get all orders for admin management"""
    try:
        # Build filter
        filter_dict = {}
        if status:
            filter_dict["status"] = status
        if user_id:
            filter_dict["user_id"] = user_id

        # Calculate skip
        skip = (page - 1) * limit

        # Get orders with pagination
        orders = await db.orders.find(filter_dict).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        
        # Get total count
        total = await db.orders.count_documents(filter_dict)

        return {
            "orders": orders,
            "total": total,
            "page": page,
            "limit": limit,
            "pages": (total + limit - 1) // limit
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching orders: {str(e)}")

# ==================== Admin Analytics Routes ====================

@api_router.get("/admin/analytics/overview")
async def get_analytics_overview(
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    admin: Dict = Depends(get_current_admin)
):
    """Get overview analytics data"""
    try:
        # Parse dates
        from_dt = datetime.fromisoformat(from_date) if from_date else datetime.now(timezone.utc) - timedelta(days=30)
        to_dt = datetime.fromisoformat(to_date) if to_date else datetime.now(timezone.utc)
        
        # Get basic counts
        total_products = await db.products.count_documents({})
        total_orders = await db.orders.count_documents({
            "created_at": {"$gte": from_dt.isoformat(), "$lte": to_dt.isoformat()}
        })
        total_users = await db.users.count_documents({})
        
        # Calculate revenue
        revenue_pipeline = [
            {"$match": {
                "created_at": {"$gte": from_dt.isoformat(), "$lte": to_dt.isoformat()},
                "status": {"$ne": "cancelled"}
            }},
            {"$group": {"_id": None, "total_revenue": {"$sum": "$total"}}}
        ]
        revenue_result = await db.orders.aggregate(revenue_pipeline).to_list(1)
        total_revenue = revenue_result[0]["total_revenue"] if revenue_result else 0
        
        # Recent orders (last 7 days)
        recent_orders = await db.orders.count_documents({
            "created_at": {"$gte": (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()}
        })
        
        # Calculate conversion rate (simplified)
        conversion_rate = (total_orders / max(total_users, 1)) * 100 if total_users > 0 else 0
        
        return {
            "totalProducts": total_products,
            "totalOrders": total_orders,
            "totalUsers": total_users,
            "totalRevenue": total_revenue,
            "recentOrders": recent_orders,
            "conversionRate": round(conversion_rate, 2)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching overview data: {str(e)}")

@api_router.get("/admin/analytics/products")
async def get_products_analytics(
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    admin: Dict = Depends(get_current_admin)
):
    """Get products analytics data"""
    try:
        from_dt = datetime.fromisoformat(from_date.replace('Z', '+00:00')) if from_date else datetime.now(timezone.utc) - timedelta(days=30)
        to_dt = datetime.fromisoformat(to_date.replace('Z', '+00:00')) if to_date else datetime.now(timezone.utc)
        
        # Performance metrics
        total_products = await db.products.count_documents({})
        featured_products = await db.products.count_documents({"is_featured": True})
        low_stock_count = await db.products.count_documents({"stock": {"$lt": 10}})
        
        # Average rating - simplified
        try:
            # Simple approach to avoid aggregation errors
            products_with_rating = await db.products.find({"rating": {"$exists": True}}).to_list(1000)
            if products_with_rating:
                total_rating = sum(p.get("rating", 0) for p in products_with_rating)
                average_rating = round(total_rating / len(products_with_rating), 1)
            else:
                average_rating = 0
        except Exception as e:
            print(f"Error calculating average rating: {str(e)}")
            average_rating = 0
        
        # Top selling products - Simplified approach
        try:
            # Get basic sales data first
            basic_pipeline = [
                {"$unwind": "$items"},
                {"$match": {
                    "$or": [
                        {"created_at": {"$gte": from_dt.isoformat(), "$lte": to_dt.isoformat()}},
                        {"created_at": {"$exists": False}}  # Include orders without dates
                    ],
                    "$or": [
                        {"status": {"$ne": "cancelled"}},
                        {"status": {"$exists": False}}  # Include orders without status
                    ]
                }},
                {"$group": {
                    "_id": "$items.product_id",
                    "quantitySold": {"$sum": "$items.quantity"},
                    "totalRevenue": {"$sum": {"$multiply": [{"$ifNull": ["$items.price", 0]}, {"$ifNull": ["$items.quantity", 0]}]}}
                }},
                {"$sort": {"quantitySold": -1}},
                {"$limit": 10}
            ]
            
            sales_data = await db.orders.aggregate(basic_pipeline).to_list(10)
            
            # Get product details separately
            top_selling = []
            for item in sales_data:
                if not item["_id"]:
                    continue
                    
                try:
                    product = await db.products.find_one({"id": item["_id"]})
                    if product:
                        top_selling.append({
                            "id": item["_id"],
                            "title": product.get("title", "Unknown Product"),
                            "images": product.get("images", [""])[0] if product.get("images") and len(product.get("images")) > 0 else "",
                            "quantitySold": item["quantitySold"],
                            "totalRevenue": item["totalRevenue"]
                        })
                except Exception as e:
                    print(f"Error getting product {item['_id']}: {str(e)}")
            
            # If no products found, return empty list
            if not top_selling:
                top_selling = []
                
        except Exception as e:
            print(f"Error in top selling pipeline: {str(e)}")
            top_selling = []
        
        # Low stock products
        low_stock = await db.products.find(
            {"stock": {"$lt": 10}},
            {"_id": 0, "id": 1, "title": 1, "images": 1, "stock": 1}
        ).to_list(20)
        
        # Add max stock for low stock items (assuming 50 as default max)
        for item in low_stock:
            item["maxStock"] = 50
        
        # Category statistics - Simplified to avoid complex aggregation issues
        category_pipeline = [
            {"$group": {
                "_id": "$category",
                "productCount": {"$sum": 1},
                "averagePrice": {"$avg": "$price"}
            }},
            {"$project": {
                "name": {"$ifNull": ["$_id", "Uncategorized"]},
                "productCount": 1,
                "averagePrice": {"$round": [{"$ifNull": ["$averagePrice", 0]}, 2]},
                "revenue": 0,  
                "topSeller": "N/A"
            }},
            {"$sort": {"productCount": -1}}
        ]
        
        try:
            category_stats = await db.products.aggregate(category_pipeline).to_list(20)
        except Exception as e:
            print(f"Error in category statistics pipeline: {str(e)}")
            category_stats = []
        
        # Price distribution
        price_ranges = [
            {"range": "Under ₹500", "min": 0, "max": 500},
            {"range": "₹500 - ₹1000", "min": 500, "max": 1000},
            {"range": "₹1000 - ₹2000", "min": 1000, "max": 2000},
            {"range": "₹2000 - ₹5000", "min": 2000, "max": 5000},
            {"range": "Above ₹5000", "min": 5000, "max": float('inf')}
        ]
        
        price_distribution = []
        total_products_for_dist = await db.products.count_documents({})
        
        for range_def in price_ranges:
            if range_def["max"] == float('inf'):
                count = await db.products.count_documents({"price": {"$gte": range_def["min"]}})
            else:
                count = await db.products.count_documents({
                    "price": {"$gte": range_def["min"], "$lt": range_def["max"]}
                })
            
            percentage = (count / max(total_products_for_dist, 1)) * 100
            price_distribution.append({
                "range": range_def["range"],
                "count": count,
                "percentage": round(percentage, 1)
            })
        
        return {
            "topSelling": top_selling,
            "lowStock": low_stock,
            "categoryStats": category_stats,
            "priceDistribution": price_distribution,
            "performanceMetrics": {
                "totalProducts": total_products,
                "featuredProducts": featured_products,
                "lowStockCount": low_stock_count,
                "averageRating": average_rating
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching products analytics: {str(e)}")

@api_router.get("/admin/analytics/orders")
async def get_orders_analytics(
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    admin: Dict = Depends(get_current_admin)
):
    """Get orders analytics data"""
    try:
        from_dt = datetime.fromisoformat(from_date) if from_date else datetime.now(timezone.utc) - timedelta(days=30)
        to_dt = datetime.fromisoformat(to_date) if to_date else datetime.now(timezone.utc)
        
        # Performance metrics
        total_orders = await db.orders.count_documents({
            "created_at": {"$gte": from_dt.isoformat(), "$lte": to_dt.isoformat()}
        })
        
        # Get shipped and delivered orders
        shipped_orders = await db.orders.count_documents({
            "created_at": {"$gte": from_dt.isoformat(), "$lte": to_dt.isoformat()},
            "status": "shipped"
        })
        
        completed_orders = await db.orders.count_documents({
            "created_at": {"$gte": from_dt.isoformat(), "$lte": to_dt.isoformat()},
            "status": "delivered"
        })
        
        # Average order value
        avg_order_pipeline = [
            {"$match": {
                "created_at": {"$gte": from_dt.isoformat(), "$lte": to_dt.isoformat()},
                "status": {"$ne": "cancelled"}
            }},
            {"$group": {"_id": None, "avg_value": {"$avg": "$total"}}}
        ]
        avg_result = await db.orders.aggregate(avg_order_pipeline).to_list(1)
        average_order_value = avg_result[0]["avg_value"] if avg_result else 0
        
        # Cancellation rate
        cancelled_orders = await db.orders.count_documents({
            "created_at": {"$gte": from_dt.isoformat(), "$lte": to_dt.isoformat()},
            "status": "cancelled"
        })
        cancellation_rate = (cancelled_orders / max(total_orders, 1)) * 100
        
        # Status distribution
        status_pipeline = [
            {"$match": {
                "created_at": {"$gte": from_dt.isoformat(), "$lte": to_dt.isoformat()}
            }},
            {"$group": {"_id": "$status", "count": {"$sum": 1}}},
            {"$project": {
                "status": "$_id",
                "count": 1,
                "percentage": {"$multiply": [{"$divide": ["$count", total_orders]}, 100]}
            }},
            {"$sort": {"count": -1}}
        ]
        status_distribution = await db.orders.aggregate(status_pipeline).to_list(10)
        
        # Payment method statistics
        payment_pipeline = [
            {"$match": {
                "created_at": {"$gte": from_dt.isoformat(), "$lte": to_dt.isoformat()}
            }},
            {"$group": {"_id": "$payment_method", "count": {"$sum": 1}}},
            {"$project": {
                "method": "$_id",
                "count": 1,
                "percentage": {"$multiply": [{"$divide": ["$count", total_orders]}, 100]}
            }},
            {"$sort": {"count": -1}}
        ]
        payment_method_stats = await db.orders.aggregate(payment_pipeline).to_list(10)
        
        # Recent orders with customer details
        recent_orders = await db.orders.find(
            {"created_at": {"$gte": from_dt.isoformat(), "$lte": to_dt.isoformat()}},
            {"_id": 0}
        ).sort("created_at", -1).limit(20).to_list(20)
        
        # Add customer details to recent orders
        for order in recent_orders:
            user = await db.users.find_one({"id": order["user_id"]}, {"_id": 0})
            if user:
                order["customer_name"] = user.get("name", "Unknown")
                order["customer_email"] = user.get("email", "Unknown")
        
        # Order trends (daily)
        trend_pipeline = [
            {"$match": {
                "created_at": {"$gte": from_dt.isoformat(), "$lte": to_dt.isoformat()},
                "status": {"$ne": "cancelled"}
            }},
            {"$group": {
                "_id": {
                    "year": {"$year": {"$dateFromString": {"dateString": "$created_at"}}},
                    "month": {"$month": {"$dateFromString": {"dateString": "$created_at"}}},
                    "day": {"$dayOfMonth": {"$dateFromString": {"dateString": "$created_at"}}}
                },
                "orders": {"$sum": 1},
                "revenue": {"$sum": "$total"}
            }},
            {"$project": {
                "period": {
                    "$dateFromParts": {
                        "year": "$_id.year",
                        "month": "$_id.month",
                        "day": "$_id.day"
                    }
                },
                "orders": 1,
                "revenue": 1
            }},
            {"$sort": {"period": -1}},
            {"$limit": 7}
        ]
        order_trends = await db.orders.aggregate(trend_pipeline).to_list(7)
        
        # Format trends data
        for trend in order_trends:
            trend["period"] = trend["period"].strftime("%Y-%m-%d")
            trend["growth"] = 0  # Simplified - would need previous period data
        
        # Get sold stock information
        sold_stock_pipeline = [
            {"$match": {
                "status": {"$in": ["shipped", "delivered"]}
            }},
            {"$unwind": "$items"},
            {"$group": {
                "_id": "$items.product_id",
                "sold_quantity": {"$sum": "$items.quantity"}
            }},
            {"$lookup": {
                "from": "products",
                "localField": "_id",
                "foreignField": "id",
                "as": "product"
            }},
            {"$unwind": "$product"},
            {"$project": {
                "product_id": "$_id",
                "product_title": "$product.title",
                "product_category": "$product.category",
                "sold_quantity": 1,
                "current_stock": "$product.stock"
            }}
        ]
        sold_stock_data = await db.orders.aggregate(sold_stock_pipeline).to_list(100)
        
        return {
            "recentOrders": recent_orders,
            "statusDistribution": status_distribution,
            "paymentMethodStats": payment_method_stats,
            "orderTrends": order_trends,
            "soldStockData": sold_stock_data,
            "performanceMetrics": {
                "totalOrders": total_orders,
                "shippedOrders": shipped_orders,
                "completedOrders": completed_orders,
                "averageOrderValue": round(average_order_value, 2),
                "cancellationRate": round(cancellation_rate, 2)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching orders analytics: {str(e)}")

@api_router.get("/admin/analytics/users")
async def get_users_analytics(
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    admin: Dict = Depends(get_current_admin)
):
    """Get users analytics data"""
    try:
        from_dt = datetime.fromisoformat(from_date) if from_date else datetime.now(timezone.utc) - timedelta(days=30)
        to_dt = datetime.fromisoformat(to_date) if to_date else datetime.now(timezone.utc)
        
        # Performance metrics
        total_users = await db.users.count_documents({})
        
        new_users = await db.users.count_documents({
            "created_at": {"$gte": from_dt.isoformat(), "$lte": to_dt.isoformat()}
        })
        
        # Active users (users who made purchases in the period)
        active_users = await db.orders.distinct("user_id", {
            "created_at": {"$gte": from_dt.isoformat(), "$lte": to_dt.isoformat()},
            "status": {"$ne": "cancelled"}
        })
        active_users_count = len(active_users)
        
        # Average order value per customer
        avg_order_pipeline = [
            {"$match": {
                "created_at": {"$gte": from_dt.isoformat(), "$lte": to_dt.isoformat()},
                "status": {"$ne": "cancelled"}
            }},
            {"$group": {"_id": None, "avg_value": {"$avg": "$total"}}}
        ]
        avg_result = await db.orders.aggregate(avg_order_pipeline).to_list(1)
        average_order_value = avg_result[0]["avg_value"] if avg_result else 0
        
        # Recent users
        recent_users = await db.users.find(
            {},
            {"_id": 0, "id": 1, "name": 1, "email": 1, "phone": 1, "created_at": 1}
        ).sort("created_at", -1).limit(20).to_list(20)
        
        # Add order statistics to recent users
        for user in recent_users:
            user_orders = await db.orders.find(
                {"user_id": user["id"], "status": {"$ne": "cancelled"}},
                {"_id": 0, "total": 1, "created_at": 1}
            ).to_list(1000)
            
            user["orderCount"] = len(user_orders)
            user["totalSpent"] = sum(order["total"] for order in user_orders)
            user["lastOrderDate"] = max([order["created_at"] for order in user_orders]) if user_orders else None
        
        # User segments based on spending
        user_segments = [
            {"segment": "VIP (₹50k+)", "count": 0, "percentage": 0},
            {"segment": "Gold (₹25k-50k)", "count": 0, "percentage": 0},
            {"segment": "Silver (₹10k-25k)", "count": 0, "percentage": 0},
            {"segment": "Bronze (Under ₹10k)", "count": 0, "percentage": 0}
        ]
        
        # Calculate user segments
        for user in recent_users:
            total_spent = user.get("totalSpent", 0)
            if total_spent >= 50000:
                user_segments[0]["count"] += 1
            elif total_spent >= 25000:
                user_segments[1]["count"] += 1
            elif total_spent >= 10000:
                user_segments[2]["count"] += 1
            else:
                user_segments[3]["count"] += 1
        
        # Calculate percentages
        for segment in user_segments:
            segment["percentage"] = round((segment["count"] / max(total_users, 1)) * 100, 1)
        
        # User activity
        user_activity = [
            {"type": "registered", "count": new_users},
            {"type": "made purchase", "count": active_users_count},
            {"type": "multiple orders", "count": len([u for u in recent_users if u.get("orderCount", 0) > 1])}
        ]
        
        # Registration trends (simplified)
        registration_trends = [
            {"period": "This Month", "newUsers": new_users, "growth": 0},
            {"period": "Last Month", "newUsers": 0, "growth": 0}  # Simplified
        ]
        
        # Top customers
        top_customers = sorted(recent_users, key=lambda x: x.get("totalSpent", 0), reverse=True)[:10]
        
        return {
            "recentUsers": recent_users,
            "userSegments": user_segments,
            "registrationTrends": registration_trends,
            "userActivity": user_activity,
            "topCustomers": top_customers,
            "performanceMetrics": {
                "totalUsers": total_users,
                "newUsers": new_users,
                "activeUsers": active_users_count,
                "averageOrderValue": round(average_order_value, 2)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching users analytics: {str(e)}")

@api_router.get("/admin/analytics/revenue")
async def get_revenue_analytics(
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    admin: Dict = Depends(get_current_admin)
):
    """Get revenue analytics data"""
    try:
        from_dt = datetime.fromisoformat(from_date) if from_date else datetime.now(timezone.utc) - timedelta(days=30)
        to_dt = datetime.fromisoformat(to_date) if to_date else datetime.now(timezone.utc)
        
        # Performance metrics
        total_revenue_pipeline = [
            {"$match": {
                "created_at": {"$gte": from_dt.isoformat(), "$lte": to_dt.isoformat()},
                "status": {"$ne": "cancelled"}
            }},
            {"$group": {"_id": None, "total_revenue": {"$sum": "$total"}}}
        ]
        total_revenue_result = await db.orders.aggregate(total_revenue_pipeline).to_list(1)
        total_revenue = total_revenue_result[0]["total_revenue"] if total_revenue_result else 0
        
        # Calculate days in period
        days_in_period = (to_dt - from_dt).days + 1
        average_daily_revenue = total_revenue / max(days_in_period, 1)
        
        # Revenue growth (simplified - would need previous period data)
        revenue_growth = 0  # Placeholder
        
        # Best day revenue
        best_day_pipeline = [
            {"$match": {
                "created_at": {"$gte": from_dt.isoformat(), "$lte": to_dt.isoformat()},
                "status": {"$ne": "cancelled"}
            }},
            {"$group": {
                "_id": {
                    "year": {"$year": {"$dateFromString": {"dateString": "$created_at"}}},
                    "month": {"$month": {"$dateFromString": {"dateString": "$created_at"}}},
                    "day": {"$dayOfMonth": {"$dateFromString": {"dateString": "$created_at"}}}
                },
                "daily_revenue": {"$sum": "$total"}
            }},
            {"$sort": {"daily_revenue": -1}},
            {"$limit": 1}
        ]
        best_day_result = await db.orders.aggregate(best_day_pipeline).to_list(1)
        best_day_revenue = best_day_result[0]["daily_revenue"] if best_day_result else 0
        
        # Daily revenue trend
        daily_revenue_pipeline = [
            {"$match": {
                "created_at": {"$gte": from_dt.isoformat(), "$lte": to_dt.isoformat()},
                "status": {"$ne": "cancelled"}
            }},
            {"$group": {
                "_id": {
                    "year": {"$year": {"$dateFromString": {"dateString": "$created_at"}}},
                    "month": {"$month": {"$dateFromString": {"dateString": "$created_at"}}},
                    "day": {"$dayOfMonth": {"$dateFromString": {"dateString": "$created_at"}}}
                },
                "revenue": {"$sum": "$total"}
            }},
            {"$project": {
                "date": {
                    "$dateFromParts": {
                        "year": "$_id.year",
                        "month": "$_id.month",
                        "day": "$_id.day"
                    }
                },
                "revenue": 1
            }},
            {"$sort": {"date": -1}},
            {"$limit": 30}
        ]
        daily_revenue = await db.orders.aggregate(daily_revenue_pipeline).to_list(30)
        
        # Format daily revenue data
        for day in daily_revenue:
            day["date"] = day["date"].strftime("%Y-%m-%d")
        
        # Payment method revenue
        payment_revenue_pipeline = [
            {"$match": {
                "created_at": {"$gte": from_dt.isoformat(), "$lte": to_dt.isoformat()},
                "status": {"$ne": "cancelled"}
            }},
            {"$group": {
                "_id": "$payment_method",
                "revenue": {"$sum": "$total"},
                "count": {"$sum": 1}
            }},
            {"$project": {
                "method": "$_id",
                "revenue": 1,
                "count": 1,
                "percentage": {"$multiply": [{"$divide": ["$revenue", total_revenue]}, 100]}
            }},
            {"$sort": {"revenue": -1}}
        ]
        payment_method_revenue = await db.orders.aggregate(payment_revenue_pipeline).to_list(10)
        
        # Category revenue
        category_revenue_pipeline = [
            {"$unwind": "$items"},
            {"$match": {
                "created_at": {"$gte": from_dt.isoformat(), "$lte": to_dt.isoformat()},
                "status": {"$ne": "cancelled"}
            }},
            {"$lookup": {
                "from": "products",
                "localField": "items.product_id",
                "foreignField": "id",
                "as": "product"
            }},
            {"$unwind": "$product"},
            {"$group": {
                "_id": "$product.category",
                "revenue": {"$sum": {"$multiply": ["$items.price", "$items.quantity"]}},
                "orderCount": {"$sum": 1}
            }},
            {"$project": {
                "name": "$_id",
                "revenue": 1,
                "orderCount": 1,
                "averageOrderValue": {"$divide": ["$revenue", "$orderCount"]},
                "growth": 0  # Placeholder
            }},
            {"$sort": {"revenue": -1}}
        ]
        category_revenue = await db.orders.aggregate(category_revenue_pipeline).to_list(20)
        
        # Monthly revenue comparison (simplified)
        monthly_revenue = [
            {"month": "Current Month", "revenue": total_revenue, "orders": 0, "growth": 0},
            {"month": "Previous Month", "revenue": 0, "orders": 0, "growth": 0}  # Placeholder
        ]
        
        # Revenue forecast (simplified)
        forecast = {
            "nextWeek": total_revenue * 0.25,  # Simplified calculation
            "nextMonth": total_revenue * 1.1,  # 10% growth assumption
            "nextQuarter": total_revenue * 3.3  # 3 months with 10% growth
        }
        
        return {
            "dailyRevenue": daily_revenue,
            "monthlyRevenue": monthly_revenue,
            "categoryRevenue": category_revenue,
            "paymentMethodRevenue": payment_method_revenue,
            "forecast": forecast,
            "performanceMetrics": {
                "totalRevenue": total_revenue,
                "averageDailyRevenue": round(average_daily_revenue, 2),
                "revenueGrowth": revenue_growth,
                "bestDayRevenue": best_day_revenue
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching revenue analytics: {str(e)}")

@api_router.get("/admin/analytics/export/{data_type}")
async def export_analytics_data(
    data_type: str,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    admin: Dict = Depends(get_current_admin)
):
    """Export analytics data as CSV"""
    try:
        from_dt = datetime.fromisoformat(from_date) if from_date else datetime.now(timezone.utc) - timedelta(days=30)
        to_dt = datetime.fromisoformat(to_date) if to_date else datetime.now(timezone.utc)
        
        if data_type == "products":
            # Export products data
            products = await db.products.find({}, {"_id": 0}).to_list(1000)
            csv_data = "ID,Title,Category,Price,Stock,Rating,Reviews Count,Featured\n"
            for product in products:
                csv_data += f"{product['id']},{product['title']},{product['category']},{product['price']},{product['stock']},{product['rating']},{product['reviews_count']},{product['is_featured']}\n"
        
        elif data_type == "orders":
            # Export orders data
            orders = await db.orders.find(
                {"created_at": {"$gte": from_dt.isoformat(), "$lte": to_dt.isoformat()}},
                {"_id": 0}
            ).to_list(1000)
            csv_data = "Order Number,Customer ID,Status,Payment Method,Total,Date\n"
            for order in orders:
                csv_data += f"{order['order_number']},{order['user_id']},{order['status']},{order['payment_method']},{order['total']},{order['created_at']}\n"
        
        elif data_type == "users":
            # Export users data
            users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
            csv_data = "ID,Name,Email,Phone,Registration Date\n"
            for user in users:
                csv_data += f"{user['id']},{user['name']},{user['email']},{user.get('phone', '')},{user['created_at']}\n"
        
        elif data_type == "revenue":
            # Export revenue data
            revenue_pipeline = [
                {"$match": {
                    "created_at": {"$gte": from_dt.isoformat(), "$lte": to_dt.isoformat()},
                    "status": {"$ne": "cancelled"}
                }},
                {"$group": {
                    "_id": {
                        "year": {"$year": {"$dateFromString": {"dateString": "$created_at"}}},
                        "month": {"$month": {"$dateFromString": {"dateString": "$created_at"}}},
                        "day": {"$dayOfMonth": {"$dateFromString": {"dateString": "$created_at"}}}
                    },
                    "revenue": {"$sum": "$total"},
                    "orders": {"$sum": 1}
                }},
                {"$project": {
                    "date": {
                        "$dateFromParts": {
                            "year": "$_id.year",
                            "month": "$_id.month",
                            "day": "$_id.day"
                        }
                    },
                    "revenue": 1,
                    "orders": 1
                }},
                {"$sort": {"date": 1}}
            ]
            revenue_data = await db.orders.aggregate(revenue_pipeline).to_list(1000)
            csv_data = "Date,Revenue,Orders\n"
            for data in revenue_data:
                date_str = data["date"].strftime("%Y-%m-%d")
                csv_data += f"{date_str},{data['revenue']},{data['orders']}\n"
        
        else:
            raise HTTPException(status_code=400, detail="Invalid data type")
        
        # Return CSV data
        from fastapi.responses import Response
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={data_type}-analytics.csv"}
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting data: {str(e)}")

# ==================== Return Request Routes ====================

@api_router.post("/returns")
async def create_return_request(
    return_data: ReturnRequestCreate,
    user: Dict = Depends(get_current_user)
):
    # Check if order exists and belongs to user
    order = await db.orders.find_one({"id": return_data.order_id, "user_id": user["id"]})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check if product exists in order
    product_in_order = False
    product_returnable = False
    for item in order["items"]:
        if item["product_id"] == return_data.product_id:
            product_in_order = True
            if "product" in item and "returnable" in item["product"]:
                product_returnable = item["product"]["returnable"]
            break
    
    if not product_in_order:
        raise HTTPException(status_code=400, detail="Product not found in order")
    
    if not product_returnable:
        raise HTTPException(status_code=400, detail="This product is not eligible for return")
    
    # Check if return is within 3-day window
    order_date = order["created_at"]
    if isinstance(order_date, str):
        order_date = datetime.fromisoformat(order_date)
    
    current_date = datetime.now(timezone.utc)
    days_difference = (current_date - order_date).days
    
    if days_difference > 3:
        raise HTTPException(status_code=400, detail="Return window of 3 days has expired")
    
    # Check if return request already exists
    existing_return = await db.return_requests.find_one({
        "user_id": user["id"],
        "order_id": return_data.order_id,
        "product_id": return_data.product_id
    })
    
    if existing_return:
        raise HTTPException(status_code=400, detail="Return request already exists for this product")
    
    # Create return request
    return_request = ReturnRequest(
        user_id=user["id"],
        order_id=return_data.order_id,
        product_id=return_data.product_id,
        reason=return_data.reason
    )
    
    return_dict = return_request.model_dump()
    await db.return_requests.insert_one(return_dict)
    
    return {"message": "Return request created successfully", "return_id": return_request.id}

@api_router.get("/returns")
async def get_user_return_requests(user: Dict = Depends(get_current_user)):
    return_requests = await db.return_requests.find({"user_id": user["id"]}).to_list(100)
    
    # Format dates
    for request in return_requests:
        if "_id" in request:
            del request["_id"]
        if isinstance(request.get("created_at"), str):
            request["created_at"] = datetime.fromisoformat(request["created_at"])
    
    return return_requests

@api_router.get("/admin/returns")
async def get_all_return_requests(admin: Dict = Depends(get_current_admin)):
    return_requests = await db.return_requests.find({}).to_list(100)
    
    # Format dates and remove _id
    for request in return_requests:
        if "_id" in request:
            del request["_id"]
        if isinstance(request.get("created_at"), str):
            request["created_at"] = datetime.fromisoformat(request["created_at"])
    
    return return_requests

@api_router.put("/admin/returns/{return_id}")
async def update_return_status(
    return_id: str,
    status: str,
    admin: Dict = Depends(get_current_admin)
):
    if status not in ["pending", "approved", "rejected", "completed"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    result = await db.return_requests.update_one(
        {"id": return_id},
        {"$set": {"status": status}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Return request not found")
    
    return {"message": f"Return request status updated to {status}"}

# Include router
app.include_router(api_router)

# Note: CORS middleware is already added above

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Add this at the end to run the server
if __name__ == "__main__":
    import uvicorn
    host = os.environ.get('HOST', '0.0.0.0')
    port = int(os.environ.get('PORT', '8000'))
    debug = os.environ.get('DEBUG', 'False').lower() == 'true'
    uvicorn.run("server:app", host=host, port=port, reload=debug)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
