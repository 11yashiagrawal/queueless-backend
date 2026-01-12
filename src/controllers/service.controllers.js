import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { create, deactivate, reactivate, updateDetails, updateImages, getAll, getDetails, checkAvailability, getAppointments, join, queueStatus} from "../services/service.services.js";

const createService = asyncHandler(async(req, res) => {
    const { businessId, name, description, type, avgDurationMinutes, bufferMinutes, chargesPerAppointment, isActive, confirmationMode} = req.body;

    const imagesLocalPaths = req.files?.map(file => file.path);
    const availableHours = [];
    Object.keys(req.body).forEach((key) => {
        if (key.startsWith("availableHours.")) {
            const [, index, field] = key.split(".");
            if (!availableHours[index]) availableHours[index] = {};
            availableHours[index][field] =
                req.body[key] === "true" ? true :
                    req.body[key] === "false" ? false :
                        req.body[key];
        }
    });
    if(!businessId || !name || !description || !type || !avgDurationMinutes || !bufferMinutes || !availableHours || !chargesPerAppointment) {
        throw new ApiError(400, "All fields are required");
    }

    const {statusCode, data, message} = await create(businessId, name, description, type, avgDurationMinutes, bufferMinutes, availableHours, chargesPerAppointment, isActive, confirmationMode, imagesLocalPaths, req.user);

    if (statusCode >= 400) {
        throw new ApiError(statusCode, message);
    }
    return res.status(statusCode).json(new ApiResponse(statusCode, data, message));
})

const deactivateService = asyncHandler(async(req, res) => {
    const {id} = req.params;

    if(!id) {
        throw new ApiError(400, "Service ID is required");
    }

    const {statusCode, data, message} = await deactivate(id, req.user);

    if (statusCode >= 400) {
        throw new ApiError(statusCode, message);
    }
    return res.status(statusCode).json(new ApiResponse(statusCode, data, message));
})

const reactivateService = asyncHandler(async(req, res) => {
    const {id} = req.params;

    if(!id) {
        throw new ApiError(400, "Service ID is required");
    }

    const {statusCode, data, message} = await reactivate(id, req.user);

    if (statusCode >= 400) {
        throw new ApiError(statusCode, message);
    }
    return res.status(statusCode).json(new ApiResponse(statusCode, data, message));
})

const updateServiceDetails = asyncHandler(async(req, res) => {
    const { name, description, type, avgDurationMinutes, bufferMinutes, availableHours, chargesPerAppointment, confirmationMode} = req.body;
    const {id} = req.params;

    if (!name && !description && !type && !avgDurationMinutes && !bufferMinutes && !availableHours && !chargesPerAppointment && !confirmationMode) {
        throw new ApiError(400, "At least one field is required");
    }
    console.log(avgDurationMinutes)
    const {statusCode, data, message} = await updateDetails(id, name, description, type, avgDurationMinutes, bufferMinutes, availableHours, chargesPerAppointment, confirmationMode, req.user);

    if (statusCode >= 400) {
        throw new ApiError(statusCode, message);
    }
    return res.status(statusCode).json(new ApiResponse(statusCode, data, message));
})

const updateServiceImages = asyncHandler(async(req, res) => {
    const {id} = req.params;
    const imagesLocalPaths = req.files?.map(file => file?.path);

    if(!imagesLocalPaths.length) {
        throw new ApiError(400, "At least one image is required");
    }

    const {statusCode, data, message} = await updateImages(id, imagesLocalPaths, req.user);

    if (statusCode >= 400) {
        throw new ApiError(statusCode, message);
    }
    return res.status(statusCode).json(new ApiResponse(statusCode, data, message));
})

const getServices = asyncHandler(async(req, res) => {
    const {businessId, type, minTime, maxTime, day, isOpen, currentlyOpen, confirmationMode, minCharge, maxCharge, sortBy, sortOrder, page, limit} = req.query;

    const {statusCode, data, pagination, message} = await getAll(businessId, type, minTime, maxTime, day, isOpen, currentlyOpen, confirmationMode, minCharge, maxCharge, sortBy, sortOrder, page, limit, req.user);

    if (statusCode >= 400) {
        throw new ApiError(statusCode, message);
    }
    return res.status(statusCode).json(new ApiResponse(statusCode, {data, pagination}, message));
})

const getServiceDetails = asyncHandler(async(req, res) => {
    const {id} = req.params;

    if(!id) {
        throw new ApiError(400, "Service ID is required");
    }

    const {statusCode, data, message} = await getDetails(id, req.user);

    if (statusCode >= 400) {
        throw new ApiError(statusCode, message);
    }
    return res.status(statusCode).json(new ApiResponse(statusCode, data, message));
})

const getServiceAvailability = asyncHandler(async (req, res) => {
    const {serviceId} = req.params;
    const {date} = req.query;

    if(!serviceId || !date) {
        throw new ApiError(400, "Service ID and date are required");
    }

    const {statusCode, data, message} = await checkAvailability(serviceId, date, req.user);

    if (statusCode >= 400) {
        throw new ApiError(statusCode, message);
    }
    return res.status(statusCode).json(new ApiResponse(statusCode, data, message));
})

const getServiceAppointments = asyncHandler(async (req, res) => {
    const {serviceId} = req.params;
    const {date, status, minTime, maxTime, sortBy, sortOrder, page, limit} = req.query;

    if(!serviceId || !date) {
        throw new ApiError(400, "Service ID and date are required");
    }

    const {statusCode, data, pagination, message} = await getAppointments(serviceId, date, status, minTime, maxTime, sortBy, sortOrder, page, limit, req.user);

    if (statusCode >= 400) {
        throw new ApiError(statusCode, message);
    }
    return res.status(statusCode).json(new ApiResponse(statusCode, {data, pagination}, message));
})

const joinQueue = asyncHandler(async (req, res) => {
    const {id} = req.params;

    if(!id) {
        throw new ApiError(400, "Service ID is required");
    }

    const {statusCode, data, message} = await join(id, req.user);

    if (statusCode >= 400) {
        throw new ApiError(statusCode, message);
    }
    return res.status(statusCode).json(new ApiResponse(statusCode, data, message));
})

const getQueueStatus = asyncHandler(async (req, res) => {
    const {id} = req.params;

    if(!id) {
        throw new ApiError(400, "Service ID is required");
    }

    const {statusCode, data, message} = await queueStatus(id, req.user);

    if (statusCode >= 400) {
        throw new ApiError(statusCode, message);
    }
    return res.status(statusCode).json(new ApiResponse(statusCode, data, message));
})

export { createService, deactivateService, getServices, getServiceDetails, reactivateService, updateServiceDetails, updateServiceImages, getServiceAvailability, getServiceAppointments, joinQueue, getQueueStatus } 