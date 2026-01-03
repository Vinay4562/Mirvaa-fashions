import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import uuid
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env', encoding='utf-8')

mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'mirvaa_fashions')

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

async def create_test_admin():
    print(f"Connecting to {mongo_url}, DB: {db_name}")
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    username = "test_admin"
    password = "password123"
    hashed = hash_password(password)
    
    admin_data = {
        "id": str(uuid.uuid4()),
        "username": username,
        "password": hashed,
        "role": "admin",
        "created_at": "2025-01-01T00:00:00"
    }
    
    # Update if exists or insert
    await db.admins.update_one(
        {"username": username},
        {"$set": admin_data},
        upsert=True
    )
    
    print(f"Admin '{username}' created/updated with password '{password}'")

if __name__ == "__main__":
    asyncio.run(create_test_admin())
