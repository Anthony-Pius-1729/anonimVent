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
app.use(cors());
// app.options("*", cors());

app.use("/auth", authReg);
app.use("/", matchingRoutes);

app.get("/", (req, res) => {
  res.send("Hello from server");
});

server.listen(8080, "0.0.0.0", () => {
  console.log("Server running on 0.0.0.0:8080");
});
