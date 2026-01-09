import { Router } from "express";
import { signup, login, refreshTokens, logout } from "../controllers/auth.controller.js";
import {upload} from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/signup").post(upload.single("identityProof"), signup)

router.route("/login").post(login)

router.route("/refreshTokens").post(refreshTokens)

router.route("/logout").post(verifyJWT, logout)

export default router;