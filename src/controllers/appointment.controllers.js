import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createAppointmentService, getAllAppointmentsService, getMyAppointmentsService, updateAppointmentAdminService, cancelAppointmentAdminService, rescheduleAppointmentService, changeStatusService, getAppointmentByIdService, cancelAppointmentService  } from "../services/appointment.services.js";

const createAppointment = asyncHandler(async (req, res) => {
    const { serviceId, businessId, appointmentDate, slotStart, slotEnd, charges } = req.body;

    if(!serviceId || !businessId) {
        throw new ApiError(400, "Service ID and Business ID are required");
    }

    const {statusCode, data, message} = await createAppointmentService(req.user, serviceId, businessId, appointmentDate, slotStart, slotEnd, charges);

    if(statusCode >= 400) {
        throw new ApiError(statusCode, message);
    }

    return res.status(statusCode).json(new ApiResponse(statusCode, data, message));
})

const getAllAppointments = asyncHandler(async (req, res) => {
    const { serviceId, businessId, status, minTime, maxTime, date, sortBy, sortOrder, page, limit} = req.query;
    
    if(!serviceId || !businessId) {
        throw new ApiError(400, "Service ID and Business ID are required");
    }

    const {statusCode, data, message} = await getAllAppointmentsService(req.user, serviceId, businessId, status, minTime, maxTime, date, sortBy, sortOrder, page, limit);

    if(statusCode >= 400) {
        throw new ApiError(statusCode, message);
    }

    return res.status(statusCode).json(new ApiResponse(statusCode, data, message));
})

const getMyAppointments = asyncHandler(async (req, res) => {
    const { status, minTime, maxTime, date, sortBy, sortOrder, page, limit} = req.query;

    const {statusCode, data, message} = await getMyAppointmentsService(req.user, status, minTime, maxTime, date, sortBy, sortOrder, page, limit);

    if(statusCode >= 400) {
        throw new ApiError(statusCode, message);
    }

    return res.status(statusCode).json(new ApiResponse(statusCode, data, message));
})

const updateAppointmentAdmin = asyncHandler(async (req, res) => {
    const { date, slotStart, slotEnd, charges } = req.body;
    const { id } = req.params;

    if(!id) {
        throw new ApiError(400, "Appointment ID is required");
    }

    const {statusCode, data, message} = await updateAppointmentAdminService(req.user, id, date, slotStart, slotEnd, charges);

    if(statusCode >= 400) {
        throw new ApiError(statusCode, message);
    }

    return res.status(statusCode).json(new ApiResponse(statusCode, data, message));
})

const cancelAppointmentAdmin = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { cancelReason } = req.body;

    if(!id) {
        throw new ApiError(400, "Appointment ID is required");
    }

    const {statusCode, data, message} = await cancelAppointmentAdminService(req.user, id, cancelReason);

    if(statusCode >= 400) {
        throw new ApiError(statusCode, message);
    }

    return res.status(statusCode).json(new ApiResponse(statusCode, data, message));
})

const rescheduleAppointment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { date, slotStart, slotEnd } = req.body;

    if(!id) {
        throw new ApiError(400, "Appointment ID is required");
    }

    const {statusCode, data, message} = await rescheduleAppointmentService(req.user, id, date, slotStart, slotEnd);

    if(statusCode >= 400) {
        throw new ApiError(statusCode, message);
    }

    return res.status(statusCode).json(new ApiResponse(statusCode, data, message));
})

const changeStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if(!id || !status) {
        throw new ApiError(400, "Appointment ID and status are required");
    }

    const {statusCode, data, message} = await changeStatusService(req.user, id, status);

    if(statusCode >= 400) {
        throw new ApiError(statusCode, message);
    }

    return res.status(statusCode).json(new ApiResponse(statusCode, data, message));
})

const getAppointmentById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if(!id) {
        throw new ApiError(400, "Appointment ID is required");
    }

    const {statusCode, data, message} = await getAppointmentByIdService(req.user, id);

    if(statusCode >= 400) {
        throw new ApiError(statusCode, message);
    }

    return res.status(statusCode).json(new ApiResponse(statusCode, data, message));
})

const cancelAppointment = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if(!id) {
        throw new ApiError(400, "Appointment ID is required");
    }

    const {statusCode, data, message} = await cancelAppointmentService(req.user, id);

    if(statusCode >= 400) {
        throw new ApiError(statusCode, message);
    }

    return res.status(statusCode).json(new ApiResponse(statusCode, data, message));
})

export {createAppointment, getAllAppointments, getMyAppointments, updateAppointmentAdmin, cancelAppointmentAdmin, rescheduleAppointment, changeStatus, getAppointmentById, cancelAppointment}