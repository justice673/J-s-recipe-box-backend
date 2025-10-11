# Recipe Sharing Backend (Express.js)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the server (development):
   ```bash
   npm run dev
   ```
3. The server runs on `http://localhost:5000` by default.

## API Endpoints

### Auth
- `POST /api/auth/signup` — Register a new user
- `POST /api/auth/login` — Login and get JWT

> Note: This backend uses in-memory storage for users. Replace with a database for production use.
