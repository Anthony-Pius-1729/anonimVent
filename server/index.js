import express, { json } from "express";
import http from "http";
import cors from "cors";
import { configDotenv } from "dotenv";
import authReg from "./routes/auth.js";
import matchingRoutes from "./routes/matchingRoutes.js";
import { initializeSocket } from "./config/socket.js";

configDotenv();

const app = express();
const server = http.createServer(app);

const io = initializeSocket(server);

app.use(json());

// Enhanced CORS configuration
app.use(
  cors({
    origin: [
      "http://localhost:8081",
      "http://localhost:8083",
      "http://localhost:19006",
      "exp://192.168.1.100:8081",
      "http://192.168.1.100:8081",
      // Allow all ngrok URLs for development
      /^https:\/\/.*\.ngrok-free\.app$/,
      /^https:\/\/.*\.ngrok\.io$/,
      /^http:\/\/.*\.ngrok-free\.app$/,
      /^http:\/\/.*\.ngrok\.io$/,
    ], // Expo development servers and ngrok URLs
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "ngrok-skip-browser-warning",
    ],
    credentials: true,
  })
);

// Handle preflight requests explicitly
app.options("*", cors());

app.use("/auth", authReg);
app.use("/", matchingRoutes);

app.get("/", (req, res) => {
  res.send("Hello from server");
});

server.listen(8080, "0.0.0.0", () => {
  console.log("Server running on 0.0.0.0:8080");
});
