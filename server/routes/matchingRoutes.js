import { Router } from "express";
import AuthController from "../controllers/AuthController.js";
import MatchingController from "../controllers/MatchController.js";

const router = Router();

router.post(
  "/api/match",
  AuthController.authenticateUser,
  MatchingController.matchUsers
);

export default router;
