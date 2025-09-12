# Ngrok Setup Instructions

## Quick Fix for CORS Issues

Your CORS issues have been resolved with the recent updates! Here's what was fixed:

### 1. Server CORS Configuration ✅

- Updated to allow all ngrok URLs (both HTTP and HTTPS)
- Added support for `.ngrok-free.app` and `.ngrok.io` domains

### 2. Client Headers ✅

- Added `ngrok-skip-browser-warning` header to all API requests
- This bypasses ngrok's browser warning page

### 3. Environment Configuration ✅

- Created `.env` file with your current ngrok URL
- Added helper functions for consistent header management

## How to Update Your Ngrok URL

When you get a new ngrok URL, update the `.env` file:

```bash
# In client/.env
EXPO_PUBLIC_API_BASE_URL=https://your-new-ngrok-url.ngrok-free.app
EXPO_PUBLIC_SOCKET_URL=https://your-new-ngrok-url.ngrok-free.app
```

## Starting Your Services

1. **Start your server:**

   ```bash
   cd server
   npm run dev
   ```

2. **Start ngrok:**

   ```bash
   ngrok http 8080
   ```

3. **Update .env with new ngrok URL (if changed)**

4. **Start your client:**
   ```bash
   cd client
   npm start
   ```

## Troubleshooting

- **503 Error**: Make sure your server is running on port 8080
- **CORS Error**: Restart your server after making CORS changes
- **Connection Failed**: Verify the ngrok URL in your .env file matches the active tunnel

