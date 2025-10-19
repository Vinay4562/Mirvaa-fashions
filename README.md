# Mirvaa Fashions - E-Commerce Platform

A full-featured e-commerce platform for fashion retail built with React, FastAPI, and MongoDB.

## 🚀 Local Development

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Admin Panel**: http://localhost:3000/admin/login
- **Admin Credentials**: `admin / admin123`

## ✨ Key Features

server start:
uvicorn server:app --reload 

frontend start:
npm start

### Customer Features
- Modern homepage with hero section, categories, featured & new arrival products
- Advanced product filtering (category, price, size, color) and sorting
- Detailed product pages with image gallery, variants, and reviews
- Shopping cart with quantity management
- Wishlist functionality
- Multi-step checkout with Razorpay/COD payment
- Order tracking and history
- User account management

### Admin Features
- Secure admin dashboard
- Complete product management (CRUD operations)
- Order management with status updates
- Real-time statistics

## 🛠 Tech Stack

- **Frontend**: React 19, Tailwind CSS, Shadcn UI, React Router
- **Backend**: FastAPI, Motor (async MongoDB), JWT Auth, Bcrypt
- **Database**: MongoDB
- **Payment**: Razorpay SDK (mocked for MVP)
