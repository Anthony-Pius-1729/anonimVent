import express from "express";
import db from "../config/database.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { hashPassword } from "../service/encrypt.js";

class AuthController {
  // Helper method to generate JWT tokens
  static generateToken(payload, expiresIn = "1h") {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
  }

  // Helper method for consistent API responses
  static sendResponse(res, statusCode, data, error = null) {
    const response = {
      success: statusCode >= 200 && statusCode < 300,
      timestamp: new Date().toISOString(),
      ...(error && { error }),
      ...(data && { data }),
    };
    return res.status(statusCode).json(response);
  }

  // Input validation helper
  static validateAuthInput(name, password) {
    const errors = [];

    // Validate name
    if (!name || typeof name !== "string") {
      errors.push("Name is required and must be a string");
    } else if (name.trim().length < 3) {
      errors.push("Name must be at least 3 characters long");
    } else if (name.trim().length > 50) {
      errors.push("Name must be less than 50 characters");
    } else if (!/^[a-zA-Z0-9_.-]+$/.test(name.trim())) {
      errors.push(
        "Name can only contain letters, numbers, dots, dashes, and underscores"
      );
    }

    // Validate password
    if (!password || typeof password !== "string") {
      errors.push("Password is required and must be a string");
    } else if (password.length < 6) {
      errors.push("Password must be at least 6 characters long");
    } else if (password.length > 128) {
      errors.push("Password must be less than 128 characters");
    } else if (
      !/(?=.*[a-z])(?=.*[A-Z])|(?=.*[a-z])(?=.*\d)|(?=.*[A-Z])(?=.*\d)/.test(
        password
      )
    ) {
      errors.push(
        "Password must contain at least two of: lowercase letter, uppercase letter, or number"
      );
    }

    return errors;
  }

  // Sanitize user input
  static sanitizeInput(input) {
    if (typeof input !== "string") return input;
    return input.trim().toLowerCase();
  }
  static async signUp(req, res) {
    const startTime = Date.now();

    try {
      // Extract and validate input
      const { name, password, email } = req?.body?.payload || {};

      console.log(
        `[SignUp] Attempt for user: ${
          name ? name.substring(0, 3) + "***" : "unknown"
        }`
      );

      // Input validation
      const validationErrors = AuthController.validateAuthInput(name, password);
      if (validationErrors.length > 0) {
        console.log(
          `[SignUp] Validation failed: ${validationErrors.join(", ")}`
        );
        return AuthController.sendResponse(res, 400, null, {
          message: "Validation failed",
          details: validationErrors,
        });
      }

      // Sanitize input
      const sanitizedName = AuthController.sanitizeInput(name);

      // Check if user already exists
      const existingUserQuery = await db.query(
        "SELECT id FROM users WHERE LOWER(name) = $1",
        [sanitizedName]
      );

      if (existingUserQuery.rows.length > 0) {
        console.log(`[SignUp] User already exists: ${sanitizedName}`);
        return AuthController.sendResponse(res, 409, null, {
          message: "User with this name already exists",
          field: "name",
        });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);
      console.log(
        `[SignUp] Password hashed successfully for: ${sanitizedName}`
      );

      // Create user with transaction
      const client = await db.connect();
      try {
        await client.query("BEGIN");

        const createUserQuery = `
          INSERT INTO users (name, password, created_at, last_active, is_available) 
          VALUES ($1, $2, NOW(), NOW(), true) 
          RETURNING id, name, created_at
        `;

        const savedUser = await client.query(createUserQuery, [
          sanitizedName,
          hashedPassword,
        ]);

        await client.query("COMMIT");

        if (savedUser.rows.length > 0) {
          const user = savedUser.rows[0];

          // Generate token
          const token = AuthController.generateToken(
            {
              id: user.id,
              name: user.name,
              type: "access",
            },
            "24h"
          );

          const responseData = {
            message: "User created successfully",
            token,
            user: {
              id: user.id,
              name: user.name,
              createdAt: user.created_at,
            },
            expiresIn: "24h",
          };

          console.log(
            `[SignUp] Success for user: ${sanitizedName} (${
              Date.now() - startTime
            }ms)`
          );
          return AuthController.sendResponse(res, 201, responseData);
        }
      } catch (dbError) {
        await client.query("ROLLBACK");
        throw dbError;
      } finally {
        client.release();
      }

      // Fallback error
      throw new Error("Failed to create user - no rows returned");
    } catch (error) {
      console.error(`[SignUp] Error for user ${name || "unknown"}:`, {
        message: error.message,
        code: error.code,
        duration: Date.now() - startTime,
      });

      // Handle specific database errors
      if (error.code === "23505") {
        // Unique constraint violation
        return AuthController.sendResponse(res, 409, null, {
          message: "User with this name already exists",
          field: "name",
        });
      }

      return AuthController.sendResponse(res, 500, null, {
        message: "Internal server error",
        requestId: `req_${Date.now()}`,
      });
    }
  }

  static async signIn(req, res) {
    const startTime = Date.now();
    let attemptedUsername = "unknown";

    try {
      // Extract and validate input
      const { name, password } = req?.body?.payload || {};
      attemptedUsername = name ? name.substring(0, 3) + "***" : "unknown";

      console.log(`[SignIn] Attempt for user: ${attemptedUsername}`);

      // Basic input validation
      if (!name || !password) {
        console.log(`[SignIn] Missing credentials for: ${attemptedUsername}`);
        return AuthController.sendResponse(res, 400, null, {
          message: "Name and password are required",
          fields: ["name", "password"],
        });
      }

      // Sanitize input
      const sanitizedName = AuthController.sanitizeInput(name);

      // Fetch user with password (limit data exposure)
      const userQuery = await db.query(
        `SELECT id, name, password, is_available, last_active, created_at 
         FROM users WHERE LOWER(name) = $1`,
        [sanitizedName]
      );

      // Always perform password comparison even if user doesn't exist
      // This prevents timing attacks that could reveal valid usernames
      const dummyHash =
        "$2b$10$dummyhashtopreventtimingattacksxxxxxxxxxxxxxxxxxxxxxxxxx";
      const userExists = userQuery.rows.length > 0;
      const user = userExists ? userQuery.rows[0] : null;
      const hashToCompare = user ? user.password : dummyHash;

      // Perform password comparison
      const isPasswordValid = await bcrypt.compare(password, hashToCompare);

      // Check if both user exists and password is valid
      if (userExists && isPasswordValid) {
        // Update last_active timestamp
        await db.query("UPDATE users SET last_active = NOW() WHERE id = $1", [
          user.id,
        ]);

        // Generate token
        const token = AuthController.generateToken(
          {
            id: user.id,
            name: user.name,
            type: "access",
          },
          "24h"
        );

        const responseData = {
          message: "User signed in successfully",
          token,
          user: {
            id: user.id,
            name: user.name,
            lastActive: user.last_active,
            isAvailable: user.is_available,
          },
          expiresIn: "24h",
        };

        console.log(
          `[SignIn] Success for user: ${sanitizedName} (${
            Date.now() - startTime
          }ms)`
        );
        return AuthController.sendResponse(res, 200, responseData);
      } else {
        // Generic error message for security (don't reveal if user exists)
        console.log(
          `[SignIn] Invalid credentials for: ${attemptedUsername} (${
            Date.now() - startTime
          }ms)`
        );

        // Add artificial delay to prevent timing attacks
        await new Promise((resolve) =>
          setTimeout(resolve, Math.random() * 100 + 50)
        );

        return AuthController.sendResponse(res, 401, null, {
          message: "Invalid credentials",
          hint: "Please check your username and password",
        });
      }
    } catch (error) {
      console.error(`[SignIn] Error for user ${attemptedUsername}:`, {
        message: error.message,
        duration: Date.now() - startTime,
      });

      return AuthController.sendResponse(res, 500, null, {
        message: "Internal server error",
        requestId: `req_${Date.now()}`,
      });
    }
  }

  static async authenticateUser(req, res, next) {
    const startTime = Date.now();

    try {
      const authHeader = req.headers.authorization;
      const userAgent = req.headers["user-agent"] || "unknown";
      const clientIp = req.ip || req.connection.remoteAddress || "unknown";

      console.log(`[Auth] Authentication attempt from ${clientIp}`);

      // Check for authorization header
      if (!authHeader) {
        console.log(`[Auth] No authorization header provided from ${clientIp}`);
        return AuthController.sendResponse(res, 401, null, {
          message: "Authorization required",
          code: "NO_AUTH_HEADER",
        });
      }

      // Validate Bearer token format
      const bearerTokenRegex = /^Bearer\s+([A-Za-z0-9\-._~+/]+=*)$/;
      if (!bearerTokenRegex.test(authHeader)) {
        console.log(`[Auth] Invalid authorization format from ${clientIp}`);
        return AuthController.sendResponse(res, 401, null, {
          message: "Invalid authorization format",
          code: "INVALID_AUTH_FORMAT",
          expected: "Bearer <token>",
        });
      }

      // Extract token from "Bearer <token>" format
      const token = authHeader.split(" ")[1];

      if (!token || token.length < 10) {
        console.log(`[Auth] Invalid token provided from ${clientIp}`);
        return AuthController.sendResponse(res, 401, null, {
          message: "Invalid token provided",
          code: "INVALID_TOKEN",
        });
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Validate token payload
      if (!decoded.id || !decoded.name || decoded.type !== "access") {
        console.log(`[Auth] Invalid token payload from ${clientIp}`);
        return AuthController.sendResponse(res, 401, null, {
          message: "Invalid token payload",
          code: "INVALID_PAYLOAD",
        });
      }

      // Check if user still exists and is active
      const userQuery = await db.query(
        `SELECT id, name, is_available, last_active, created_at 
         FROM users WHERE id = $1`,
        [decoded.id]
      );

      if (userQuery.rows.length === 0) {
        console.log(
          `[Auth] User not found for token from ${clientIp}: ${decoded.id}`
        );
        return AuthController.sendResponse(res, 401, null, {
          message: "User account not found",
          code: "USER_NOT_FOUND",
        });
      }

      const user = userQuery.rows[0];

      // Optional: Check if user has been inactive for too long
      const maxInactiveHours = 72; // 3 days
      const lastActiveDate = new Date(user.last_active);
      const hoursSinceLastActive =
        (Date.now() - lastActiveDate.getTime()) / (1000 * 60 * 60);

      if (hoursSinceLastActive > maxInactiveHours) {
        console.log(
          `[Auth] User inactive too long: ${
            user.name
          } (${hoursSinceLastActive.toFixed(1)}h)`
        );
        return AuthController.sendResponse(res, 401, null, {
          message: "Session expired due to inactivity",
          code: "INACTIVE_SESSION",
        });
      }

      // Update last_active timestamp for active users
      if (hoursSinceLastActive > 0.5) {
        // Only update if > 30 minutes
        await db.query("UPDATE users SET last_active = NOW() WHERE id = $1", [
          user.id,
        ]);
      }

      // Attach enhanced user info to request object
      req.user = {
        id: user.id,
        name: user.name,
        isAvailable: user.is_available,
        lastActive: user.last_active,
        tokenPayload: decoded,
      };

      // Add request metadata
      req.auth = {
        authenticatedAt: new Date().toISOString(),
        clientIp,
        userAgent,
        duration: Date.now() - startTime,
      };

      console.log( 
        `[Auth] Success for user: ${user.name} (${Date.now() - startTime}ms)`
      );
      next();
    } catch (error) {
      console.error(`[Auth] Error:`, {
        message: error.message,
        name: error.name,
        clientIp: req.ip || "unknown",
        duration: Date.now() - startTime,
      });

      // Handle specific JWT errors
      if (error.name === "JsonWebTokenError") {
        return AuthController.sendResponse(res, 401, null, {
          message: "Invalid token signature",
          code: "INVALID_SIGNATURE",
        });
      }

      if (error.name === "TokenExpiredError") {
        return AuthController.sendResponse(res, 401, null, {
          message: "Token has expired",
          code: "TOKEN_EXPIRED",
          expiredAt: error.expiredAt,
        });
      }

      if (error.name === "NotBeforeError") {
        return AuthController.sendResponse(res, 401, null, {
          message: "Token not yet valid",
          code: "TOKEN_NOT_ACTIVE",
        });
      }

      // Generic authentication failure
      return AuthController.sendResponse(res, 500, null, {
        message: "Authentication failed",
        code: "AUTH_ERROR",
        requestId: `req_${Date.now()}`,
      });
    }
  }

  // Additional helper methods for enhanced functionality
  static async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return AuthController.sendResponse(res, 400, null, {
          message: "Refresh token required",
          code: "MISSING_REFRESH_TOKEN",
        });
      }

      // Verify refresh token (implement refresh token logic as needed)
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
      );

      // Generate new access token
      const newAccessToken = AuthController.generateToken(
        {
          id: decoded.id,
          name: decoded.name,
          type: "access",
        },
        "24h"
      );

      return AuthController.sendResponse(res, 200, {
        message: "Token refreshed successfully",
        token: newAccessToken,
        expiresIn: "24h",
      });
    } catch (error) {
      console.error("[RefreshToken] Error:", error);
      return AuthController.sendResponse(res, 401, null, {
        message: "Invalid refresh token",
        code: "INVALID_REFRESH_TOKEN",
      });
    }
  }

  static async logout(req, res) {
    try {
      // In a production app, you might want to blacklist the token
      // For now, we'll just return a success message
      console.log(`[Logout] User ${req.user?.name || "unknown"} logged out`);

      return AuthController.sendResponse(res, 200, {
        message: "Logged out successfully",
      });
    } catch (error) {
      console.error("[Logout] Error:", error);
      return AuthController.sendResponse(res, 500, null, {
        message: "Logout failed",
      });
    }
  }

  static async getProfile(req, res) {
    try {
      const user = req.user;

      // Get additional user data
      const userQuery = await db.query(
        `SELECT id, name, created_at, last_active, is_available 
         FROM users WHERE id = $1`,
        [user.id]
      );

      if (userQuery.rows.length === 0) {
        return AuthController.sendResponse(res, 404, null, {
          message: "User profile not found",
        });
      }

      const profile = userQuery.rows[0];

      return AuthController.sendResponse(res, 200, {
        profile: {
          id: profile.id,
          name: profile.name,
          createdAt: profile.created_at,
          lastActive: profile.last_active,
          isAvailable: profile.is_available,
        },
      });
    } catch (error) {
      console.error("[GetProfile] Error:", error);
      return AuthController.sendResponse(res, 500, null, {
        message: "Failed to get profile",
      });
    }
  }
}

export default AuthController;
