import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { createBusinessService, getAllBusinessesService, getBusinessDetailsService, updateBusinessDetailsService, updateDocumentsService, deactivateService, reactivateService } from "../services/business.services.js";

const createBusiness = asyncHandler(async (req, res) => {
    const { name, description, address, contact, type, city, state, gstNo, isActive } = req.body;
    const workingHours = [];
    Object.keys(req.body).forEach((key) => {
        if (key.startsWith("workingHours.")) {
            const [, index, field] = key.split(".");
            if (!workingHours[index]) workingHours[index] = {};
            workingHours[index][field] =
                req.body[key] === "true" ? true :
                    req.body[key] === "false" ? false :
                        req.body[key];
        }
    });
    if (!name || !description || !address || !contact || !type || !city || !state || !gstNo || !workingHours) {
        throw new ApiError(400, "All fields are required");
    }
    const documentsLocalPath = req.file?.path;
    if (!documentsLocalPath) {
        throw new ApiError(400, "Documents are required");
    }
    const { statusCode, data, message } = await createBusinessService(name, description, address, city, state, contact, type, gstNo, documentsLocalPath, workingHours, req.user?._id, isActive);
    if (statusCode >= 400) {
        throw new ApiError(statusCode, message);
    }
    return res.status(statusCode).json(new ApiResponse(statusCode, data, message));
});

const getAllBusinesses = asyncHandler(async (req, res) => {
    const {
        type,
        city,
        state,
        day,
        isOpen,
        currentlyOpen,
        sortBy,
        sortOrder = "asc",
        page,
        limit = 10
    } = req.query;
    const { statusCode, data, pagination, message } = await getAllBusinessesService(type, city, state, day, isOpen, currentlyOpen, sortBy, sortOrder, page, limit);
    if (statusCode >= 400) {
        throw new ApiError(statusCode, message);
    }
    return res.status(statusCode).json(new ApiResponse(statusCode, { data, pagination }, message));
});

const getBusinessDetails = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { statusCode, data, message } = await getBusinessDetailsService(id, req.user);
    if (statusCode >= 400) {
        throw new ApiError(statusCode, message);
    }
    return res.status(statusCode).json(new ApiResponse(statusCode, data, message));
});

const myBusinesses = asyncHandler(async (req, res) => {
    const businesses = req.user?.businesses;
    if (!businesses) {
        throw new ApiError(404, "Businesses not found");
    }
    return res.status(200).json(new ApiResponse(200, businesses, "Businesses fetched successfully"));
});

const updateBusinessDetails = asyncHandler(async (req, res) => {
    const { name, description, type, address, contact, city, state, gstNo, workingHours } = req.body;
    const { id } = req.params;
    const { statusCode, data, message } = await updateBusinessDetailsService(id, { name, description, type, address, contact, city, state, gstNo, workingHours }, req.user);
    if (statusCode >= 400) {
        throw new ApiError(statusCode, message);
    }
    return res.status(statusCode).json(new ApiResponse(statusCode, data, message));
});

const updateDocuments = asyncHandler(async (req, res) => {
    const documentsLocalPath = req.file?.path;
    const { id } = req.params;
    const { statusCode, data, message } = await updateDocumentsService(id, documentsLocalPath, req.user);
    if (statusCode >= 400) {
        throw new ApiError(statusCode, message);
    }
    return res.status(statusCode).json(new ApiResponse(statusCode, data, message));
});

const deactivate = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { statusCode, data, message } = await deactivateService(id, req.user);
    if (statusCode >= 400) {
        throw new ApiError(statusCode, message);
    }
    return res.status(statusCode).json(new ApiResponse(statusCode, data, message));
});

const reactivate = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { statusCode, data, message } = await reactivateService(id, req.user);
    if (statusCode >= 400) {
        throw new ApiError(statusCode, message);
    }
    return res.status(statusCode).json(new ApiResponse(statusCode, data, message));
});

export { createBusiness, getAllBusinesses, getBusinessDetails, myBusinesses, updateBusinessDetails, updateDocuments, deactivate, reactivate }