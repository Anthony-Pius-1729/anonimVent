# anonimVent

Anonymous venting and chat application built with React Native (Expo) and Node.js.

## Project Structure

```
anonimVent/
├── client/                 # React Native mobile app (Expo)
│   ├── app/               # Application screens and components
│   ├── assets/            # Images, fonts, and other assets
│   └── package.json       # Client dependencies
├── server/                # Node.js backend API
│   ├── config/            # Database and socket configuration
│   ├── controllers/       # API controllers
│   ├── routes/            # API routes
│   ├── service/           # Utility services
│   └── package.json       # Server dependencies
└── README.md
```

## Features

- **Anonymous Messaging**: Chat without revealing your identity
- **Private Conversations**: Secure one-on-one conversations
- **User Authentication**: Sign up and login system
- **Real-time Chat**: Socket.io powered real-time messaging
- **Problem Categories**: Categorized chat topics
- **Waiting Room**: Queue system for matching users

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database
- Expo CLI (`npm install -g @expo/cli`)
- ngrok (for local development with mobile app)

### Server Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   
4. Edit `.env` file with your actual values:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=your_database_name
   DB_USER=your_database_user
   DB_PASSWORD=your_database_password

   # JWT Configuration
   JWT_SECRET=your_strong_jwt_secret_here
   JWT_REFRESH_SECRET=your_strong_refresh_secret_here

   # Server Configuration
   PORT=8080
   NODE_ENV=development
   ```

5. Start the server:
   ```bash
   npm start
   ```

### Client Setup

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your ngrok URL:
   ```env
   # API Configuration
   EXPO_PUBLIC_API_BASE_URL=https://your-ngrok-url.ngrok-free.app
   EXPO_PUBLIC_API_BASE_URL_FALLBACK=http://your-ngrok-url.ngrok-free.app

   # Socket Configuration  
   EXPO_PUBLIC_SOCKET_URL=http://your-ngrok-url.ngrok-free.app
   ```

5. Start the Expo development server:
   ```bash
   npx expo start
   ```

### ngrok Setup (for local development)

1. Install ngrok if you haven't already
2. Start ngrok tunnel:
   ```bash
   ngrok http 8080
   ```
3. Copy the generated URL to your client `.env` file

## Environment Variables

### Server (.env)

| Variable | Description | Required |
|----------|-------------|----------|
| `DB_HOST` | PostgreSQL host | Yes |
| `DB_PORT` | PostgreSQL port | Yes |
| `DB_NAME` | Database name | Yes |
| `DB_USER` | Database username | Yes |
| `DB_PASSWORD` | Database password | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | Yes |
| `PORT` | Server port | No (defaults to 8080) |
| `NODE_ENV` | Environment mode | No |

### Client (.env)

| Variable | Description | Required |
|----------|-------------|----------|
| `EXPO_PUBLIC_API_BASE_URL` | Main API URL (HTTPS) | Yes |
| `EXPO_PUBLIC_API_BASE_URL_FALLBACK` | Fallback API URL (HTTP) | Yes |
| `EXPO_PUBLIC_SOCKET_URL` | Socket.io server URL | Yes |

## Security Notes

- 🔒 **Never commit `.env` files** - they contain sensitive information
- 🔑 **Use strong JWT secrets** - generate random, long strings
- 📁 **Keep `.env.example` updated** - when adding new environment variables
- 🚫 **The `.env` files are already ignored** by git via `.gitignore`

## API Endpoints

### Authentication
- `POST /auth/sign-up` - User registration
- `POST /auth/sign-in` - User login

### Matching
- Socket.io events for real-time chat functionality

## Technologies Used

### Frontend (Client)
- React Native with Expo
- TypeScript
- Socket.io Client
- React Navigation
- AsyncStorage
- NativeWind (Tailwind CSS for React Native)

### Backend (Server)
- Node.js with Express
- PostgreSQL with pg
- Socket.io
- JWT for authentication
- bcrypt for password hashing
- dotenv for environment variables

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure environment variables are properly configured
5. Test your changes
6. Submit a pull request

## License

This project is private and proprietary.
