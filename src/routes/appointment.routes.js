import { Router } from "express";
import { verifyJWT, verifyAdmin } from "../middleware/auth.middleware.js";
import { createAppointment, getAllAppointments, getMyAppointments, updateAppointmentAdmin, cancelAppointmentAdmin, rescheduleAppointment, changeStatus, getAppointmentById, cancelAppointment } from "../controllers/appointment.controller.js";

const router = Router();

router.route('/').post(verifyJWT, createAppointment);

router.route('/').get(verifyJWT, verifyAdmin, getAllAppointments);

router.route('/my').get(verifyJWT, getMyAppointments);

router.route('/admin/:id').patch(verifyJWT, verifyAdmin, updateAppointmentAdmin);

router.route('/admin/:id/cancel').patch(verifyJWT, verifyAdmin, cancelAppointmentAdmin);

router.route('/:id/reschedule').patch(verifyJWT, rescheduleAppointment);

router.route('/:id/status').patch(verifyJWT, verifyAdmin, changeStatus);

router.route('/:id').get(verifyJWT, getAppointmentById);

router.route('/:id/cancel').patch(verifyJWT, cancelAppointment);

export default router;