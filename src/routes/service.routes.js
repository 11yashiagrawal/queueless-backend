import {Router} from "express";
import { verifyJWT, verifyAdmin } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
import { createService, deactivateService, getServices, getServiceDetails, getServiceAppointments, getServiceAvailability, reactivateService, updateServiceDetails, updateServiceImages, joinQueue, getQueueStatus } from "../controllers/service.controllers.js";

const router = Router();

router.route("/").get(verifyJWT, getServices);

router.route("/:id").get(verifyJWT, getServiceDetails);

router.route("/").post(verifyJWT, verifyAdmin, upload.array("images", 10), createService);

router.route("/:id").patch(verifyJWT, verifyAdmin, updateServiceDetails);

router.route("/:id/images").patch(verifyJWT, verifyAdmin, upload.array("images", 10), updateServiceImages);

router.route("/:id").delete(verifyJWT, verifyAdmin, deactivateService);

router.route("/:id/reactivate").patch(verifyJWT, verifyAdmin, reactivateService);

router.route("/:serviceId/availability").get(verifyJWT, getServiceAvailability);

router.route("/:serviceId/appointments").get(verifyJWT, verifyAdmin, getServiceAppointments);

router.route("/:id/queue/join").post(verifyJWT, joinQueue);

router.route("/:id/queue/status").get(verifyJWT, getQueueStatus);

export default router;