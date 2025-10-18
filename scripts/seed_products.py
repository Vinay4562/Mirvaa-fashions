import asyncio
import os
import sys
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import uuid

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'backend'))
from dotenv import load_dotenv

# Load env
ROOT_DIR = Path(__file__).parent.parent / 'backend'
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']

sample_products = [
    {
        "id": str(uuid.uuid4()),
        "title": "Elegant Silk Saree",
        "description": "Beautiful handwoven silk saree with traditional motifs. Perfect for weddings and special occasions. Comes with matching blouse piece.",
        "category": "Sarees",
        "brand": "Mirvaa Collection",
        "price": 2499,
        "mrp": 4999,
        "discount_percent": 50,
        "images": [
            "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800",
            "https://images.unsplash.com/photo-1583391733981-5efe69c574c5?w=800"
        ],
        "sizes": ["Free Size"],
        "colors": ["Red", "Gold"],
        "stock": 15,
        "sku": "SAR001",
        "tags": ["trending", "wedding", "silk"],
        "rating": 4.5,
        "reviews_count": 24,
        "is_featured": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Cotton Printed T-Shirt",
        "description": "Comfortable 100% cotton t-shirt with trendy prints. Perfect for casual wear. Machine washable.",
        "category": "T-Shirts",
        "brand": "Urban Style",
        "price": 499,
        "mrp": 999,
        "discount_percent": 50,
        "images": [
            "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800",
            "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800"
        ],
        "sizes": ["S", "M", "L", "XL", "XXL"],
        "colors": ["White", "Black", "Navy"],
        "stock": 50,
        "sku": "TSH001",
        "tags": ["casual", "cotton", "trending"],
        "rating": 4.2,
        "reviews_count": 156,
        "is_featured": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Formal Shirt",
        "description": "Premium quality formal shirt perfect for office and formal occasions. Wrinkle-free fabric.",
        "category": "Shirts",
        "brand": "Executive",
        "price": 899,
        "mrp": 1799,
        "discount_percent": 50,
        "images": [
            "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800"
        ],
        "sizes": ["S", "M", "L", "XL"],
        "colors": ["White", "Blue", "Grey"],
        "stock": 30,
        "sku": "SHR001",
        "tags": ["formal", "office"],
        "rating": 4.3,
        "reviews_count": 89,
        "is_featured": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Cozy Hoodie",
        "description": "Warm and comfortable hoodie perfect for winter. Made with premium fleece material.",
        "category": "Hoodies",
        "brand": "Comfort Wear",
        "price": 1299,
        "mrp": 2499,
        "discount_percent": 48,
        "images": [
            "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800"
        ],
        "sizes": ["S", "M", "L", "XL"],
        "colors": ["Black", "Grey", "Navy"],
        "stock": 25,
        "sku": "HOD001",
        "tags": ["winter", "casual"],
        "rating": 4.6,
        "reviews_count": 67,
        "is_featured": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Gold Plated Necklace",
        "description": "Elegant gold plated necklace with intricate design. Perfect for all occasions.",
        "category": "Jewelry",
        "brand": "Jewel House",
        "price": 1999,
        "mrp": 3999,
        "discount_percent": 50,
        "images": [
            "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800"
        ],
        "sizes": ["Free Size"],
        "colors": ["Gold"],
        "stock": 20,
        "sku": "JWL001",
        "tags": ["jewelry", "gold", "traditional"],
        "rating": 4.7,
        "reviews_count": 43,
        "is_featured": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Floral Maxi Dress",
        "description": "Beautiful floral print maxi dress. Perfect for summer outings and parties.",
        "category": "Ladies Dresses",
        "brand": "Fashion Nova",
        "price": 1499,
        "mrp": 2999,
        "discount_percent": 50,
        "images": [
            "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800"
        ],
        "sizes": ["S", "M", "L", "XL"],
        "colors": ["Blue", "Pink", "Yellow"],
        "stock": 35,
        "sku": "DRS001",
        "tags": ["summer", "party", "floral"],
        "rating": 4.4,
        "reviews_count": 92,
        "is_featured": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Kids Cartoon T-Shirt",
        "description": "Fun cartoon print t-shirt for kids. Soft and comfortable fabric.",
        "category": "Kids Wear",
        "brand": "Little Stars",
        "price": 399,
        "mrp": 799,
        "discount_percent": 50,
        "images": [
            "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800"
        ],
        "sizes": ["2-3Y", "4-5Y", "6-7Y", "8-9Y"],
        "colors": ["Red", "Blue", "Yellow"],
        "stock": 40,
        "sku": "KID001",
        "tags": ["kids", "cartoon"],
        "rating": 4.5,
        "reviews_count": 78,
        "is_featured": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Men's Denim Jeans",
        "description": "Classic fit denim jeans. Comfortable and durable.",
        "category": "Men's Wear",
        "brand": "Denim Co",
        "price": 1199,
        "mrp": 2399,
        "discount_percent": 50,
        "images": [
            "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800"
        ],
        "sizes": ["30", "32", "34", "36", "38"],
        "colors": ["Blue", "Black"],
        "stock": 45,
        "sku": "MEN001",
        "tags": ["denim", "jeans"],
        "rating": 4.3,
        "reviews_count": 134,
        "is_featured": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Designer Kurti",
        "description": "Stylish designer kurti with beautiful embroidery. Perfect for casual and semi-formal occasions.",
        "category": "Ladies Dresses",
        "brand": "Ethnic Wear",
        "price": 799,
        "mrp": 1599,
        "discount_percent": 50,
        "images": [
            "https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=800"
        ],
        "sizes": ["S", "M", "L", "XL"],
        "colors": ["Pink", "Blue", "Green"],
        "stock": 28,
        "sku": "KRT001",
        "tags": ["ethnic", "kurti"],
        "rating": 4.6,
        "reviews_count": 56,
        "is_featured": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Casual Polo Shirt",
        "description": "Classic polo shirt perfect for casual outings. Breathable fabric.",
        "category": "Shirts",
        "brand": "Sport Line",
        "price": 699,
        "mrp": 1399,
        "discount_percent": 50,
        "images": [
            "https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800"
        ],
        "sizes": ["S", "M", "L", "XL", "XXL"],
        "colors": ["Navy", "White", "Green"],
        "stock": 42,
        "sku": "POL001",
        "tags": ["casual", "polo"],
        "rating": 4.1,
        "reviews_count": 72,
        "is_featured": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
]

async def seed_database():
    print("Connecting to MongoDB...")
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    try:
        # Clear existing products
        print("Clearing existing products...")
        await db.products.delete_many({})
        
        # Insert sample products
        print(f"Inserting {len(sample_products)} sample products...")
        await db.products.insert_many(sample_products)
        
        print(f"✓ Successfully seeded {len(sample_products)} products!")
        
        # Display some stats
        total = await db.products.count_documents({})
        featured = await db.products.count_documents({"is_featured": True})
        print(f"\nDatabase Stats:")
        print(f"  Total Products: {total}")
        print(f"  Featured Products: {featured}")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
    finally:
        client.close()
        print("\nDatabase connection closed.")

if __name__ == "__main__":
    asyncio.run(seed_database())
