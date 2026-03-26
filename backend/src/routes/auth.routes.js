import express from "express";
import { login, getProfile } from "../controllers/authController.js";
import { checkJWTToken } from "../middleware/index.js";

const router = express.Router();

router.post("/login", login);
router.get("/profile", checkJWTToken, getProfile);

export default router;
