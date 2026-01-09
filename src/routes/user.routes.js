import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
import { password, accountDetails, account, identityProof, user } from "../controllers/user.controllers.js";

const router = Router();

router.route("/password").post(verifyJWT, password)

router.route("/accountDetails").patch(verifyJWT, accountDetails)

router.route("/").delete(verifyJWT, account)

router.route("/identityProof").patch(verifyJWT, upload.single("identityProof"), identityProof)

router.route("/").get(verifyJWT, user)

export default router;