import express from "express";
import { configDotenv } from "dotenv";
import AuthController from "../controllers/AuthController.js";
configDotenv();

const router = express.Router();

// Rate limiting middleware (simple implementation)
const createRateLimiter = (windowMs, maxRequests) => {
  const requests = new Map();

  return (req, res, next) => {
    const clientIp = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    for (const [ip, timestamps] of requests.entries()) {
      requests.set(
        ip,
        timestamps.filter((time) => time > windowStart)
      );
      if (requests.get(ip).length === 0) {
        requests.delete(ip);
      }
    }

    // Check current requests
    const clientRequests = requests.get(clientIp) || [];

    if (clientRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: {
          message: "Too many requests",
          retryAfter: Math.ceil(windowMs / 1000),
        },
      });
    }

    // Add current request
    clientRequests.push(now);
    requests.set(clientIp, clientRequests);

    next();
  };
};

// Apply rate limiting to auth endpoints
const authRateLimit = createRateLimiter(15 * 60 * 1000, 10); // 10 requests per 15 minutes
const loginRateLimit = createRateLimiter(15 * 60 * 1000, 50); // 50 login attempts per 15 minutes (development)

// Public routes (no authentication required)
router.post("/sign-up", authRateLimit, AuthController.signUp);
router.post("/sign-in", loginRateLimit, AuthController.signIn);
router.post("/refresh-token", authRateLimit, AuthController.refreshToken);

// Protected routes (authentication required)
router.post("/logout", AuthController.authenticateUser, AuthController.logout);
router.get(
  "/profile",
  AuthController.authenticateUser,
  AuthController.getProfile
);

// Health check endpoint
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      message: "Auth service is healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

export default router;
