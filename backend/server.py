from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, Request, File, UploadFile, Body, BackgroundTasks, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import json
import bcrypt
from jose import jwt as jose_jwt
from jose.exceptions import ExpiredSignatureError, JWTError
import razorpay
from delhivery import DelhiveryClient
import hmac
import hashlib
import requests
import asyncio
import smtplib
import socket
import ssl
import time
import random
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import qrcode
try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4, A6, landscape, portrait
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image as PlatypusImage, KeepInFrame, Flowable
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch, mm, cm
    from reportlab.graphics.barcode import code128
    from reportlab.graphics.shapes import Drawing 
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
    REPORTLAB_AVAILABLE = True
except Exception:
    REPORTLAB_AVAILABLE = False
import io
from urllib.parse import unquote
from PIL import Image, ImageOps
from fastapi.responses import FileResponse, Response

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
    # Initialize as None, will be connected in startup event
    client = None
    db = None
    print("MongoDB client placeholders initialized")
except Exception as e:
    print(f"Error initializing MongoDB client: {e}")
    client = None
    db = None

# Razorpay client
RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID')
RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET')
RAZORPAY_WEBHOOK_SECRET = os.environ.get('RAZORPAY_WEBHOOK_SECRET')

if RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET:
    razorpay_client = razorpay.Client(
        auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)
    )
else:
    print("Warning: Razorpay credentials not provided, using mock client")
    razorpay_client = None

DELHIVERY_API_KEY = os.environ.get("DELHIVERY_API_KEY")
DELHIVERY_CLIENT = os.environ.get("DELHIVERY_CLIENT")
DELHIVERY_WAREHOUSE = os.environ.get("DELHIVERY_WAREHOUSE")
SMTP_USER = os.environ.get("SMTP_USER")
SMTP_PASS = os.environ.get("SMTP_PASS")
SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3001")
TWILIO_SID = os.environ.get("TWILIO_SID")
TWILIO_AUTH = os.environ.get("TWILIO_AUTH")
TWILIO_PHONE = os.environ.get("TWILIO_PHONE")
TWILIO_VERIFY_SERVICE_ID = os.environ.get("TWILIO_VERIFY_SERVICE_ID")
RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
SENDGRID_API_KEY = os.environ.get("SENDGRID_API_KEY")
MAIL_FROM = os.environ.get("MAIL_FROM", SMTP_USER)

try:
    if DELHIVERY_API_KEY:
        delhivery_client = DelhiveryClient(
            api_key=DELHIVERY_API_KEY,
            client_name=DELHIVERY_CLIENT,
            warehouse_name=DELHIVERY_WAREHOUSE
        )
    else:
        print("Warning: Delhivery API key not provided")
        delhivery_client = None
except Exception as e:
    print(f"Warning: Failed to initialize Delhivery client: {e}")
    delhivery_client = None

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-super-secret-jwt-key-change-this-in-production')
print(f"JWT Secret configured")

JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
JWT_EXPIRATION_DAYS = int(os.environ.get('JWT_EXPIRATION_DAYS', '7'))

# Create the main app
app = FastAPI()

# CORS Configuration
ALLOWED_ORIGINS = os.environ.get('ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:3001,http://localhost:5173,https://mirvaa-fashions.vercel.app,https://www.mirvaafashions.com,https://mirvaafashions.com').split(',')

# Always ensure local development ports are allowed, even if env var overrides the defaults
LOCAL_ORIGINS = [
    "http://localhost:3000", 
    "http://localhost:3001", 
    "http://localhost:5173", 
    "http://localhost", 
    "capacitor://localhost"
]
FINAL_ALLOWED_ORIGINS = list(set(ALLOWED_ORIGINS + LOCAL_ORIGINS))

print(f"CORS allowed origins: {FINAL_ALLOWED_ORIGINS}")

uploads_dir_env = os.environ.get("UPLOADS_DIR")
if uploads_dir_env:
    uploads_dir = Path(uploads_dir_env).resolve()
else:
    uploads_dir = (ROOT_DIR / "uploads").resolve()
os.makedirs(uploads_dir, exist_ok=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=FINAL_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["Content-Type", "Authorization", "X-RTB-FINGERPRINT-ID", "x-rtb-fingerprint-id"],
)

app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

@app.middleware("http")
async def add_corp_header(request, call_next):
    response = await call_next(request)
    try:
        if request.url.path.startswith("/uploads"):
            response.headers["Cross-Origin-Resource-Policy"] = "cross-origin"
    except Exception:
        pass
    return response

api_router = APIRouter(prefix="/api")
security = HTTPBearer()
optional_security = HTTPBearer(auto_error=False)
# Health endpoint and startup check
@app.on_event("startup")
async def verify_db_connection_on_startup():
    global client, db
    try:
        print("Initializing MongoDB client in startup event...")
        client = AsyncIOMotorClient(mongo_url)
        db = client[os.environ.get('DB_NAME', 'mirvaa_fashions')]
        
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

@api_router.get("/")
async def root():
    return {"message": "Mirvaa Backend API is running", "version": "1.0.0"}




# ==================== Models ====================

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    phone: Optional[str] = None
    phone_verified: bool = False
    email_verified: bool = False
    addresses: List[Dict[str, Any]] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    password_reset_token_hash: Optional[str] = None
    password_reset_expires_at: Optional[datetime] = None

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
class ForgotPasswordRequest(BaseModel):
    email: EmailStr
class ResetPasswordConfirm(BaseModel):
    token: str
    new_password: str
class SendOtpRequest(BaseModel):
    email: EmailStr
class VerifyOtpRequest(BaseModel):
    email: EmailStr
    code: str

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
    age_groups: List[str] = Field(default_factory=list)
    color_images: Dict[str, List[str]] = Field(default_factory=dict)
    color_details: Dict[str, Dict[str, str]] = Field(default_factory=dict)
    stock: int = 0
    sku: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    rating: float = 0.0
    reviews_count: int = 0
    product_details: Dict[str, str] = Field(default_factory=dict)
    age_group: Optional[str] = None
    is_featured: bool = False
    returnable: bool = False
    is_meesho_seller: bool = False
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
    color_images: Dict[str, List[str]] = Field(default_factory=dict)
    color_details: Dict[str, Dict[str, str]] = Field(default_factory=dict)
    stock: int
    sku: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    product_details: Dict[str, str] = Field(default_factory=dict)
    age_group: Optional[str] = None
    age_groups: List[str] = Field(default_factory=list)
    is_featured: bool = False
    returnable: bool = False
    is_meesho_seller: bool = False

class CartItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    product_id: str
    quantity: int
    size: Optional[str] = None
    color: Optional[str] = None
    age_group: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CartItemAdd(BaseModel):
    product_id: str
    quantity: int = 1
    size: Optional[str] = None
    color: Optional[str] = None
    age_group: Optional[str] = None

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
    tracking_id: Optional[str] = None
    courier_name: Optional[str] = None
    tracking_url: Optional[str] = None
    cancellation_reason: Optional[str] = None
    delivered_at: Optional[datetime] = None
    return_window_closes_at: Optional[datetime] = None
    invoice_url: Optional[str] = None
    label_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class OrderStatusUpdate(BaseModel):
    status: str
    tracking_id: Optional[str] = None
    courier_name: Optional[str] = None
    tracking_url: Optional[str] = None
    cancellation_reason: Optional[str] = None

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

# Admin Profile Models (moved to avoid duplication)

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

# Notification Model
class Notification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str  # order_placed, payment_completed, order_delivered
    message: str
    order_id: Optional[str] = None
    is_read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SiteAnalyticsEvent(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    event_type: str
    page: str
    product_id: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SiteAnalyticsEventCreate(BaseModel):
    event_type: str
    page: str
    session_id: Optional[str] = None
    product_id: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

# ==================== Helper Functions ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def ensure_product_images(product: Dict[str, Any]) -> Dict[str, Any]:
    if not product:
        return product
    images = product.get("images") or []
    if images:
        return product
    color_images = product.get("color_images") or {}
    if isinstance(color_images, dict):
        keys = list(color_images.keys())
        for key in sorted(keys):
            value = color_images.get(key)
            if isinstance(value, list) and value:
                product["images"] = [value[0]]
                break
        if not product.get("images"):
            for value in color_images.values():
                if isinstance(value, list) and value:
                    product["images"] = [value[0]]
                    break
    return product

def generate_order_label(order: Dict) -> tuple[Optional[str], Optional[str]]:
    if not REPORTLAB_AVAILABLE:
        print("ReportLab is not available. Cannot generate PDF.")
        return None, "ReportLab library is not available"

    try:
        filename = f"label_{order['order_number']}.pdf"
        filepath = uploads_dir / "labels" / filename
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        # A4 page size
        doc = SimpleDocTemplate(
            str(filepath), 
            pagesize=A4,
            leftMargin=0.5*inch,
            rightMargin=0.5*inch,
            topMargin=0.5*inch,
            bottomMargin=0.5*inch
        )
        elements = []
        styles = getSampleStyleSheet()
        
        # Custom Styles
        style_normal = styles["Normal"]
        style_normal.fontName = "Helvetica"
        style_normal.fontSize = 8
        style_normal.leading = 10
        
        style_bold = ParagraphStyle(
            'Bold',
            parent=style_normal,
            fontName="Helvetica-Bold",
        )
        
        style_title = ParagraphStyle(
            'TitleCustom',
            parent=styles["Title"],
            fontName="Helvetica-Bold",
            fontSize=16,
            alignment=TA_LEFT,
            spaceAfter=5
        )

        style_center = ParagraphStyle(
            'Center',
            parent=style_normal,
            alignment=TA_CENTER
        )

        # Helper to create QR code image
        def create_qr_code(data):
            if not data:
                return None
            qr = qrcode.QRCode(box_size=10, border=1)
            qr.add_data(data)
            qr.make(fit=True)
            img = qr.make_image(fill_color="black", back_color="white")
            buf = io.BytesIO()
            img.save(buf, format="PNG")
            buf.seek(0)
            return PlatypusImage(buf, width=1.0*inch, height=1.0*inch)

        # Helper to create Barcode
        def create_barcode(data):
            if not data:
                return None
            barcode = code128.Code128(data, barHeight=0.5*inch, barWidth=1.2, humanReadable=True)
            if isinstance(barcode, Flowable):
                return barcode
            else:
                d = Drawing(150, 40)
                d.add(barcode)
                return d

        # --- Data Extraction ---
        shipping = order.get('shipping_address', {})
        waybill = order.get('delhivery_waybill') or order.get('order_number')
        # Format: City_Temp1_L (mock pattern from image)
        city = shipping.get('city', 'City').split()[0] if shipping.get('city') else 'City'
        dest_code = f"{city}_Temp1_L"
        pincode = shipping.get('pincode', '000000')
        return_code = f"{pincode},3733369"
        
        # --- Top Section: Shipping Label ---
        
        # Left Column: Customer Address
        customer_address_html = f"""
        <b>Customer Address</b><br/>
        <b>{shipping.get('name', 'Customer Name')}</b><br/>
        {shipping.get('address') or shipping.get('street') or shipping.get('line1') or ''}<br/>
        {shipping.get('city', '')}, {shipping.get('state', '')}, {shipping.get('pincode', '')}<br/>
        Phone: {shipping.get('phone', '')}
        """
        
        # "If undelivered, return to"
        return_address_html = """
        <b>If undelivered, return to:</b><br/>
        <b>Mirvaa Fashions</b><br/>
        P NO 16, F NO 102, MARUTHI RESIDENCY,<br/>
        GOUTHAM NAGAR KRISHNA NAGAR<br/>
        COLONY, Hyderabad<br/>
        Near Oxford school<br/>
        Rangareddy, Telangana, 500074
        """
        
        left_col_content = [
            Paragraph(customer_address_html, style_normal),
            Spacer(1, 10),
            Paragraph(return_address_html, style_normal)
        ]

        # Right Column: Delhivery Info
        # COD Bar
        cod_amount = order.get('total', 0)
        # Assuming COD if payment_method is cod, else Prepaid
        payment_method = order.get('payment_method', 'prepaid').lower()
        if payment_method == 'cod':
            cod_text = "COD: Check the payable amount on the app"
            cod_bg = colors.black
            cod_fg = colors.white
        else:
            cod_text = "PREPAID"
            cod_bg = colors.white
            cod_fg = colors.black

        cod_style = ParagraphStyle(
            'COD',
            parent=style_normal,
            textColor=cod_fg,
            backColor=cod_bg,
            alignment=TA_CENTER,
            fontSize=10,
            leading=14,
            fontName="Helvetica-Bold"
        )
        
        # QR Code
        qr_img = create_qr_code(waybill)
        
        # Barcode
        barcode_drawing = create_barcode(waybill)

        right_col_content = [
            Paragraph(cod_text, cod_style),
            Spacer(1, 5),
            Table([
                [
                    [
                        Paragraph("<b>Delhivery</b>", style_title),
                        Paragraph('<font backColor="black" color="white"> Pickup </font>', style_normal),
                        Spacer(1, 5),
                        Paragraph("Destination Code", style_normal),
                        Paragraph(f"<b>{dest_code}</b>", style_bold),
                        Paragraph(f"({shipping.get('state', '')})", style_normal),
                        Spacer(1, 5),
                        Paragraph("Return Code", style_normal),
                        Paragraph(f"<b>{return_code}</b>", style_bold),
                    ],
                    qr_img
                ]
            ], colWidths=[2.0*inch, 1.2*inch], style=TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP')])),
            Spacer(1, 5),
            Paragraph(f"<b>{waybill}</b>", style_center),
            barcode_drawing
        ]

        # Main Label Table
        label_table = Table(
            [[left_col_content, right_col_content]],
            colWidths=[3.5*inch, 3.8*inch],
        )
        label_table.setStyle(TableStyle([
            ('BOX', (0, 0), (-1, -1), 1, colors.black),
            ('INNERGRID', (0, 0), (-1, -1), 1, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('TOPPADDING', (0, 0), (-1, -1), 2),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
            ('LEFTPADDING', (0, 0), (-1, -1), 5),
            ('RIGHTPADDING', (0, 0), (-1, -1), 5),
        ]))
        elements.append(label_table)

        # --- Product Details Strip ---
        # SKU | Size | Qty | Color | Order No.
        first_item = order['items'][0] if order['items'] else {}
        prod_sku = first_item.get('sku', first_item.get('product_id', 'N/A')[:8])
        prod_size = first_item.get('size', 'N/A')
        prod_qty = str(sum(item.get('quantity', 1) for item in order['items']))
        prod_color = first_item.get('color', 'N/A')
        
        prod_data = [
            ["Product Details"],
            ["SKU", "Size", "Qty", "Color", "Order No."],
            [prod_sku, prod_size, prod_qty, prod_color, order['order_number']]
        ]
        
        prod_table = Table(prod_data, colWidths=[1.5*inch, 0.8*inch, 0.8*inch, 1.0*inch, 3.2*inch])
        prod_table.setStyle(TableStyle([
            ('BOX', (0, 0), (-1, -1), 1, colors.black),
            ('LINEBELOW', (0, 0), (-1, 0), 1, colors.black), # Under header
            ('SPAN', (0, 0), (-1, 0)), # Span "Product Details"
            ('FONTNAME', (0, 0), (-1, 1), 'Helvetica-Bold'),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 2),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ]))
        elements.append(prod_table)
        elements.append(Spacer(1, 10))

        # --- Tax Invoice Section ---
        
        # Invoice Header
        inv_header_data = [[
            Paragraph("<b>TAX INVOICE</b>", style_center),
            Paragraph("Original For Recipient", ParagraphStyle('Right', parent=style_normal, alignment=TA_RIGHT))
        ]]
        inv_header_table = Table(inv_header_data, colWidths=[3.65*inch, 3.65*inch])
        inv_header_table.setStyle(TableStyle([
            ('BOX', (0, 0), (-1, -1), 1, colors.black),
            ('BACKGROUND', (0, 0), (-1, -1), colors.lightgrey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        elements.append(inv_header_table)

        # Invoice Meta Data (Bill To / Ship To / Sold By / Dates)
        bill_to_html = f"""
        <b>BILL TO / SHIP TO</b><br/>
        {shipping.get('name', '')}, {shipping.get('address', '')},<br/>
        {shipping.get('city', '')}, {shipping.get('state', '')}, {shipping.get('pincode', '')}<br/>
        Place of Supply: {shipping.get('state', '')}
        """
        
        sold_by_html = """
        <b>Sold By : MANIKANTI VINAY KUMAR</b><br/>
        Mirvaa Fashions, P NO 16 F NO 102 MARUTHI RESIDENCY GOUTHAM NAGAR KRISHNA NAGAR COLONY , Rangareddy, Telangana, 500074<br/>
        <b>GSTIN - 36BWFPM1923G1ZN</b>
        """
        
        created_dt = datetime.fromisoformat(order['created_at'].replace('Z', '+00:00')) if isinstance(order.get('created_at'), str) else order.get('created_at', datetime.now())
        order_date_str = created_dt.strftime("%d.%m.%Y")
        invoice_no = order.get('order_number')[-8:] 
        
        right_sub_table = Table([
            [Paragraph(sold_by_html, style_normal)],
            [
                 Table([
                    ["Purchase Order No.", "Invoice No.", "Order Date", "Invoice Date"],
                    [order['order_number'][:15], invoice_no, order_date_str, order_date_str]
                ], colWidths=[1.4*inch, 0.8*inch, 0.7*inch, 0.7*inch], style=TableStyle([
                    ('FONTSIZE', (0,0), (-1,-1), 6),
                    ('FONTNAME', (0,1), (-1,1), 'Helvetica-Bold'),
                    ('VALIGN', (0,0), (-1,-1), 'TOP'),
                ]))
            ]
        ], colWidths=[3.65*inch])
        right_sub_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('LEFTPADDING', (0,0), (-1,-1), 0),
            ('RIGHTPADDING', (0,0), (-1,-1), 0),
            ('TOPPADDING', (0,0), (-1,-1), 0),
            ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ]))

        meta_container = Table([
            [Paragraph(bill_to_html, style_normal), right_sub_table]
        ], colWidths=[3.65*inch, 3.65*inch])
        
        meta_container.setStyle(TableStyle([
            ('BOX', (0, 0), (-1, -1), 1, colors.black),
            ('INNERGRID', (0, 0), (-1, -1), 1, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        elements.append(meta_container)

        # --- Items Table ---
        items_header = ["Description", "HSN", "Qty", "Gross Amount", "Discount", "Taxable Value", "Taxes", "Total"]
        items_data = [items_header]
        
        total_taxable = 0
        total_taxes = 0
        final_total = 0
        
        for item in order['items']:
            qty = item.get('quantity', 1)
            price = float(item.get('price', 0)) 
            # Back calculate tax (5% GST assumed from image)
            tax_rate = 0.05
            base_price = price / (1 + tax_rate)
            tax_amount = price - base_price
            
            gross = price * qty
            discount = 0 
            taxable = base_price * qty
            total_tax_item = tax_amount * qty
            item_total = gross - discount 
            
            total_taxable += taxable
            total_taxes += total_tax_item
            final_total += item_total

            items_data.append([
                Paragraph(item.get('product_title', 'Item'), style_normal),
                "6205", 
                str(qty),
                f"Rs.{gross:.2f}",
                f"Rs.{discount}",
                f"Rs.{taxable:.2f}",
                f"IGST @5.0%\nRs.{total_tax_item:.2f}",
                f"Rs.{item_total:.2f}"
            ])
            
        shipping_cost = float(order.get('shipping_cost', 0) or order.get('shipping', 0))
        if shipping_cost > 0:
             # Assuming shipping is inclusive of tax or exempt? 
             # Usually shipping attracts 18% GST but for simplicity matching 5% or treating as exempt if not specified.
             # User said: "product price is 499, shipping is 50, total 549".
             # If we treat 50 as gross, we can back calculate or just add it.
             # Let's treat it as a line item.
             base_ship = shipping_cost / 1.05
             tax_ship = shipping_cost - base_ship
             items_data.append([
                "Shipping Charges", "9965", "NA", 
                f"Rs.{shipping_cost:.2f}", "Rs.0", 
                f"Rs.{base_ship:.2f}", 
                f"IGST @5.0%\nRs.{tax_ship:.2f}", 
                f"Rs.{shipping_cost:.2f}"
             ])
             total_taxable += base_ship
             total_taxes += tax_ship
             final_total += shipping_cost

        # Total Row
        items_data.append([
            "Total", "", "", "", "", "", f"Rs.{total_taxes:.2f}", f"Rs.{final_total:.2f}"
        ])

        items_table = Table(items_data, colWidths=[2.3*inch, 0.5*inch, 0.4*inch, 0.9*inch, 0.7*inch, 0.9*inch, 0.8*inch, 0.8*inch])
        items_table.setStyle(TableStyle([
            ('BOX', (0, 0), (-1, -1), 1, colors.black),
            ('INNERGRID', (0, 0), (-1, -2), 0.5, colors.grey), # Grid for items
            ('LINEBELOW', (0, 0), (-1, 0), 1, colors.black), # Header line
            ('LINEABOVE', (0, -1), (-1, -1), 1, colors.black), # Total line top
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 7),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BACKGROUND', (0, 0), (-1, 0), colors.whitesmoke),
             ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'), # Bold Total
        ]))
        elements.append(items_table)
        
        # Disclaimer
        disclaimer = "Tax is not payable on reverse charge basis. This is a computer generated invoice and does not require signature. Other charges are charges that are applicable to your order and include charges for logistics fee (where applicable). Includes discounts for your city and/or for online payments (as applicable)"
        elements.append(Table([[Paragraph(disclaimer, ParagraphStyle('Disc', parent=style_normal, fontSize=6))]], style=TableStyle([
            ('BOX', (0,0), (-1,-1), 1, colors.black),
            ('TOPPADDING', (0,0), (-1,-1), 2),
            ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ])))

        doc.build(elements)
        return str(filepath), None
    except Exception as e:
        print(f"Error generating PDF label: {e}")
        import traceback
        traceback.print_exc()
        return None, str(e)

async def create_notification(type: str, message: str, order_id: Optional[str] = None):
    try:
        notification = Notification(
            type=type,
            message=message,
            order_id=order_id
        )
        notif_dict = notification.model_dump()
        notif_dict['created_at'] = notif_dict['created_at'].isoformat()
        if db is not None:
            await db.notifications.insert_one(notif_dict)
    except Exception as e:
        print(f"Error creating notification: {e}")


def create_token(user_id: str, email: str) -> str:
    expiration = datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRATION_DAYS)
    payload = {
        'user_id': user_id,
        'email': email,
        'exp': expiration
    }
    return jose_jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(token: str) -> Dict:
    try:
        payload = jose_jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except JWTError:
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
    ver = await db.email_verifications.find_one({"email": user_data.email})
    if not ver:
        raise HTTPException(status_code=400, detail="Email not verified")
    ver_exp = ver.get("expires_at")
    if isinstance(ver_exp, str):
        try:
            ver_exp_dt = datetime.fromisoformat(ver_exp)
        except Exception:
            ver_exp_dt = datetime.now(timezone.utc) - timedelta(seconds=1)
    else:
        ver_exp_dt = ver_exp
    if not ver_exp_dt or datetime.now(timezone.utc) > ver_exp_dt:
        raise HTTPException(status_code=400, detail="Email verification expired")
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    hashed_pw = hash_password(user_data.password)
    user = User(
        email=user_data.email,
        name=user_data.name,
        phone=user_data.phone,
        email_verified=True
    )
    
    user_dict = user.model_dump()
    user_dict['password'] = hashed_pw
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    
    await db.users.insert_one(user_dict)
    await db.email_verifications.delete_one({"email": user_data.email})
    
    token = create_token(user.id, user.email)
    return TokenResponse(token=token, user=user)

def _send_reset_email(to_email: str, raw_token: str):
    if not SMTP_USER and not RESEND_API_KEY and not SENDGRID_API_KEY:
        logging.warning("No email provider configured")
    reset_url = f"{FRONTEND_URL}/reset-password?token={raw_token}"
    html = f"""<div style="font-family:Inter,Arial,sans-serif">
      <h2>Mirvaa Fashions</h2>
      <p>Click the button below to reset your password. This link expires in 30 minutes.</p>
      <p><a href="{reset_url}" style="background:#1a73e8;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Reset Password</a></p>
      <p>If the button doesn't work, paste this URL into your browser:</p>
      <p>{reset_url}</p>
    </div>"""
    _send_email_via_providers(
        to_email=to_email,
        subject="Reset your Mirvaa password",
        html=html,
    )

def _send_email_via_providers(to_email: str, subject: str, html: str):
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = MAIL_FROM or SMTP_USER
    msg["To"] = to_email
    msg.attach(MIMEText(html, "html"))

    if RESEND_API_KEY:
        try:
            headers = {"Authorization": f"Bearer {RESEND_API_KEY}", "Content-Type": "application/json"}
            payload = {"from": MAIL_FROM or SMTP_USER, "to": to_email, "subject": subject, "html": html}
            r = requests.post("https://api.resend.com/emails", headers=headers, json=payload, timeout=15)
            if r.status_code in (200, 201, 202):
                logging.info(f"Email sent via Resend to {to_email}")
                return
            logging.error(f"Resend error: {r.status_code} {r.text}")
            if r.status_code == 403:
                if "gmail.com" in payload.get("from", ""):
                    logging.error("Tip: Resend does not allow sending from @gmail.com. Set MAIL_FROM='onboarding@resend.dev' in your environment variables for testing.")
                elif "onboarding@resend.dev" in payload.get("from", ""):
                    logging.error("Tip: When using 'onboarding@resend.dev', you can ONLY send emails to the address you used to sign up for Resend. To send to real users, you must verify your domain (mirvaafashions.com) on Resend.")
        except Exception as e:
            logging.error(f"Resend exception: {type(e).__name__}: {str(e)}")

    if SENDGRID_API_KEY:
        try:
            headers = {"Authorization": f"Bearer {SENDGRID_API_KEY}", "Content-Type": "application/json"}
            payload = {
                "personalizations": [{"to": [{"email": to_email}]}],
                "from": {"email": MAIL_FROM or SMTP_USER},
                "subject": subject,
                "content": [{"type": "text/html", "value": html}],
            }
            r = requests.post("https://api.sendgrid.com/v3/mail/send", headers=headers, json=payload, timeout=15)
            if r.status_code in (200, 202):
                logging.info(f"Email sent via SendGrid to {to_email}")
                return
            logging.error(f"SendGrid error: {r.status_code} {r.text}")
        except Exception as e:
            logging.error(f"SendGrid exception: {type(e).__name__}: {str(e)}")

    context = ssl.create_default_context()
    try:
        logging.info(f"Attempting SMTP connection to {SMTP_HOST}:{SMTP_PORT}...")
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
            server.ehlo()
            try:
                server.starttls(context=context)
                server.ehlo()
            except smtplib.SMTPNotSupportedError:
                pass
            if SMTP_USER and SMTP_PASS:
                server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(MAIL_FROM or SMTP_USER, [to_email], msg.as_string())
            logging.info(f"Email sent via SMTP ({SMTP_PORT}) to {to_email}")
            return
    except Exception as e:
        logging.error(f"SMTP {SMTP_PORT} error: {type(e).__name__}: {str(e)}")

    try:
        logging.info(f"Attempting SMTP_SSL connection to {SMTP_HOST}:465...")
        with smtplib.SMTP_SSL(SMTP_HOST, 465, context=context, timeout=15) as server:
            if SMTP_USER and SMTP_PASS:
                server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(MAIL_FROM or SMTP_USER, [to_email], msg.as_string())
            logging.info(f"Email sent via SMTP_SSL (465) to {to_email}")
            return
    except Exception as e:
        logging.error(f"SMTP_SSL 465 error: {type(e).__name__}: {str(e)}")


def _send_order_status_email(order: Dict[str, Any], previous_status: Optional[str], new_status: str):
    try:
        user_email = order.get("user_email") or order.get("email")
        shipping = order.get("shipping_address", {})
        customer_name = shipping.get("name") or order.get("customer_name") or "Customer"
        items = order.get("items", [])
        order_number = order.get("order_number", order.get("id", ""))
        status_label = new_status.replace("_", " ").title()

        rows = []
        for item in items:
            title = item.get("product_title") or item.get("title") or "Product"
            qty = item.get("quantity", 1)
            price = item.get("price", 0)
            rows.append(f"<tr><td>{title}</td><td style='text-align:center'>{qty}</td><td style='text-align:right'>₹{price:.2f}</td></tr>")

        items_html = "".join(rows)
        total = order.get("total", 0)
        subtotal = order.get("subtotal", 0)
        shipping_amount = order.get("shipping", 0)

        base_html = f"""
        <div style="font-family:Inter,Arial,sans-serif;font-size:14px;color:#111">
          <h2 style="margin-bottom:8px;">Mirvaa Fashions</h2>
          <p style="margin:0 0 8px;">Hi {customer_name},</p>
          <p style="margin:0 0 12px;">Your order <strong>{order_number}</strong> is now <strong>{status_label}</strong>.</p>
          <p style="margin:0 0 12px;">Order summary:</p>
          <table style="width:100%;border-collapse:collapse;margin-bottom:12px;">
            <thead>
              <tr>
                <th style="text-align:left;border-bottom:1px solid #eee;padding:6px 0;">Product</th>
                <th style="text-align:center;border-bottom:1px solid #eee;padding:6px 0;">Qty</th>
                <th style="text-align:right;border-bottom:1px solid #eee;padding:6px 0;">Price</th>
              </tr>
            </thead>
            <tbody>
              {items_html}
            </tbody>
          </table>
          <p style="margin:0 0 4px;"><strong>Subtotal:</strong> ₹{subtotal:.2f}</p>
          <p style="margin:0 0 4px;"><strong>Shipping:</strong> ₹{shipping_amount:.2f}</p>
          <p style="margin:0 0 12px;"><strong>Total:</strong> ₹{total:.2f}</p>
          <p style="margin:0 0 4px;"><strong>Current status:</strong> {status_label}</p>
        </div>
        """

        if user_email:
            _send_email_via_providers(
                to_email=user_email,
                subject=f"Your Mirvaa order {order_number} is {status_label}",
                html=base_html,
            )

        admin_email = "mirvaafashions@gmail.com"
        admin_html = f"""
        <div style="font-family:Inter,Arial,sans-serif;font-size:14px;color:#111">
          <h2 style="margin-bottom:8px;">Order status updated</h2>
          <p style="margin:0 0 8px;"><strong>Order:</strong> {order_number}</p>
          <p style="margin:0 0 4px;"><strong>Previous status:</strong> {previous_status or "N/A"}</p>
          <p style="margin:0 0 12px;"><strong>New status:</strong> {status_label}</p>
          <p style="margin:0 0 8px;"><strong>Customer:</strong> {customer_name}</p>
          <p style="margin:0 0 8px;"><strong>Customer email:</strong> {user_email or "Unknown"}</p>
          {base_html}
        </div>
        """
        _send_email_via_providers(
            to_email=admin_email,
            subject=f"Order {order_number} status updated to {status_label}",
            html=admin_html,
        )
    except Exception as e:
        logging.error(f"Failed to send order status email: {type(e).__name__}: {str(e)}")


@api_router.post("/auth/forgot-password")
async def forgot_password(req: ForgotPasswordRequest, background_tasks: BackgroundTasks):
    user_doc = await db.users.find_one({"email": req.email})
    if not user_doc:
        return {"message": "If the account exists, a reset email has been sent"}
    raw_token = os.urandom(24).hex()
    # Use SHA256 for the token so we can look it up deterministically
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=30)
    await db.users.update_one(
        {"id": user_doc["id"]},
        {"$set": {"password_reset_token_hash": token_hash, "password_reset_expires_at": expires_at.isoformat()}}
    )
    background_tasks.add_task(_send_reset_email, req.email, raw_token)
    return {"message": "If the account exists, a reset email has been sent"}

@api_router.post("/auth/reset-password")
async def reset_password(data: ResetPasswordConfirm):
    # Hash the incoming token to find the user
    hashed_token = hashlib.sha256(data.token.encode()).hexdigest()
    user_doc = await db.users.find_one({"password_reset_token_hash": hashed_token})
    
    if not user_doc:
        raise HTTPException(status_code=400, detail="Invalid token")
    
    expires = user_doc.get("password_reset_expires_at")
    if not expires:
        raise HTTPException(status_code=400, detail="Invalid token")
        
    if isinstance(expires, str):
        try:
            expires_dt = datetime.fromisoformat(expires)
        except:
            expires_dt = datetime.now(timezone.utc) - timedelta(seconds=1)
    else:
        expires_dt = expires
        
    if datetime.now(timezone.utc) > expires_dt:
        raise HTTPException(status_code=400, detail="Token expired")
        
    new_hash = hash_password(data.new_password)
    await db.users.update_one(
        {"id": user_doc["id"]},
        {"$set": {"password": new_hash}, "$unset": {"password_reset_token_hash": "", "password_reset_expires_at": ""}}
    )
    return {"message": "Password updated"}

DISPOSABLE_DOMAINS = {
    "tempmail.com", "10minutemail.com", "guerrillamail.com", "mailinator.com",
    "yopmail.com", "throwawaymail.com", "getnada.com", "sharklasers.com",
    "temp-mail.org", "fakemail.net"
}

@api_router.post("/auth/send-otp")
async def send_otp(req: SendOtpRequest):
    # Validate disposable email
    email_domain = req.email.split('@')[-1].lower()
    if email_domain in DISPOSABLE_DOMAINS:
        logging.warning(f"Blocked disposable email signup attempt: {req.email}")
        raise HTTPException(status_code=400, detail="Disposable email addresses are not allowed. Please use a real email ID.")

    # Rate limiting
    existing_otp = await db.email_otps.find_one({"email": req.email})
    if existing_otp:
        last_sent = existing_otp.get("last_sent_at")
        if last_sent:
            if isinstance(last_sent, str):
                try:
                    last_sent_dt = datetime.fromisoformat(last_sent)
                except ValueError:
                    last_sent_dt = datetime.now(timezone.utc) - timedelta(minutes=2)
            else:
                last_sent_dt = last_sent
            
            if datetime.now(timezone.utc) - last_sent_dt < timedelta(minutes=1):
                 logging.warning(f"Rate limit exceeded for OTP request: {req.email}")
                 raise HTTPException(status_code=429, detail="Please wait before requesting another OTP.")

    code = f"{uuid.uuid4().int % 1000000:06d}"
    code_hash = hashlib.sha256(code.encode()).hexdigest()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    await db.email_otps.update_one(
        {"email": req.email},
        {
            "$set": {
                "email": req.email, 
                "code_hash": code_hash, 
                "expires_at": expires_at.isoformat(),
                "last_sent_at": datetime.now(timezone.utc).isoformat()
            }
        },
        upsert=True,
    )
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Your Mirvaa verification code"
    msg["From"] = MAIL_FROM or SMTP_USER
    msg["To"] = req.email
    html = f"""<div style="font-family:Inter,Arial,sans-serif">
      <h2>Mirvaa Fashions</h2>
      <p>Your verification code is:</p>
      <p style="font-size:24px;font-weight:bold;letter-spacing:4px">{code}</p>
      <p>This code will expire in 10 minutes.</p>
    </div>"""
    msg.attach(MIMEText(html, "html"))
    if RESEND_API_KEY:
        try:
            headers = {"Authorization": f"Bearer {RESEND_API_KEY}", "Content-Type": "application/json"}
            payload = {"from": MAIL_FROM or SMTP_USER, "to": req.email, "subject": "Your Mirvaa verification code", "html": html}
            r = requests.post("https://api.resend.com/emails", headers=headers, json=payload, timeout=15)
            if r.status_code in (200, 201, 202):
                return {"status": "sent"}
        except Exception:
            pass
    if SENDGRID_API_KEY:
        try:
            headers = {"Authorization": f"Bearer {SENDGRID_API_KEY}", "Content-Type": "application/json"}
            payload = {
                "personalizations": [{"to": [{"email": req.email}]}],
                "from": {"email": MAIL_FROM or SMTP_USER},
                "subject": "Your Mirvaa verification code",
                "content": [{"type": "text/html", "value": html}],
            }
            r = requests.post("https://api.sendgrid.com/v3/mail/send", headers=headers, json=payload, timeout=15)
            if r.status_code in (200, 202):
                return {"status": "sent"}
        except Exception:
            pass
    context = ssl.create_default_context()
    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
            server.ehlo()
            try:
                server.starttls(context=context)
                server.ehlo()
            except smtplib.SMTPNotSupportedError:
                pass
            if SMTP_USER and SMTP_PASS:
                server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(MAIL_FROM or SMTP_USER, [req.email], msg.as_string())
            return {"status": "sent"}
    except Exception:
        try:
            with smtplib.SMTP_SSL(SMTP_HOST, 465, context=context, timeout=15) as server:
                if SMTP_USER and SMTP_PASS:
                    server.login(SMTP_USER, SMTP_PASS)
                server.sendmail(MAIL_FROM or SMTP_USER, [req.email], msg.as_string())
                return {"status": "sent"}
        except Exception:
            raise HTTPException(status_code=500, detail="Failed to send verification email")

@api_router.post("/auth/verify-otp")
async def verify_otp(req: VerifyOtpRequest):
    record = await db.email_otps.find_one({"email": req.email})
    if not record:
        raise HTTPException(status_code=400, detail="Invalid code")
    expires = record.get("expires_at")
    if isinstance(expires, str):
        try:
            expires_dt = datetime.fromisoformat(expires)
        except Exception:
            expires_dt = datetime.now(timezone.utc) - timedelta(seconds=1)
    else:
        expires_dt = expires
    if not expires_dt or datetime.now(timezone.utc) > expires_dt:
        raise HTTPException(status_code=400, detail="Invalid or expired code")
    code_hash = hashlib.sha256(req.code.encode()).hexdigest()
    if code_hash != record.get("code_hash"):
        raise HTTPException(status_code=400, detail="Invalid code")
    await db.email_verifications.update_one(
        {"email": req.email},
        {
            "$set": {
                "email": req.email,
                "verified_at": datetime.now(timezone.utc).isoformat(),
                "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=30)).isoformat(),
            }
        },
        upsert=True,
    )
    await db.users.update_one({"email": req.email}, {"$set": {"email_verified": True}})
    await db.email_otps.delete_one({"email": req.email})
    return {"status": "approved"}

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
        # Check if there are NO admins at all
        admin_count = await db.admins.count_documents({})
        
        # Create admin if it's the first one OR if it matches the default fallback
        if admin_count == 0 or (credentials.username == "admin" and credentials.password == "admin123"):
            new_admin = {
                "id": str(uuid.uuid4()),
                "username": credentials.username,
                "password": hash_password(credentials.password),
                "role": "admin",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.admins.insert_one(new_admin)
            token = create_token(new_admin['id'], credentials.username)
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
    size: List[str] = Query(None),
    age_group: List[str] = Query(None),
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
    
    if size:
        query['sizes'] = {'$in': size}
        
    if age_group:
        # Match products that have at least one of the selected age groups
        query['age_groups'] = {'$in': age_group}

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
        if isinstance(product.get('created_at'), str):
            product['created_at'] = datetime.fromisoformat(product['created_at'])
        ensure_product_images(product)
    
    return products

@api_router.get("/products/featured", response_model=List[Product])
async def get_featured_products():
    # Fetch a larger pool to allow for rotation
    products = await db.products.find({"is_featured": True}, {"_id": 0}).limit(50).to_list(50)
    
    # Shuffle based on time (every 10 minutes)
    if products:
        seed = int(time.time() / 600)
        random.seed(seed)
        random.shuffle(products)
    
    # Return top 8
    selected_products = products[:8]
    
    for product in selected_products:
        if isinstance(product.get('created_at'), str):
            product['created_at'] = datetime.fromisoformat(product['created_at'])
        ensure_product_images(product)
    
    return selected_products

@api_router.get("/products/new-arrivals", response_model=List[Product])
async def get_new_arrivals():
    # Categories to include (pulling from all requested categories)
    # We include variations like "Men's Wear" just in case, but prioritize the user's list.
    target_categories = ["Shirts", "Jeans", "Ladies Dresses", "Sarees", "Men's Wear"]
    
    # Fetch recent products from these categories (larger pool for rotation)
    products = await db.products.find(
        {"category": {"$in": target_categories}}, 
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    
    # Shuffle based on time (every 10 minutes)
    if products:
        seed = int(time.time() / 600)
        random.seed(seed)
        random.shuffle(products)
    
    # Return top 8
    selected_products = products[:8]
    
    for product in selected_products:
        if isinstance(product.get('created_at'), str):
            product['created_at'] = datetime.fromisoformat(product['created_at'])
        ensure_product_images(product)
    
    return selected_products

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if isinstance(product.get('created_at'), str):
        product['created_at'] = datetime.fromisoformat(product['created_at'])
    ensure_product_images(product)
    
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
            if isinstance(product.get('created_at'), str):
                product['created_at'] = datetime.fromisoformat(product['created_at'])
            ensure_product_images(product)
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
        "color": item_data.color,
        "age_group": item_data.age_group
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
            color=item_data.color,
            age_group=item_data.age_group
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
            if isinstance(product.get('created_at'), str):
                product['created_at'] = datetime.fromisoformat(product['created_at'])
            ensure_product_images(product)
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

@api_router.get("/shipping/track/{order_id}")
async def track_shipping(order_id: str, current_user: Dict = Depends(get_current_user)):
    """Track a shipping order"""
    try:
        # Get order details
        order = await db.orders.find_one({"id": order_id})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Check if order has Delhivery waybill
        if "delhivery_waybill" in order and order["delhivery_waybill"]:
            # Track with Delhivery
            try:
                if delhivery_client:
                    response = delhivery_client.track_shipment(order["delhivery_waybill"])
                    return {"success": True, "tracking_data": response, "courier": "Delhivery"}
                else:
                    # Fallback if client not initialized
                    tracking_url = f"https://track.delhivery.com/api/v1/packages/json/?waybill={order['delhivery_waybill']}&token={DELHIVERY_API_KEY}"
                    response = requests.get(tracking_url)
                    if response.ok:
                        return {"success": True, "tracking_data": response.json(), "courier": "Delhivery"}
            except Exception as e:
                print(f"Delhivery tracking error: {e}")
            
        # Fallback if no tracking info
        if "tracking_id" in order:
             return {
                 "success": True, 
                 "tracking_data": {
                     "tracking_url": order.get("tracking_url"),
                     "tracking_id": order.get("tracking_id"),
                     "courier_name": order.get("courier_name")
                 },
                 "courier": order.get("courier_name", "Unknown")
             }

        # Return pending status for orders without tracking info yet
        return {
            "success": True,
            "tracking_data": [],
            "courier": "Pending",
            "status": "Processing"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to track shipping: {str(e)}")

# ==================== Return Routes ====================

@api_router.post("/returns")
async def create_return_request(return_data: ReturnRequestCreate, current_user: Dict = Depends(get_current_user)):
    # Verify order
    order = await db.orders.find_one({"id": return_data.order_id, "user_id": current_user['id']})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    product_in_order = False
    product_title = None
    for item in order['items']:
        if item.get('product_id') == return_data.product_id:
            product_in_order = True
            product_title = item.get('product_title') or (item.get('product') or {}).get('title')
            break
    
    if not product_in_order:
        raise HTTPException(status_code=400, detail="Product not found in order")

    # Check return window (3 days from delivered_at)
    # If delivered_at is not set, we assume it's not delivered yet, or we might check status
    if order.get('status') != 'delivered':
         raise HTTPException(status_code=400, detail="Order is not delivered yet")
         
    delivered_at = order.get('delivered_at')
    if delivered_at:
        if isinstance(delivered_at, str):
            delivered_at = datetime.fromisoformat(delivered_at)
        
        # Ensure delivered_at is offset-aware if using timezone.utc
        if delivered_at.tzinfo is None:
            delivered_at = delivered_at.replace(tzinfo=timezone.utc)
            
        now = datetime.now(timezone.utc)
        if (now - delivered_at).days > 3:
            raise HTTPException(status_code=400, detail="Return window has expired (3 days)")
    
    # Check if return already exists
    existing_return = await db.returns.find_one({
        "order_id": return_data.order_id, 
        "product_id": return_data.product_id
    })
    if existing_return:
        await db.orders.update_one(
            {"id": return_data.order_id},
            {
                "$set": {
                    "status": "return_requested",
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        return {
            "message": "Return request already exists for this product",
            "id": existing_return["id"],
            "already_exists": True
        }
    
    # Create return request
    return_request = ReturnRequest(
        user_id=current_user['id'],
        order_id=return_data.order_id,
        product_id=return_data.product_id,
        reason=return_data.reason
    )
    
    return_dict = return_request.model_dump()
    return_dict['created_at'] = return_dict['created_at'].isoformat()
    
    await db.returns.insert_one(return_dict)

    await db.orders.update_one(
        {"id": return_data.order_id},
        {
            "$set": {
                "status": "return_requested",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    notification_message = f"New return request for order {order.get('order_number')}"
    if product_title:
        notification_message += f" - {product_title} ({return_data.product_id})"
    else:
        notification_message += f" - Product ID: {return_data.product_id}"
    notification_message += f" • Reason: {return_data.reason}"
    
    await create_notification(
        type="return_requested",
        message=notification_message,
        order_id=return_data.order_id
    )
    
    return {"message": "Return request submitted successfully", "id": return_request.id}

@api_router.get("/returns")
async def get_user_returns(current_user: Dict = Depends(get_current_user)):
    returns = await db.returns.find({"user_id": current_user['id']}, {"_id": 0}).to_list(100)
    return returns

@api_router.get("/admin/returns")
async def get_admin_returns(current_admin: Dict = Depends(get_current_admin)):
    returns = await db.returns.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    # Enrich with user and product details
    enriched_returns = []
    for ret in returns:
        user = await db.users.find_one({"id": ret['user_id']}, {"_id": 0})
        product = await db.products.find_one({"id": ret['product_id']}, {"_id": 0})
        order = await db.orders.find_one({"id": ret['order_id']}, {"_id": 0})
        
        enriched_returns.append({
            **ret,
            "user_email": user.get('email') if user else "Unknown",
            "user_name": user.get('name') if user else "Unknown",
            "product_name": product.get('title') if product else "Unknown",
            "product_image": product.get('images', [])[0] if product and product.get('images') else None,
            "order_number": order.get('order_number') if order else "Unknown"
        })
        
    return enriched_returns

@api_router.put("/admin/returns/{return_id}")
async def update_return_status(return_id: str, status: str = Body(..., embed=True), current_admin: Dict = Depends(get_current_admin)):
    result = await db.returns.update_one(
        {"id": return_id},
        {"$set": {"status": status}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Return request not found")
    
    # When a return is completed, mark the corresponding order as returned
    if status == "completed":
        ret = await db.returns.find_one({"id": return_id}, {"_id": 0})
        if ret and ret.get("order_id"):
            await db.orders.update_one(
                {"id": ret["order_id"]},
                {
                    "$set": {
                        "status": "returned",
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }
                }
            )
            
            # Send email notification
            order = await db.orders.find_one({"id": ret["order_id"]})
            if order:
                user = await db.users.find_one({"id": order["user_id"]})
                if user:
                    # Reuse order status email logic or create new
                    pass
    
    return {"message": "Return status updated", "status": status}

@api_router.post("/admin/returns/{return_id}/approve")
async def approve_return_request(return_id: str, current_admin: Dict = Depends(get_current_admin)):
    """
    Approve return request and schedule pickup with Delhivery
    """
    if not delhivery_client:
        raise HTTPException(status_code=400, detail="Delhivery client not initialized")
        
    return_req = await db.returns.find_one({"id": return_id})
    if not return_req:
        raise HTTPException(status_code=404, detail="Return request not found")
        
    order = await db.orders.find_one({"id": return_req["order_id"]})
    if not order:
        raise HTTPException(status_code=404, detail="Original order not found")
        
    # Get user details for pickup
    user = await db.users.find_one({"id": return_req["user_id"]})
    
    # Prepare address from order shipping address
    # If user has profile address, we might want to check, but usually return is from shipping address
    pickup_address = order.get("shipping_address")
    if not pickup_address:
         # Fallback to user profile if available
         if user and user.get("address"):
             pickup_address = user["address"] # Assuming structure matches
         else:
             raise HTTPException(status_code=400, detail="Pickup address not found in order")
             
    # Prepare items for return
    # Only include the item being returned
    return_items = []
    product_found = False
    for item in order["items"]:
        if item.get("product_id") == return_req["product_id"]:
            return_items.append(item)
            product_found = True
            break
            
    if not product_found:
        # Should not happen if logic is correct
        raise HTTPException(status_code=400, detail="Product not found in order items")

    try:
        # Create Reverse Pickup in Delhivery
        response = delhivery_client.create_return_shipment(
            order=order,
            address=pickup_address,
            items=return_items
        )
        
        # Check response for success (Delhivery usually returns 'packages' list or 'upload_wbn')
        # Response structure: {"packages": [{"waybill": "...", ...}], "success": True} or similar
        
        waybill = ""
        if isinstance(response, dict):
             if response.get("packages") and len(response["packages"]) > 0:
                 waybill = response["packages"][0].get("waybill", "")
             elif response.get("waybill"):
                 waybill = response["waybill"]
        
        # Update return status
        await db.returns.update_one(
            {"id": return_id},
            {"$set": {
                "status": "pickup_scheduled",
                "waybill": waybill,
                "pickup_scheduled_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Update order status
        await db.orders.update_one(
            {"id": return_req["order_id"]},
            {"$set": {
                "status": "return_pickup_scheduled",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        await create_notification(
            type="return_approved",
            message=f"Return pickup scheduled for order {order.get('order_number')}. Waybill: {waybill}",
            order_id=return_req["order_id"]
        )
        
        return {"success": True, "message": "Return approved and pickup scheduled", "waybill": waybill}
        
    except Exception as e:
        print(f"Error scheduling return pickup: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to schedule pickup: {str(e)}")


# ==================== Order Routes ====================

@api_router.post("/orders/create")
async def create_order(
    order_data: OrderCreate,
    background_tasks: BackgroundTasks,
    current_user: Dict = Depends(get_current_user),
):
    # Generate order number
    order_number = f"ORD{datetime.now().strftime('%Y%m%d')}{str(uuid.uuid4())[:8].upper()}"
    
    # Enforce delivery charge rule
    # If subtotal < 500, shipping must be 50. Otherwise 0 (or whatever was passed, but we force 0 for consistency with "Free Shipping" logic if > 500)
    # Note: This overrides client-side calculations to ensure security
    if order_data.subtotal < 500:
        order_data.shipping = 50.0
    else:
        order_data.shipping = 0.0
    
    # Recalculate total to ensure consistency
    order_data.total = order_data.subtotal + order_data.tax + order_data.shipping

    razorpay_order_id = None
    if order_data.payment_method == "razorpay":
        if razorpay_client is None:
            raise HTTPException(status_code=400, detail="Razorpay not configured")
        amount_paise = int(order_data.total * 100)
        rp_order = razorpay_client.order.create({
            "amount": amount_paise,
            "currency": "INR",
            "receipt": order_number,
            "payment_capture": 1
        })
        razorpay_order_id = rp_order.get("id")
    
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
        razorpay_order_id=razorpay_order_id,
        status="pending_payment" if order_data.payment_method == "razorpay" else "placed"
    )
    
    order_dict = order.model_dump()
    order_dict['created_at'] = order_dict['created_at'].isoformat()
    order_dict['updated_at'] = order_dict['updated_at'].isoformat()
    
    result = await db.orders.insert_one(order_dict)
    
    # Generate invoice PDF for all orders
    label_path = generate_order_label(order_dict)
    if label_path:
        update_fields: Dict[str, Any] = {"invoice_url": label_path}
        # Preserve existing behavior for COD orders by also setting label_url
        if order_data.payment_method == "cod":
            update_fields["label_url"] = label_path
        await db.orders.update_one(
            {"_id": result.inserted_id},
            {"$set": update_fields}
        )
    
    if order_data.payment_method == "cod":
        await create_notification(
            type="order_placed",
            message=f"New order placed: {order_number}",
            order_id=order.id
        )

        user_doc = await db.users.find_one({"id": order.user_id}, {"_id": 0})
        if user_doc:
            order_dict["user_email"] = user_doc.get("email")
            if not order_dict.get("shipping_address"):
                order_dict["shipping_address"] = {
                    "name": user_doc.get("name"),
                    "phone": user_doc.get("phone"),
                }
        background_tasks.add_task(
            _send_order_status_email,
            order_dict,
            None,
            "placed",
        )

        await db.cart.delete_many({"user_id": current_user['id']})
    
    # Convert ObjectId to string to make it JSON serializable
    response_dict = {**order_dict, "razorpay_key_id": RAZORPAY_KEY_ID}
    response_dict["_id"] = str(result.inserted_id)
    
    return response_dict

@api_router.post("/orders/{order_id}/payment-success")
async def payment_success(
    order_id: str,
    razorpay_payment_id: str,
    background_tasks: BackgroundTasks,
    razorpay_order_id: Optional[str] = None,
    razorpay_signature: Optional[str] = None,
    current_user: Dict = Depends(get_current_user),
):
    if razorpay_signature and razorpay_order_id and RAZORPAY_KEY_SECRET:
        payload = f"{razorpay_order_id}|{razorpay_payment_id}".encode()
        expected = hmac.new(RAZORPAY_KEY_SECRET.encode(), payload, hashlib.sha256).hexdigest()
        if expected != razorpay_signature:
            raise HTTPException(status_code=400, detail="Invalid payment signature")

    order = await db.orders.find_one({"id": order_id, "user_id": current_user["id"]})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    previous_status = order.get("status")

    await db.orders.update_one(
        {"id": order_id, "user_id": current_user["id"]},
        {
            "$set": {
                "payment_status": "completed",
                "razorpay_payment_id": razorpay_payment_id,
                "razorpay_order_id": razorpay_order_id,
                "status": "placed",
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        }
    )

    updated_order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if updated_order:
        user_doc = await db.users.find_one({"id": updated_order["user_id"]}, {"_id": 0})
        if user_doc:
            updated_order["user_email"] = user_doc.get("email")
            if not updated_order.get("shipping_address"):
                updated_order["shipping_address"] = {
                    "name": user_doc.get("name"),
                    "phone": user_doc.get("phone"),
                }
        background_tasks.add_task(_send_order_status_email, updated_order, previous_status, "placed")
    
    await create_notification(
        type="order_placed",
        message=f"New order placed (Prepaid): {order_id}",
        order_id=order_id
    )
    
    await db.cart.delete_many({"user_id": current_user["id"]})

    return {"message": "Payment successful", "order_id": order_id}

@api_router.get("/orders")
async def get_orders(current_user: Dict = Depends(get_current_user)):
    orders = await db.orders.find(
        {
            "user_id": current_user['id'],
            "status": {"$nin": ["pending_payment"]}
        },
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
    
    # Remove the type field and return clean settings
    settings.pop('type', None)
    settings.pop('_id', None)
    return settings

@api_router.put("/settings/store")
async def update_store_settings(
    settings: StoreSettings,
    admin: dict = Depends(get_current_admin)
):
    """Update store settings"""
    # Create audit log
    await create_audit_log(
        admin["id"],
        admin.get("username", "admin"),
        "update_store_settings",
        f"Store settings updated: {settings.dict()}"
    )
    
    result = await db.settings.update_one(
        {"type": "store"},
        {"$set": settings.dict()},
        upsert=True
    )
    return {"status": "success", "updated": result.modified_count > 0}

# Admin profile model (updated to match frontend)
class AdminProfile(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None

@api_router.get("/admin/profile")
async def get_admin_profile(admin: dict = Depends(get_current_admin)):
    """Get admin profile"""
    admin_data = await db.admins.find_one({"id": admin["id"]})
    if not admin_data:
        raise HTTPException(status_code=404, detail="Admin not found")
    
    return {
        "id": admin_data.get("id", ""),
        "username": admin_data.get("username", ""),
        "name": admin_data.get("name", ""),
        "email": admin_data.get("email", ""),
        "phone": admin_data.get("phone", ""),
        "address": admin_data.get("address", ""),
        "role": admin_data.get("role", "")
    }

@api_router.put("/admin/profile")
async def update_admin_profile(
    profile: AdminProfile,
    admin: dict = Depends(get_current_admin)
):
    """Update admin profile"""
    # Create audit log
    await create_audit_log(
        admin["id"],
        admin.get("username", "admin"),
        "update_admin_profile",
        f"Admin profile updated: {profile.dict()}"
    )
    
    result = await db.admins.update_one(
        {"id": admin["id"]},
        {"$set": profile.dict()}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Admin not found")
    
    return {"status": "success"}

# Password change model
class PasswordChange(BaseModel):
    current_password: str
    new_password: str

@api_router.post("/admin/change-password")
async def change_admin_password(
    password_data: PasswordChange,
    admin: dict = Depends(get_current_admin)
):
    """Change admin password"""
    # Verify current password
    admin_data = await db.admins.find_one({"id": admin["id"]})
    if not admin_data:
        raise HTTPException(status_code=404, detail="Admin not found")
    
    if not verify_password(password_data.current_password, admin_data["password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Hash new password
    hashed_password = hash_password(password_data.new_password)
    
    # Create audit log
    await create_audit_log(
        admin["id"],
        admin.get("username", "admin"),
        "change_password",
        "Admin password changed"
    )
    
    # Update password
    await db.admins.update_one(
        {"id": admin["id"]},
        {"$set": {"password": hashed_password}}
    )
    
    return {"status": "success"}

# Username change model
class UsernameChange(BaseModel):
    current_password: str
    new_username: str

@api_router.post("/admin/change-username")
async def change_admin_username(
    username_data: UsernameChange,
    admin: dict = Depends(get_current_admin)
):
    """Change admin username"""
    # Verify current password
    admin_data = await db.admins.find_one({"id": admin["id"]})
    if not admin_data:
        raise HTTPException(status_code=404, detail="Admin not found")
    
    if not verify_password(username_data.current_password, admin_data["password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Check if username already exists
    existing = await db.admins.find_one({"username": username_data.new_username})
    if existing and existing["id"] != admin["id"]:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Create audit log
    await create_audit_log(
        admin["id"],
        admin_data["username"],
        "change_username",
        f"Username changed from {admin_data['username']} to {username_data.new_username}"
    )
    
    # Update username
    await db.admins.update_one(
        {"id": admin["id"]},
        {"$set": {"username": username_data.new_username}}
    )
    
    # Generate new token with updated username
    new_token = create_token(admin["id"], username_data.new_username)
    
    return {"status": "success", "token": new_token, "username": username_data.new_username}

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
    data: OrderStatusUpdate,
    background_tasks: BackgroundTasks,
    admin: Dict = Depends(get_current_admin),
):
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    status = data.status

    updates: Dict[str, Any] = {
        "status": status,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    if data.tracking_id is not None:
        updates["tracking_id"] = data.tracking_id
    if data.courier_name is not None:
        updates["courier_name"] = data.courier_name
    if data.tracking_url is not None:
        updates["tracking_url"] = data.tracking_url
    if data.cancellation_reason is not None:
        updates["cancellation_reason"] = data.cancellation_reason

    await db.orders.update_one(
        {"id": order_id},
        {
            "$set": updates
        }
    )

    if status == "shipped" and order["status"] != "shipped":
        for item in order["items"]:
            product_id = item["product_id"]
            quantity = item["quantity"]
            product = await db.products.find_one({"id": product_id})
            if product:
                current_sold_count = product.get('sold_count', 0)
                new_sold_count = current_sold_count + quantity
                await db.products.update_one(
                    {"id": product_id},
                    {
                        "$inc": {
                            "stock": -quantity
                        },
                        "$set": {
                            "sold_count": new_sold_count
                        }
                    }
                )

    if status == "delivered" and order["status"] != "delivered":
        await create_notification(
            type="order_delivered",
            message=f"Order delivered: {order_id}",
            order_id=order_id
        )

    updated_order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if updated_order:
        user_doc = await db.users.find_one({"id": updated_order["user_id"]}, {"_id": 0})
        if user_doc:
            updated_order["user_email"] = user_doc.get("email")
            if not updated_order.get("shipping_address"):
                updated_order["shipping_address"] = {
                    "name": user_doc.get("name"),
                    "phone": user_doc.get("phone"),
                }
        background_tasks.add_task(
            _send_order_status_email,
            updated_order,
            order.get("status"),
            status,
        )

    return {"message": "Order status updated", "status": status}

@api_router.post("/admin/orders/{order_id}/confirm-shipping")
async def confirm_order_shipping(
    order_id: str,
    admin: Dict = Depends(get_current_admin)
):
    """
    Confirm order and create shipping with Delhivery
    """
    if not delhivery_client:
        raise HTTPException(status_code=400, detail="Delhivery client not initialized")

    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.get("delhivery_waybill"):
         return {"message": "Shipping already created", "waybill": order.get("delhivery_waybill")}

    try:
        # 1. Get Waybill
        # We fetch it explicitly to ensure we have it for DB before/during creation
        waybill = delhivery_client.fetch_waybill()
        print(f"Fetched Waybill: {waybill}")

        if not waybill:
             raise Exception("Failed to fetch valid waybill from Delhivery")

        # 2. Create Shipment (CMU)
        addr = order.get("shipping_address", {})
        items = order.get("items", [])
        
        # Call create_shipment
        create_resp = delhivery_client.create_shipment(
            order=order,
            user={"name": addr.get("name"), "phone": addr.get("phone")}, # Placeholder
            address=addr,
            items=items,
            waybill=waybill
        )
        
        print(f"Create Shipment Response: {create_resp}")
             
        # 3. Schedule Pickup
        pickup_time = (datetime.now() + timedelta(days=1)).strftime("%H:%M:%S")
        pickup_date = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        
        pickup_success = False
        pickup_message = ""
        try:
             pickup_resp = delhivery_client.schedule_pickup(
                 pickup_time=pickup_time,
                 pickup_date=pickup_date,
                 pickup_location=delhivery_client.warehouse_name,
                 expected_package_count=1
             )
             print(f"Pickup schedule response: {pickup_resp}")
             pickup_success = True
        except requests.exceptions.HTTPError as e:
             try:
                error_json = e.response.json()
                error_detail = str(error_json)
             except:
                error_detail = e.response.text if e.response else str(e)
             
             print(f"Pickup schedule error (HTTP): {error_detail}")
             pickup_message = f"Pickup failed: {error_detail}"
        except Exception as e:
             print(f"Pickup schedule error: {e}")
             pickup_message = f"Pickup failed: {str(e)}"

        # Update Order
        await db.orders.update_one(
            {"id": order_id},
            {
                "$set": {
                    "status": "confirmed",
                    "shipping_status": "shipped", 
                    "delhivery_waybill": waybill,
                    "tracking_id": waybill,
                    "courier_name": "Delhivery",
                    "label_url": f"/api/admin/orders/{order_id}/label" 
                }
            }
        )
        
        # Create Notification
        await create_notification(
            type="order_shipped",
            message=f"Order {order.get('order_number')} confirmed and shipping label generated.",
            order_id=order_id
        )

        return {
            "success": True, 
            "waybill": waybill,
            "pickup_scheduled": pickup_success,
            "warning": pickup_message if not pickup_success else None
        }

    except requests.exceptions.HTTPError as e:
        error_detail = str(e)
        if e.response is not None:
            try:
                error_json = e.response.json()
                if isinstance(error_json, dict):
                    messages = []
                    for k, v in error_json.items():
                        messages.append(f"{k}: {v}")
                    error_detail = " | ".join(messages)
                else:
                    error_detail = str(error_json)
            except ValueError:
                error_detail = e.response.text or str(e)
        
        print(f"Delhivery API Error: {error_detail}")
        status_code = e.response.status_code if e.response else 500
        raise HTTPException(status_code=status_code, detail=f"Delhivery Error: {error_detail}")

    except Exception as e:
        print(f"Delhivery Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/admin/orders/{order_id}/label")
async def get_delhivery_label(order_id: str, admin: Dict = Depends(get_current_admin)):
    if not delhivery_client:
        raise HTTPException(status_code=400, detail="Delhivery client not initialized")

    order = await db.orders.find_one({"id": order_id})
    if not order or not order.get("delhivery_waybill"):
        raise HTTPException(status_code=404, detail="Label not found")
        
    wb = order.get("delhivery_waybill")
    
    try:
        pdf_content = delhivery_client.get_label_pdf(wb)
        
        # Validate content looks like PDF
        if pdf_content.startswith(b"%PDF"):
            from fastapi.responses import Response
            return Response(content=pdf_content, media_type="application/pdf")
        else:
            # Try to parse as JSON to see if it's an error message
            try:
                error_json = json.loads(pdf_content)
                detail = error_json.get("error") or str(error_json)
                raise HTTPException(status_code=400, detail=f"Delhivery Error: {detail}")
            except:
                # If not JSON, return as text if small, else generic error
                raise HTTPException(status_code=400, detail="Invalid label response from Delhivery")
                
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/admin/orders/{order_id}/invoice")
async def get_order_invoice(order_id: str, admin: Dict = Depends(get_current_admin)):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    label_path = order.get("invoice_url")
    
    # Sanitize label_path if it was stored incorrectly as a list/tuple (legacy bug fix)
    if isinstance(label_path, (list, tuple)):
        label_path = label_path[0]
    
    # Check if label_url exists and is a valid file path (not an API endpoint)
    if not label_path:
        candidate_url = order.get("label_url")
        if candidate_url and not candidate_url.startswith("/api/"):
            label_path = candidate_url

    if not label_path:
        label_path, error = generate_order_label(order)
        if not label_path:
            raise HTTPException(status_code=500, detail=f"Failed to generate invoice: {error or 'PDF service unavailable'}")
        await db.orders.update_one(
            {"id": order_id},
            {"$set": {"invoice_url": label_path}},
        )

    path = label_path
    path_obj = Path(path)
    
    if path_obj.is_absolute():
        file_path = path_obj.resolve()
    else:
        if path.startswith("/uploads/"):
            relative_path = path[9:]
        elif path.startswith("uploads/"):
            relative_path = path[8:]
        else:
            relative_path = path
        file_path = (uploads_dir / relative_path).resolve()

    try:
        file_path.relative_to(uploads_dir)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid invoice path")

    if not file_path.exists():
        new_label_path, error = generate_order_label(order)
        if not new_label_path:
            raise HTTPException(status_code=500, detail=f"Failed to generate invoice: {error or 'Unknown error'}")
        await db.orders.update_one(
            {"id": order_id},
            {"$set": {"invoice_url": new_label_path}},
        )
        
        path = new_label_path
        path_obj = Path(path)
        
        if path_obj.is_absolute():
            file_path = path_obj.resolve()
        else:
            if path.startswith("/uploads/"):
                relative_path = path[9:]
            elif path.startswith("uploads/"):
                relative_path = path[8:]
            else:
                relative_path = path
            file_path = (uploads_dir / relative_path).resolve()
            
        if not file_path.exists():
            raise HTTPException(status_code=500, detail="Invoice file not found")

    return FileResponse(file_path, media_type="application/pdf", filename=os.path.basename(file_path))

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
        file_path = uploads_dir / filename
        
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

        for file in files:
            contents = await file.read()
            filename = f"{uuid.uuid4()}_{file.filename}"
            file_path = uploads_dir / filename

            with open(file_path, "wb") as f:
                f.write(contents)

            uploaded_files.append({
                "filename": filename,
                "path": f"/uploads/{filename}"
            })

        return {"files": uploaded_files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/image")
async def get_optimized_image(path: str, w: Optional[int] = None, h: Optional[int] = None, q: int = 85, fit: str = "contain"):
    try:
        # URL decode the path
        path = unquote(path)
        
        if not path:
            # Return a tiny transparent PNG to avoid ORB on non-image responses
            buf = io.BytesIO()
            Image.new("RGBA", (1, 1), (0, 0, 0, 0)).save(buf, format="PNG")
            headers = {"Cross-Origin-Resource-Policy": "cross-origin", "Cache-Control": "no-store"}
            return Response(content=buf.getvalue(), media_type="image/png", headers=headers)
        
        if path.startswith("/uploads/"):
            relative_path = path[9:]
        elif path.startswith("uploads/"):
            relative_path = path[8:]
        elif not path.startswith("/"):
            relative_path = path
        else:
            logging.warning(f"Image path doesn't match expected format: {path}")
            buf = io.BytesIO()
            Image.new("RGBA", (1, 1), (0, 0, 0, 0)).save(buf, format="PNG")
            headers = {"Cross-Origin-Resource-Policy": "cross-origin", "Cache-Control": "no-store"}
            return Response(content=buf.getvalue(), media_type="image/png", headers=headers)
        
        source_path = uploads_dir / relative_path
        
        # Normalize the path to prevent directory traversal attacks
        source_path = source_path.resolve()
        
        # Security check: ensure the path is within uploads directory
        try:
            source_path.relative_to(uploads_dir)
        except ValueError:
            # Path is outside uploads directory - security issue
            logging.warning(f"Attempted directory traversal detected: {path}")
            buf = io.BytesIO()
            Image.new("RGBA", (1, 1), (0, 0, 0, 0)).save(buf, format="PNG")
            headers = {"Cross-Origin-Resource-Policy": "cross-origin", "Cache-Control": "no-store"}
            return Response(content=buf.getvalue(), media_type="image/png", headers=headers)
        
        if not source_path.exists():
            logging.warning(f"Image not found: {source_path}")
            return Response(status_code=404, content=b"", media_type="image/png", headers={"Cross-Origin-Resource-Policy": "cross-origin", "Cache-Control": "no-store"})
        
        # Create cache directory if it doesn't exist
        cache_dir = uploads_dir / "cache"
        os.makedirs(cache_dir, exist_ok=True)
        
        # Use the full relative path (including subdirectories) for cache key
        cache_key = f"{relative_path}:{w}:{h}:{q}:{fit}"
        cache_name = hashlib.sha256(cache_key.encode()).hexdigest()[:24] + ".jpg"
        cache_path = cache_dir / cache_name
        
        if cache_path.exists():
            resp = FileResponse(str(cache_path), media_type="image/jpeg")
            resp.headers["Cross-Origin-Resource-Policy"] = "cross-origin"
            return resp
        
        # Open and process the image
        img = Image.open(str(source_path))
        if not w and not h:
            w = 800
        if fit == "cover" and w and h:
            img = ImageOps.fit(img, (w, h))
        else:
            target_w = w or img.width
            target_h = h or img.height
            img = ImageOps.contain(img, (target_w, target_h))
        
        # Save to cache
        with open(cache_path, "wb") as f:
            img.convert("RGB").save(f, format="JPEG", quality=q, optimize=True)
        
        resp = FileResponse(str(cache_path), media_type="image/jpeg")
        resp.headers["Cross-Origin-Resource-Policy"] = "cross-origin"
        return resp
    except HTTPException:
        raise
    except Exception as e:
        # Log the error for debugging
        logging.error(f"Error processing image {path}: {str(e)}", exc_info=True)
        # On unexpected errors, return a tiny transparent PNG to avoid ORB
        try:
            buf = io.BytesIO()
            Image.new("RGBA", (1, 1), (0, 0, 0, 0)).save(buf, format="PNG")
            headers = {"Cross-Origin-Resource-Policy": "cross-origin", "Cache-Control": "no-store"}
            return Response(content=buf.getvalue(), media_type="image/png", headers=headers)
        except Exception:
            # As a last resort, return empty bytes with image/png
            return Response(content=b"", media_type="image/png", headers={"Cross-Origin-Resource-Policy": "cross-origin", "Cache-Control": "no-store"})

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

    
    return {"message": "Profile updated successfully"}


# ==================== Store Settings Routes ====================

    
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

@api_router.post("/analytics/events")
async def track_site_analytics_event(
    event: SiteAnalyticsEventCreate,
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_security)
):
    try:
        user_id = None
        if credentials and credentials.credentials:
            try:
                payload = jose_jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
                user_id = payload.get("user_id")
            except Exception:
                user_id = None
        metadata = event.metadata or {}
        metadata = dict(metadata)
        metadata["user_agent"] = request.headers.get("user-agent")
        if request.client:
            metadata["ip"] = request.client.host
        analytics_event = SiteAnalyticsEvent(
            user_id=user_id,
            session_id=event.session_id,
            event_type=event.event_type,
            page=event.page,
            product_id=event.product_id,
            metadata=metadata
        )
        event_dict = analytics_event.model_dump()
        created_at = event_dict.get("created_at")
        if isinstance(created_at, datetime):
            event_dict["created_at"] = created_at.isoformat()
        if db is not None:
            await db.site_analytics.insert_one(event_dict)
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error tracking analytics event: {str(e)}")

@api_router.get("/admin/analytics/site")
async def get_site_analytics(
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    admin: Dict = Depends(get_current_admin)
):
    try:
        from_dt = datetime.fromisoformat(from_date.replace('Z', '+00:00')) if from_date else datetime.now(timezone.utc) - timedelta(days=30)
        to_dt = datetime.fromisoformat(to_date.replace('Z', '+00:00')) if to_date else datetime.now(timezone.utc)
        date_filter = {
            "created_at": {"$gte": from_dt.isoformat(), "$lte": to_dt.isoformat()}
        }
        total_visits = await db.site_analytics.count_documents({
            **date_filter,
            "event_type": "page_view"
        })
        total_product_views = await db.site_analytics.count_documents({
            **date_filter,
            "event_type": "product_view"
        })
        total_clicks = await db.site_analytics.count_documents({
            **date_filter,
            "event_type": "click"
        })
        traffic_pipeline = [
            {"$match": date_filter},
            {"$group": {
                "_id": {
                    "year": {"$year": {"$dateFromString": {"dateString": "$created_at"}}},
                    "month": {"$month": {"$dateFromString": {"dateString": "$created_at"}}},
                    "day": {"$dayOfMonth": {"$dateFromString": {"dateString": "$created_at"}}}
                },
                "visits": {
                    "$sum": {
                        "$cond": [
                            {"$eq": ["$event_type", "page_view"]},
                            1,
                            0
                        ]
                    }
                },
                "productViews": {
                    "$sum": {
                        "$cond": [
                            {"$eq": ["$event_type", "product_view"]},
                            1,
                            0
                        ]
                    }
                },
                "clicks": {
                    "$sum": {
                        "$cond": [
                            {"$eq": ["$event_type", "click"]},
                            1,
                            0
                        ]
                    }
                }
            }},
            {"$project": {
                "period": {
                    "$dateFromParts": {
                        "year": "$_id.year",
                        "month": "$_id.month",
                        "day": "$_id.day"
                    }
                },
                "visits": 1,
                "productViews": 1,
                "clicks": 1
            }},
            {"$sort": {"period": 1}}
        ]
        traffic_over_time = await db.site_analytics.aggregate(traffic_pipeline).to_list(365)
        for item in traffic_over_time:
            period = item.get("period")
            if isinstance(period, datetime):
                item["period"] = period.strftime("%Y-%m-%d")
        product_pipeline = [
            {"$match": {
                **date_filter,
                "product_id": {"$ne": None}
            }},
            {"$group": {
                "_id": "$product_id",
                "visits": {"$sum": 1}
            }},
            {"$sort": {"visits": -1}},
            {"$limit": 50}
        ]
        product_stats = await db.site_analytics.aggregate(product_pipeline).to_list(50)
        product_ids = [item["_id"] for item in product_stats if item.get("_id")]
        products_cursor = db.products.find(
            {"id": {"$in": product_ids}},
            {"_id": 0, "id": 1, "title": 1}
        )
        products_list = await products_cursor.to_list(len(product_ids) or 50)
        products_map = {p["id"]: p for p in products_list}
        product_visits = []
        for item in product_stats:
            product_id = item.get("_id")
            if not product_id:
                continue
            product = products_map.get(product_id)
            if not product:
                continue
            product_visits.append({
                "productId": product_id,
                "title": product.get("title", "Unknown Product"),
                "visits": item.get("visits", 0)
            })
        page_pipeline = [
            {"$match": date_filter},
            {"$group": {
                "_id": "$page",
                "visits": {"$sum": 1}
            }},
            {"$project": {
                "page": "$_id",
                "visits": 1
            }},
            {"$sort": {"visits": -1}},
            {"$limit": 50}
        ]
        page_views = await db.site_analytics.aggregate(page_pipeline).to_list(50)
        most_viewed_products = product_visits[:10]
        return {
            "summary": {
                "totalVisits": total_visits,
                "totalProductViews": total_product_views,
                "totalClicks": total_clicks
            },
            "trafficOverTime": traffic_over_time,
            "productVisits": product_visits,
            "mostViewedProducts": most_viewed_products,
            "pageViews": page_views
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching site analytics: {str(e)}")

# ==================== Admin Analytics Routes ====================

@api_router.get("/admin/analytics/overview")
async def get_analytics_overview(
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    admin: Dict = Depends(get_current_admin)
):
    """Get analytics overview data"""
    try:
        from_dt = datetime.fromisoformat(from_date.replace('Z', '+00:00')) if from_date else datetime.now(timezone.utc) - timedelta(days=30)
        to_dt = datetime.fromisoformat(to_date.replace('Z', '+00:00')) if to_date else datetime.now(timezone.utc)
        
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
        
        # Performance metrics (run in parallel to reduce latency)
        total_products_task = db.products.count_documents({})
        featured_products_task = db.products.count_documents({"is_featured": True})
        low_stock_count_task = db.products.count_documents({"stock": {"$lt": 10}})
        
        total_products, featured_products, low_stock_count = await asyncio.gather(
            total_products_task,
            featured_products_task,
            low_stock_count_task
        )
        
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
            
            # Get product details in a single query to avoid per-product round trips
            product_ids = [item["_id"] for item in sales_data if item.get("_id")]
            products_cursor = db.products.find(
                {"id": {"$in": product_ids}},
                {"_id": 0, "id": 1, "title": 1, "images": 1, "color_images": 1}
            )
            products_list = await products_cursor.to_list(len(product_ids) or 10)
            for p in products_list:
                ensure_product_images(p)
            products_map = {p["id"]: p for p in products_list}
            
            top_selling = []
            for item in sales_data:
                product_id = item.get("_id")
                if not product_id:
                    continue
                
                product = products_map.get(product_id)
                if not product:
                    continue
                
                images = product.get("images") or []
                image_value = images[0] if isinstance(images, list) and images else ""
                
                top_selling.append({
                    "id": product_id,
                    "title": product.get("title", "Unknown Product"),
                    "images": image_value,
                    "quantitySold": item["quantitySold"],
                    "totalRevenue": item["totalRevenue"]
                })
            
            # If no products found, return empty list
            if not top_selling:
                top_selling = []
                
        except Exception as e:
            print(f"Error in top selling pipeline: {str(e)}")
            top_selling = []
        
        # Low stock products
        low_stock = await db.products.find(
            {"stock": {"$lt": 10}},
            {"_id": 0, "id": 1, "title": 1, "images": 1, "color_images": 1, "stock": 1}
        ).to_list(20)
        
        # Add max stock for low stock items (assuming 50 as default max)
        for item in low_stock:
            ensure_product_images(item)
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
        total_products_for_dist = total_products
        
        async def count_price_range(range_def):
            if range_def["max"] == float('inf'):
                return await db.products.count_documents({"price": {"$gte": range_def["min"]}})
            return await db.products.count_documents({
                "price": {"$gte": range_def["min"], "$lt": range_def["max"]}
            })
        
        counts = await asyncio.gather(*(count_price_range(r) for r in price_ranges))
        
        for range_def, count in zip(price_ranges, counts):
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
        from_dt = datetime.fromisoformat(from_date.replace('Z', '+00:00')) if from_date else datetime.now(timezone.utc) - timedelta(days=30)
        to_dt = datetime.fromisoformat(to_date.replace('Z', '+00:00')) if to_date else datetime.now(timezone.utc)
        
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
        async def fetch_user_orders(user):
            user_orders = await db.orders.find(
                {"user_id": user["id"], "status": {"$ne": "cancelled"}},
                {"_id": 0, "total": 1, "created_at": 1}
            ).to_list(1000)
            
            user["orderCount"] = len(user_orders)
            user["totalSpent"] = sum(order["total"] for order in user_orders)
            user["lastOrderDate"] = max([order["created_at"] for order in user_orders]) if user_orders else None
            return user

        # Execute order fetching in parallel
        await asyncio.gather(*[fetch_user_orders(user) for user in recent_users])
        
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
        from_dt = datetime.fromisoformat(from_date.replace('Z', '+00:00')) if from_date else datetime.now(timezone.utc) - timedelta(days=30)
        to_dt = datetime.fromisoformat(to_date.replace('Z', '+00:00')) if to_date else datetime.now(timezone.utc)
        
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
                "percentage": {"$multiply": [{"$divide": ["$revenue", total_revenue]}, 100]} if total_revenue > 0 else 0
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
async def get_analytics_export(
    data_type: str,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    admin: Dict = Depends(get_current_admin)
):
    """Export analytics data to CSV"""
    try:
        from_dt = datetime.fromisoformat(from_date.replace('Z', '+00:00')) if from_date else datetime.now(timezone.utc) - timedelta(days=30)
        to_dt = datetime.fromisoformat(to_date.replace('Z', '+00:00')) if to_date else datetime.now(timezone.utc)
        
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

# ==================== Notification Routes ====================

@api_router.get("/admin/notifications")
async def get_notifications(
    skip: int = 0,
    limit: int = 50,
    admin: Dict = Depends(get_current_admin)
):
    try:
        cursor = db.notifications.find({}).sort("created_at", -1).skip(skip).limit(limit)
        notifications = await cursor.to_list(length=limit)
        
        unread_count = await db.notifications.count_documents({"is_read": False})
        
        for notif in notifications:
            if "_id" in notif:
                del notif["_id"]
            if isinstance(notif.get("created_at"), str):
                notif["created_at"] = datetime.fromisoformat(notif["created_at"])

            if notif.get("type") == "return_requested" and notif.get("order_id"):
                order = await db.orders.find_one({"id": notif["order_id"]}, {"_id": 0})
                latest_return = await db.returns.find_one(
                    {"order_id": notif["order_id"]},
                    sort=[("created_at", -1)]
                )
                product = None
                if latest_return:
                    product = await db.products.find_one(
                        {"id": latest_return.get("product_id")},
                        {"_id": 0}
                    )

                notif["order_number"] = order.get("order_number") if order else None
                notif["order_total"] = order.get("total") if order else None
                notif["product_name"] = product.get("title") if product else None
                notif["product_image"] = (
                    (product.get("images") or [None])[0]
                    if product and product.get("images")
                    else None
                )
                notif["return_reason"] = latest_return.get("reason") if latest_return else None
                
        return {
            "notifications": notifications,
            "unread_count": unread_count
        }
    except Exception as e:
        print(f"Error fetching notifications: {e}")
        return {"notifications": [], "unread_count": 0}

@api_router.put("/admin/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    admin: Dict = Depends(get_current_admin)
):
    try:
        result = await db.notifications.update_one(
            {"id": notification_id},
            {"$set": {"is_read": True}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Notification not found")
            
        return {"status": "success"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating notification: {e}")

@api_router.put("/admin/notifications/read-all")
async def mark_all_notifications_read(
    admin: Dict = Depends(get_current_admin)
):
    try:
        await db.notifications.update_many(
            {"is_read": False},
            {"$set": {"is_read": True}}
        )
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating notifications: {e}")




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
    if client:
        client.close()
