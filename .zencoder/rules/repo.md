# Repository Overview

## Tech Stack
- **Frontend**: React (Create React App), Tailwind CSS, ShadCN UI components, React Router
- **Backend**: FastAPI (Python), Motor for MongoDB access, Razorpay & Shiprocket integrations
- **Database**: MongoDB (likely hosted on MongoDB Atlas)
- **Build tools**: Yarn, Craco, PostCSS, Tailwind
- **Other Services**: JWT authentication, Local uploads folder for static files

## Key Directories
- **frontend/**: React application source code
- **backend/**: FastAPI application code including API routes, models, and integrations
- **scripts/**: Data seeding scripts
- **tests/**: Automated tests (pytest)

## Environment Files
- **backend/.env**: Backend environment variables (DB connection, JWT secret, Razorpay keys)
- **frontend/.env**: Frontend environment variables (API base URL, feature flags)

## Entry Points
- **frontend/src/index.js**: React app initialization
- **frontend/src/App.js**: Route definitions and layout
- **backend/server.py**: FastAPI application setup and API routes

## Common Tasks
- **Start backend**: `uvicorn server:app --reload` (from backend directory)
- **Start frontend**: `yarn start` (from frontend directory)
- **Run tests**: `pytest` (from repository root or dedicated environment)

## Notes
- Ensure `.env` files contain valid credentials and are not committed to version control.
- Uploaded media assets are stored in `backend/uploads/` and served via `/uploads` endpoint.
- Admin dashboard routes may need corresponding components under `frontend/src/pages/admin/`.