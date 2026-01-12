import { Business } from "../models/business.models.js";
import { Service } from "../models/service.models.js";
import { ServiceQueue } from "../models/serviceQueue.models.js";
import { QueueItem } from "../models/queueItem.models.js";
import { Appointment } from "../models/appointment.models.js";
import { User } from "../models/user.models.js";
import mongoose from "mongoose";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";

const createBusinessService = async (name, description, address, city, state, contact, type, gstNo, documentsLocalPath, workingHours, ownerId, isActive) => {
    let session;
    let uploadedDocuments;
    try {
        uploadedDocuments = await uploadOnCloudinary(documentsLocalPath);
        if (!uploadedDocuments) {
            return { statusCode: 400, message: "Documents upload failed" };
        }
        session = await mongoose.startSession();
        session.startTransaction();
        const business = await Business.create([{ name, description, address, city, state, contact, type, gstNo, documents: uploadedDocuments?.url, workingHours, ownerId, isActive }], { session });
        const updatedUser = await User.findByIdAndUpdate(ownerId, { role: "ADMIN" }, { new: true, session });
        if (!updatedUser) {
            return { statusCode: 404, message: "User not found" };
        }
        await session.commitTransaction();
        return { statusCode: 201, data: business[0], message: "Business created successfully" };
    } catch (error) {
        await session.abortTransaction();
        await deleteFromCloudinary(uploadedDocuments?.url);
        return { statusCode: 500, message: error.message };
    } finally {
        await session.endSession();
    }
}

const getAllBusinessesService = async (type, city, state, day, isOpen, currentlyOpen, sortBy, sortOrder, page, limit) => {
    const match = {
        isActive: true
    }
    if (type) {
        match.type = type.toLowerCase();
    }
    if (city) {
        match.city = city.toLowerCase();
    }
    if (state) {
        match.state = state.toLowerCase();
    }
    const now = new Date();
    const currentDay = now.toLocaleString("en-US", { weekday: "long" }).toLowerCase();
    const currentTime = now.toTimeString().slice(0, 5);
    const pipeline = [
        { $match: match },
        { $unwind: "$workingHours" }
    ];
    if (day) {
        pipeline.push({
            $match: {
                "workingHours.day": day.toLowerCase(),
                ...(isOpen !== undefined && {
                    "workingHours.isOpen": isOpen === "true"
                })
            }
        });
    }
    if (currentlyOpen === "true") {
        pipeline.push({
            $match: {
                "workingHours.day": currentDay,
                "workingHours.isOpen": true,
                "workingHours.opensAt": { $lte: currentTime },
                "workingHours.closesAt": { $gte: currentTime }
            }
        });
    }
    if (sortBy === "opensAt" || sortBy === "closesAt") {
        pipeline.push({
            $sort: {
                [`workingHours.${sortBy}`]: sortOrder === "desc" ? -1 : 1
            }
        });
    }
    const pageNum = Math.max(parseInt(page) || 1, 1);
    const pageSize = Math.min(parseInt(limit) || 10, 50);

    const skip = (pageNum - 1) * pageSize;
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: pageSize });

    try {
        const businesses = await Business.aggregate(pipeline);
        pipeline.push({ $count: "total" })
        const count = await Business.aggregate(pipeline);
        console.log("count", count)
        return { statusCode: 200, data: businesses, pagination: { page: pageNum, limit: pageSize, total: count[0]?.total || 0, totalPages: Math.ceil((count[0]?.total || 0) / pageSize) }, message: "Businesses fetched successfully" };
    } catch (error) {
        return { statusCode: 500, message: error.message };
    }
}

const getBusinessDetailsService = async (id, user) => {
    try {
        const business = await Business.findById(id);
        if (!business) {
            return { statusCode: 404, message: "Business not found" };
        }
        if (!business.isActive) {
            if (user.role !== "ADMIN" || business.ownerId.toString() !== user.id) {
                return { statusCode: 403, message: "Sorry, you are not authorised to view this Business" };
            }
        }
        return { statusCode: 200, data: business, message: "Business fetched successfully" };
    } catch (error) {
        return { statusCode: 500, message: error.message };
    }
}

const updateBusinessDetailsService = async (id, { name, description, type, address, contact, city, state, gstNo, workingHours }, user) => {
    try {
        const business = await Business.findById(id);
        if (!business) {
            return { statusCode: 404, message: "Business not found" };
        }
        if (business.ownerId.toString() !== user.id) {
            return { statusCode: 403, message: "Sorry, you are not authorised to update this Business" };
        }
        const updatedBusiness = await Business.findByIdAndUpdate(id, { name, description, type, address, contact, city, state, gstNo, workingHours }, { new: true });
        return { statusCode: 200, data: updatedBusiness, message: "Business updated successfully" };
    } catch (error) {
        return { statusCode: 500, message: error.message };
    }
}

const updateDocumentsService = async (id, documentsLocalPath, user) => {
    try {
        const business = await Business.findById(id);
        if (!business) {
            return { statusCode: 404, message: "Business not found" };
        }
        if (business.ownerId.toString() !== user.id) {
            return { statusCode: 403, message: "Sorry, you are not authorised to update this Business" };
        }
        const documents = await uploadOnCloudinary(documentsLocalPath);
        if (!documents) {
            return { statusCode: 400, message: "Documents upload failed" };
        }
        await deleteFromCloudinary(business.documents);
        business.documents = documents?.url;
        await business.save();
        return { statusCode: 200, data: business, message: "Documents updated successfully" };
    } catch (error) {
        return { statusCode: 500, message: error.message };
    }
}

const deactivateService = async (id, user) => {
    let session;
    try {
        const business = await Business.findById(id);
        if (!business) {
            return { statusCode: 404, message: "Business not found" };
        }
        if (business.ownerId.toString() !== user.id) {
            return { statusCode: 403, message: "Sorry, you are not authorised to deactivate this Business" };
        }
        session = await mongoose.startSession();
        await session.startTransaction();
        business.isActive = false;
        await Service.updateMany({ businessId: id }, { isActive: false }, { session });
        await ServiceQueue.updateMany({ businessId: id, }, { status: "CLOSED" }, { session });
        await QueueItem.updateMany({ businessId: id, status: "WAITING" }, { status: "CANCELLED" }, { session });
        await Appointment.updateMany({ businessId: id, status: { $in: ["BOOKED", "CONFIRMED"] } }, { status: "CANCELLED" }, { session });
        await business.save({ session });
        await session.commitTransaction();
        return { statusCode: 200, data: business, message: "Business deactivated successfully" };
    } catch (error) {
        await session.abortTransaction();
        return { statusCode: 500, message: error.message };
    } finally {
        session.endSession();
    }
}

const reactivateService = async (id, user) => {
    try {
        const business = await Business.findById(id);
        if (!business) {
            return { statusCode: 404, message: "Business not found" };
        }
        if (business.ownerId.toString() !== user.id) {
            return { statusCode: 403, message: "Sorry, you are not authorised to reactivate this Business" };
        }
        if (business.isActive) {
            return { statusCode: 400, message: "Business is already active" };
        }
        business.isActive = true;
        await business.save();
        return { statusCode: 200, data: business, message: "Business reactivated successfully" };
    } catch (error) {
        return { statusCode: 500, message: error.message };
    }
}

export { createBusinessService, getAllBusinessesService, getBusinessDetailsService, updateBusinessDetailsService, updateDocumentsService, deactivateService, reactivateService }