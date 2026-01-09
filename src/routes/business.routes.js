import {Router} from "express";
import {createBusiness, getAllBusinesses, getBusinessDetails, myBusinesses, updateBusinessDetails, updateDocuments, deactivate, reactivate } from "../controllers/business.controllers.js";
import { verifyJWT, verifyAdmin } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";

const router = Router();

router.route("/").post(upload.single("documents"), verifyJWT, createBusiness);

router.route("/").get(verifyJWT, getAllBusinesses);

router.route("/my").get(verifyJWT, verifyAdmin, myBusinesses);

router.route("/:id").get(verifyJWT, getBusinessDetails);

router.route("/:id").patch(verifyJWT, verifyAdmin, updateBusinessDetails);

router.route("/:id/documents").patch(upload.single("documents"), verifyJWT, verifyAdmin, updateDocuments);

router.route("/:id").delete(verifyJWT, verifyAdmin, deactivate);

router.route("/:id/reactivate").patch(verifyJWT, verifyAdmin, reactivate);

export default router;