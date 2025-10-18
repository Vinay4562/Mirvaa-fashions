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

cms_pages = [
    {
        "id": str(uuid.uuid4()),
        "slug": "privacy-policy",
        "title": "Privacy Policy",
        "meta_description": "Learn how Mirvaa Fashions collects, uses, and protects your personal information.",
        "content": """# Privacy Policy

**Last Updated:** October 2025

At Mirvaa Fashions, we are committed to protecting your privacy and ensuring the security of your personal information.

## Information We Collect

### Personal Information
- Name, email address, phone number
- Shipping and billing addresses
- Payment information (processed securely through Razorpay)
- Order history and preferences

### Automatically Collected Information
- IP address and browser type
- Device information
- Cookies and usage data
- Pages visited and time spent on site

## How We Use Your Information

We use the collected information for:
- Processing and fulfilling your orders
- Communicating about your orders and account
- Improving our products and services
- Sending promotional emails (with your consent)
- Preventing fraud and enhancing security
- Complying with legal obligations

## Information Sharing

We DO NOT sell or rent your personal information to third parties. We may share your information with:

- **Payment processors** (Razorpay) for transaction processing
- **Shipping partners** for order delivery
- **Legal authorities** when required by law

## Data Security

We implement industry-standard security measures including:
- SSL/TLS encryption for data transmission
- Secure password hashing
- Regular security audits
- Access controls and monitoring

## Your Rights

You have the right to:
- Access your personal data
- Correct inaccurate information
- Request deletion of your data
- Opt-out of marketing communications
- Withdraw consent at any time

## Cookies

We use cookies to:
- Remember your preferences
- Analyze site traffic
- Improve user experience

You can control cookies through your browser settings.

## Data Retention

We retain your personal information for as long as necessary to provide services and comply with legal obligations.

## Children's Privacy

Our services are not intended for children under 13. We do not knowingly collect information from children.

## Changes to Privacy Policy

We may update this policy periodically. We will notify you of significant changes via email or website notice.

## Contact Us

For privacy-related questions or to exercise your rights:
- Email: privacy@mirvaa.com
- Phone: +91-XXXXXXXXXX
- Address: [Business Address]

## Governing Law

This privacy policy is governed by the laws of India.""",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "slug": "return-policy",
        "title": "Return & Refund Policy",
        "meta_description": "Easy returns within 7 days of delivery. Learn about our return process and refund policy.",
        "content": """# Return & Refund Policy

**Effective Date:** October 2025

At Mirvaa Fashions, we want you to be completely satisfied with your purchase. If you're not happy with your order, we're here to help.

## Return Eligibility

### Timeline
- Returns must be initiated within **7 days** of delivery
- Products must be in original condition with all tags intact
- Items should be unworn, unwashed, and undamaged

### Eligible Items
✓ Clothing (Sarees, Shirts, T-Shirts, Dresses, etc.)
✓ Accessories (Jewelry, Scarves, etc.)
✓ Footwear (in original box)

### Non-Returnable Items
✗ Intimate wear and undergarments
✗ Customized or personalized products
✗ Items marked as "Final Sale"
✗ Jewelry with broken seals
✗ Products without original tags

## Return Process

### Step 1: Initiate Return
- Log in to your account
- Go to "My Orders"
- Select the item you want to return
- Click "Request Return" and select reason

### Step 2: Pack the Item
- Place the item in its original packaging
- Include the invoice/packing slip
- Seal the package securely

### Step 3: Schedule Pickup
- Our courier partner will contact you within 24-48 hours
- Keep the package ready for pickup
- No return shipping charges for eligible returns

### Step 4: Quality Check
- Items are inspected within 3-5 business days
- We verify the condition and eligibility

### Step 5: Refund Processing
- Approved refunds are processed within 7-10 business days
- Amount credited to original payment method

## Refund Methods

- **UPI/Cards/Wallets**: Refunded to source within 7-10 business days
- **Cash on Delivery**: Refunded via bank transfer (provide account details)

## Exchange Policy

Currently, we do not offer direct exchanges. Please return the item and place a new order for a different size/color.

## Damaged or Defective Items

If you receive a damaged or defective product:
- Contact us within 48 hours of delivery
- Provide clear photos of the defect
- We'll arrange a free pickup and replacement

## Return Shipping

- **Free returns** for items with defects or wrong products shipped
- **Customer pays** for returns due to change of mind (₹99 deduction from refund)

## Refund Timeline

| Payment Method | Refund Timeline |
|----------------|-----------------|
| Credit/Debit Card | 7-10 business days |
| UPI | 5-7 business days |
| Net Banking | 7-10 business days |
| Wallets | 5-7 business days |
| COD | 10-14 business days |

## Non-Delivery Refunds

If your order is not delivered within the expected timeframe, you can request a full refund.

## Cancellation Policy

### Before Shipment
- Orders can be cancelled free of charge before dispatch
- Full refund will be initiated

### After Shipment
- Follow the return process once the item is delivered
- Standard return charges may apply

## Contact Support

For return-related queries:
- **Email**: returns@mirvaa.com
- **Phone**: +91-XXXXXXXXXX
- **WhatsApp**: +91-XXXXXXXXXX
- **Hours**: Mon-Sat, 10 AM - 7 PM IST

## Important Notes

- Refunds exclude original shipping charges (if any)
- Sale items are eligible for returns unless marked "Final Sale"
- Gift cards and e-vouchers are non-refundable
- Return requests after 7 days will not be accepted

## Address for Returns

**Mirvaa Fashions Returns Department**  
[Return Address Line 1]  
[Return Address Line 2]  
[City, State - PIN CODE]  
Phone: +91-XXXXXXXXXX

---

*We strive to make returns as hassle-free as possible. Your satisfaction is our priority!*""",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "slug": "terms-conditions",
        "title": "Terms and Conditions",
        "meta_description": "Read the terms and conditions for using Mirvaa Fashions e-commerce platform.",
        "content": """# Terms and Conditions

**Last Updated:** October 2025

Welcome to Mirvaa Fashions. By accessing and using our website, you agree to be bound by these Terms and Conditions.

## 1. General Terms

### 1.1 Acceptance
By accessing this website, you accept these terms in full. If you disagree with any part of these terms, you must not use our website.

### 1.2 Website Use
You may view, download for caching purposes only, and print pages from the website for your own personal use, subject to the restrictions set out below.

### 1.3 Prohibited Activities
You must not:
- Republish material from this website
- Sell, rent, or sub-license material from the website
- Reproduce, duplicate or copy material from this website
- Redistribute content from Mirvaa Fashions (unless content is specifically made for redistribution)

## 2. Account Terms

### 2.1 Registration
- You must provide accurate and complete information
- You are responsible for maintaining account security
- You must be at least 18 years old to make a purchase
- One person may not maintain multiple accounts

### 2.2 Account Security
- Keep your password confidential
- Notify us immediately of any unauthorized access
- You are responsible for all activities under your account

### 2.3 Account Termination
We reserve the right to suspend or terminate accounts that violate these terms.

## 3. Products and Pricing

### 3.1 Product Information
- We strive for accuracy but cannot guarantee that all product descriptions are error-free
- Colors displayed may vary based on your monitor settings
- Sizing information is provided as a guide

### 3.2 Pricing
- All prices are in Indian Rupees (INR)
- Prices include applicable taxes (GST)
- We reserve the right to change prices without notice
- Price errors: We reserve the right to cancel orders with pricing errors

### 3.3 Product Availability
- Products are subject to availability
- We reserve the right to discontinue any product
- Out-of-stock items will be communicated promptly

## 4. Orders and Payment

### 4.1 Order Acceptance
- All orders are subject to acceptance by us
- We reserve the right to refuse any order
- Order confirmation does not guarantee acceptance

### 4.2 Payment Terms
- Payment must be completed before order processing
- We accept: Cards, UPI, Net Banking, Wallets, COD
- Failed payments may result in order cancellation

### 4.3 Order Cancellation
- You may cancel before shipment
- We may cancel for: payment failure, product unavailability, suspected fraud

## 5. Shipping and Delivery

### 5.1 Delivery Timeline
- Standard delivery: 5-7 business days
- Express delivery: 2-3 business days (where available)
- Timelines are estimates and not guaranteed

### 5.2 Shipping Charges
- Free shipping on orders above ₹999
- Shipping charges vary based on location and order value

### 5.3 Delivery Issues
- Notify us within 48 hours of delivery issues
- Risk of loss passes to you upon delivery

## 6. Returns and Refunds

Please refer to our separate [Return Policy](/return-policy) for detailed information.

## 7. Intellectual Property

### 7.1 Ownership
- All content on this website is owned by Mirvaa Fashions
- Trademarks, logos, and service marks are protected

### 7.2 User Content
- You retain rights to content you submit
- You grant us a license to use your reviews and feedback
- We may remove inappropriate content without notice

## 8. Limitation of Liability

### 8.1 Disclaimer
- Website provided "as is" without warranties
- We do not guarantee uninterrupted or error-free service
- Product images are for representation only

### 8.2 Liability Cap
- Our liability is limited to the purchase price of the product
- We are not liable for indirect, incidental, or consequential damages

## 9. Privacy and Data Protection

We are committed to protecting your privacy. Please review our [Privacy Policy](/privacy-policy) for details on how we collect, use, and protect your information.

## 10. Dispute Resolution

### 10.1 Governing Law
These terms are governed by the laws of India.

### 10.2 Jurisdiction
Courts of [City], India shall have exclusive jurisdiction over disputes.

### 10.3 Resolution Process
- Contact customer support first
- Mediation before legal action
- Arbitration in accordance with Indian Arbitration and Conciliation Act

## 11. Force Majeure

We are not liable for delays or failures due to circumstances beyond our control including:
- Natural disasters
- Government restrictions
- Wars or civil unrest
- Acts of terrorism
- Pandemics

## 12. Amendments

We reserve the right to update these terms at any time. Changes will be effective immediately upon posting. Continued use constitutes acceptance of modified terms.

## 13. Severability

If any provision is found invalid, the remaining provisions remain in full effect.

## 14. Contact Information

For questions about these Terms and Conditions:

**Mirvaa Fashions**  
Email: legal@mirvaa.com  
Phone: +91-XXXXXXXXXX  
Address: [Business Address]  
[City, State - PIN CODE]

---

**Effective Date:** October 2025  
**Version:** 1.0

By using our website, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.""",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
]

async def seed_cms_pages():
    print("Connecting to MongoDB...")
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    try:
        # Check if pages already exist
        existing_count = await db.cms_pages.count_documents({})
        
        if existing_count > 0:
            print(f"Found {existing_count} existing CMS pages. Updating...")
            for page in cms_pages:
                await db.cms_pages.update_one(
                    {"slug": page["slug"]},
                    {"$set": page},
                    upsert=True
                )
        else:
            print(f"Inserting {len(cms_pages)} CMS pages...")
            await db.cms_pages.insert_many(cms_pages)
        
        print(f"✓ Successfully seeded {len(cms_pages)} CMS pages!")
        
        # Display pages
        total = await db.cms_pages.count_documents({})
        print(f"\nCMS Pages in Database:")
        for page in cms_pages:
            print(f"  - {page['title']} ({page['slug']})")
        
    except Exception as e:
        print(f"Error seeding CMS pages: {e}")
    finally:
        client.close()
        print("\nDatabase connection closed.")

if __name__ == "__main__":
    asyncio.run(seed_cms_pages())
