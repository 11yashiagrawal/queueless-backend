import { Service } from "../models/service.models.js";
import { Business } from "../models/business.models.js";
import { ServiceQueue } from "../models/serviceQueue.models.js";
import { QueueItem } from "../models/queueItem.models.js";
import { Appointment } from "../models/appointment.models.js";
import mongoose from "mongoose";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { getSlotAvailability, getQueueAvailability } from "../utils/availability.js";

const create = async (businessId, name, description, type, avgDurationMinutes, bufferMinutes, availableHours, chargesPerAppointment, isActive, confirmationMode, imagesLocalPaths, user) => {

    const business = user.businesses.filter(b => b?._id == businessId);
    if (!business.length) {
        return { statusCode: 403, message: "Either this Business not found or you are not authorized to create a service for it" };
    }

    const images = await Promise.all(imagesLocalPaths.map(async (localPath) => {
        const result = await uploadOnCloudinary(localPath);
        return result?.url;
    }));
    try {
        const service = await Service.create({
            businessId,
            name,
            description,
            type,
            avgDurationMinutes: Number(avgDurationMinutes),
            bufferMinutes: Number(bufferMinutes),
            availableHours,
            chargesPerAppointment: Number(chargesPerAppointment),
            isActive,
            confirmationMode,
            images
        });

        return { statusCode: 201, data: service, message: "Service created successfully" };
    } catch (error) {
        await Promise.all(images.map(async (url) => {
            await deleteFromCloudinary(url);
        }));
        return { statusCode: 500, message: error.message };
    }
}

const updateDetails = async (id, name, description, type, avgDurationMinutes, bufferMinutes, availableHours, chargesPerAppointment, confirmationMode, user) => {
    try {
        const service = await Service.findById(id);
        if (!service) {
            return { statusCode: 404, message: "Service not found" };
        }

        const businessId = user.businesses.filter(b => b?._id.toString() == service.businessId.toString());
        if (!businessId.length) {
            return { statusCode: 403, message: "You are not authorized to update this service" };
        }

        const updatedService = await Service.findByIdAndUpdate(id, {
            name,
            description,
            type,
            avgDurationMinutes: Number(avgDurationMinutes || service.avgDurationMinutes),
            bufferMinutes: Number(bufferMinutes || service.bufferMinutes),
            availableHours,
            chargesPerAppointment: Number(chargesPerAppointment || service.chargesPerAppointment),
            confirmationMode
        }, { new: true });

        if (!updatedService) {
            return { statusCode: 404, message: "Service not found" };
        }

        return { statusCode: 200, data: updatedService, message: "Service updated successfully" };
    } catch (error) {
        return { statusCode: 500, message: error.message };
    }
}

const updateImages = async (id, imagesLocalPaths, user) => {

    const service = await Service.findById(id);
    if (!service) {
        return { statusCode: 404, message: "Service not found" };
    }

    const businessId = user.businesses.filter(b => b?._id.toString() == service.businessId.toString());

    if (!businessId.length) {
        return { statusCode: 403, message: "You are not authorized to update this service" };
    }

    const newImages = await Promise.all(imagesLocalPaths.map(async (localPath) => {
        const result = await uploadOnCloudinary(localPath);
        return result?.url;
    }));
    try {
        const updatedService = await Service.findByIdAndUpdate(id, {
            images: [...service.images, ...newImages]
        }, { new: true });

        if (!updatedService) {
            return { statusCode: 404, message: "Service not found" };
        }

        return { statusCode: 200, data: updatedService, message: "Service updated successfully" };
    } catch (error) {
        await Promise.all(images.map(async (url) => {
            await deleteFromCloudinary(url);
        }));
        return { statusCode: 500, message: error.message };
    }
}

const deactivate = async (id, user) => {
    const service = await Service.findById(id);
    if (!service || service.isActive === false) {
        return { statusCode: 404, message: "Service is either already deactivated or not found" };
    }

    const businessId = user.businesses.filter(b => b?._id.toString() == service.businessId.toString());

    if (!businessId.length) {
        return { statusCode: 403, message: "You are not authorized to deactivate this service" };
    }

    let session;
    try {
        session = await mongoose.startSession();
        session.startTransaction();

        await Appointment.updateMany({ serviceId: id, status: { $in: ["BOOKED", "CONFIRMED"] } }, { status: "CANCELLED" }, { session });
        await ServiceQueue.updateMany({ serviceId: id }, { status: "CLOSED" }, { session });
        await QueueItem.updateMany({ serviceId: id, status: "WAITING" }, { status: "CANCELLED" }, { session });
        const updatedService = await Service.findByIdAndUpdate(id, {
            isActive: false
        }, { new: true });

        if (!updatedService) {
            return { statusCode: 404, message: "Service not found" };
        }

        await session.commitTransaction();
        return { statusCode: 200, data: updatedService, message: "Service deactivated successfully" };
    } catch (error) {
        if (session) {
            await session.abortTransaction();
        }
        return { statusCode: 500, message: error.message };
    } finally {
        if (session) {
            session.endSession();
        }
    }
}

const reactivate = async (id, user) => {
    const service = await Service.findById(id);
    if (!service || service.isActive === true) {
        return { statusCode: 404, message: "Service is either already activated or not found" };
    }

    const businessId = user.businesses.filter(b => b?._id.toString() == service.businessId.toString());

    if (!businessId.length) {
        return { statusCode: 403, message: "You are not authorized to reactivate this service" };
    }
    try {
        const updatedService = await Service.findByIdAndUpdate(id, {
            isActive: true
        }, { new: true });

        if (!updatedService) {
            return { statusCode: 404, message: "Service not found" };
        }

        return { statusCode: 200, data: updatedService, message: "Service reactivated successfully" };
    } catch (error) {
        return { statusCode: 500, message: error.message };
    }
}

const getDetails = async (id, user) => {
    const service = await Service.findById(id);
    if (!service) {
        return { statusCode: 404, message: "Service not found" };
    }
    const business = await Business.findById(service.businessId);
    if (!service.isActive) {
        if (user.role !== "ADMIN" || business?.ownerId.toString() !== user._id.toString()) {
            return { statusCode: 403, message: "You are not authorized to view this service" };
        }
    }
    return { statusCode: 200, data: service, message: "Service details fetched successfully" };
}

const getAll = async (businessId, type, minTime, maxTime, day, isOpen, currentlyOpen, confirmationMode, minCharge, maxCharge, sortBy, sortOrder, page, limit, user) => {
    let match = {}
    const business = await Business.findById(businessId)
    console.log("business", business)
    if (user.role !== "ADMIN" || business.ownerId.toString() !== user._id.toString()) {
        match.isActive = true
    }
    if (businessId) {
        match.businessId = new mongoose.Types.ObjectId(businessId)
    }
    if (type) {
        match.type = type
    }
    if (confirmationMode) {
        match.confirmationMode = confirmationMode
    }
    if (minCharge) {
        match.chargesPerAppointment = { $gte: minCharge }
    }
    if (maxCharge) {
        match.chargesPerAppointment = { $lte: maxCharge }
    }

    const pipeline = [
        { $match: match }
    ];

    if (minTime || maxTime) {
        pipeline.push({
            $addFields: {
                totalMinutes: { $add: ['$avgDurationMinutes', '$bufferMinutes'] }
            }
        },
            {
                $match: {
                    totalMinutes: { $gte: minTime || 0, $lte: maxTime || 100000000 }
                }
            })
    }
    const now = new Date();
    const currentDay = now.toLocaleString("en-US", { weekday: "long" }).toLowerCase();
    const currentTime = now.toTimeString().slice(0, 5);

    if (day) {
        pipeline.push({
            $match: {
                "availableHours.day": day.toLowerCase(),
                ...(isOpen !== undefined && {
                    "availableHours.isOpen": isOpen === "true"
                })
            }
        });
    }
    if (currentlyOpen === "true") {
        pipeline.push({
            $match: {
                "availableHours.day": currentDay,
                "availableHours.isOpen": true,
                "availableHours.opensAt": { $lte: currentTime },
                "availableHours.closesAt": { $gte: currentTime }
            }
        });
    }

    if (sortBy == "timeTaken") {
        pipeline.push({
            $sort: {
                totalMinutes: sortOrder === "asc" ? 1 : -1
            }
        })
    }

    if (sortBy == "charges") {
        pipeline.push({
            $sort: {
                chargesPerAppointment: sortOrder === "asc" ? 1 : -1
            }
        })
    }

    const pageNum = Math.max(parseInt(page) || 1, 1);
    const pageSize = Math.min(parseInt(limit) || 10, 50);

    const skip = (pageNum - 1) * pageSize;
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: pageSize });

    try {
        const result = await Service.aggregate(pipeline);
        const total = result.length;
        return { statusCode: 200, data: result, pagination: { page: pageNum, limit: pageSize, total: total || 0, totalPages: Math.ceil((total || 0) / pageSize) } };
    } catch (error) {
        return { statusCode: 500, message: error.message };
    }
}

const checkAvailability = async (serviceId, date, user) => {
    try {
        const todayDate = new Date(date);
        const day = todayDate.toLocaleString("en-US", { weekday: "long" }).toLowerCase();

        const service = await Service.findById(serviceId);
        if (!service || !service.isActive) {
            return { statusCode: 404, message: "Service is either deactivated or not found" };
        }

        const business = await Business.findById(service.businessId);
        if (!business || !business.isActive) {
            return { statusCode: 404, message: "Business is either deactivated or not found" };
        }

        const workingDay = service.availableHours.find(d => d.day == day);
        if (!workingDay || !workingDay.isOpen) {
            return { statusCode: 404, message: "Service is not available on this day" };
        }

        const appointments = await Appointment.find({
            serviceId: service._id,
            appointmentDate: {
                $gte: new Date(`${date}T00:00:00`),
                $lt: new Date(`${date}T23:59:59`)
            },
            status: { $in: ["BOOKED", "CONFIRMED"] }
        })

        const queue = await ServiceQueue.findOne({
            serviceId: service._id,
            queueDate: {
                $gte: new Date(`${date}T00:00:00`),
                $lt: new Date(`${date}T23:59:59`)
            }
        })

        const existing = await QueueItem.findOne({
            serviceQueueId: queue._id,
            userId: user._id,
            status: { $in: ["WAITING", "IN_PROGRESS"] }
        });

        const items = await QueueItem.find({
            serviceQueueId: queue._id,
            status: { $in: ["WAITING", "IN_PROGRESS"] }
        })

        const appointmentAvailability = await getSlotAvailability(service, workingDay, date, appointments);
        const queueAvailability = await getQueueAvailability(service, date, workingDay, queue, existing, items);
        return { statusCode: 200, data: { appointmentAvailability, queueAvailability }, message: "Service availability checked successfully" };
    } catch (error) {
        return { statusCode: 500, message: error.message };
    }

}

const getAppointments = async (serviceId, date, status, minTime, maxTime, sortBy, sortOrder, page, limit, user) => {
    try {
        const service = await Service.findById(serviceId);
        if (!service || !service.isActive) {
            return { statusCode: 404, message: "Service is either deactivated or not found" };
        }
        const business = await Business.findById(service.businessId);
        if (!business || !business.isActive) {
            return { statusCode: 404, message: "Business is either deactivated or not found" };
        }
        if (business.ownerId.toString() !== user._id.toString()) {
            return { statusCode: 403, message: "You are not authorized to view this service" };
        }
        const match = {
            serviceId,
            businessId: business._id,
            appointmentDate: {
                $gte: new Date(`${date}T00:00:00`),
                $lt: new Date(`${date}T23:59:59`)
            }
        }
        if (status) {
            match.status = status;
        }
        if (minTime) {
            match.slotStart = {
                $gte: new Date(minTime)
            }
        }
        if (maxTime) {
            match.slotEnd = {
                $lte: new Date(maxTime)
            }
        }
        const total = await Appointment.countDocuments(match);
        const pagination = {
            page: page || 1,
            limit: limit || 10,
            total,
            totalPages: Math.ceil(total / (limit || 10))
        }
        if (!sortBy || !sortOrder) {
            sortBy = "slotStart";
            sortOrder = "asc";
        }
        const appointments = await Appointment.find(match).sort({
            [sortBy]: sortOrder
        }).skip((page - 1) * limit).limit(limit);
        return { statusCode: 200, data: appointments, pagination, message: "Appointments fetched successfully" };
    } catch (error) {
        return { statusCode: 500, message: error.message };
    }
}

const join = async (serviceId, user) => {
    let session;

    try {
        const service = await Service.findById(serviceId);
        if (!service || !service.isActive) {
            return { statusCode: 404, message: "Service is either deactivated or not found" };
        }

        const business = await Business.findById(service.businessId);
        if (!business || !business.isActive) {
            return { statusCode: 404, message: "Business is either deactivated or not found" };
        }

        const now = new Date();
        const day = now.toLocaleString("en-US", { weekday: "long" }).toLowerCase();
        const todayHours = service.availableHours.find(d => d.day === day);

        if (!todayHours || !todayHours.isOpen) {
            return { statusCode: 400, message: "Service is not available today" };
        }

        session = await mongoose.startSession();
        session.startTransaction();

        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);

        let queue = await ServiceQueue.findOne({
            serviceId: service._id,
            queueDate: { $gte: startOfDay, $lte: endOfDay }
        }).session(session);

        if (!queue) {
            queue = await ServiceQueue.create([{
                serviceId: service._id,
                businessId: business._id,
                queueDate: startOfDay,
                lastTokenIssued: 0,
                currentToken: 0,
                status: "ACTIVE",
                appointmentQueue: [],
                walkInQueue: []
            }], { session });

            queue = queue[0];
        }

        const alreadyInQueue = await QueueItem.findOne({
            serviceQueueId: queue._id,
            userId: user._id,
            status: { $in: ["WAITING", "IN_PROGRESS"] }
        }).session(session);

        if (alreadyInQueue) {
            await session.abortTransaction();
            return {
                statusCode: 400,
                message: "You are already in the queue"
            };
        }

        const availability = await getQueueAvailability(
            service,
            null,
            now,
            todayHours
        );

        if (!availability.available) {
            await session.abortTransaction();
            return {
                statusCode: 400,
                message: availability.message
            };
        }

        queue.lastTokenIssued += 1;

        if (queue.lastTokenIssued === 1) {
            queue.currentToken = 1;
        }

        await queue.save({ session });

        const status =
            queue.lastTokenIssued === 1 ? "IN_PROGRESS" : "WAITING";

        const queueItem = await QueueItem.create([{
            serviceQueueId: queue._id,
            serviceId: service._id,
            businessId: business._id,
            userId: user._id,
            tokenNumber: queue.lastTokenIssued,
            type: "WALKIN",
            status,
            estimatedStartTime: availability.estimatedStartTime
        }], { session });

        queue.walkInQueue.push(queueItem[0]._id);
        await queue.save({ session });

        await session.commitTransaction();

        return {
            statusCode: 200,
            data: {
                queueItem: queueItem[0],
                tokenNumber: queue.lastTokenIssued,
                position: availability.position,
                estimatedStartTime: availability.estimatedStartTime
            },
            message: "Joined queue successfully"
        };

    } catch (error) {
        if (session) await session.abortTransaction();
        return { statusCode: 500, message: error.message };
    } finally {
        if (session) session.endSession();
    }
};

const queueStatus = async (serviceId, user) => {
    try {
        const service = await Service.findById(serviceId);
        if (!service || !service.isActive) {
            return { statusCode: 404, message: "Service is either deactivated or not found" };
        }
        const business = await Business.findById(service.businessId);
        if (!business || !business.isActive) {
            return { statusCode: 404, message: "Business is either deactivated or not found" };
        }
        const now = new Date();
        const day = now.toLocaleString("en-US", { weekday: "long" }).toLowerCase();
        const todayHours = service.availableHours.find(d => d.day === day);
        if (!todayHours || !todayHours.isOpen) {
            return { statusCode: 400, message: "Service is not available today" };
        }
        const today = new Date()
        const queue = await ServiceQueue.findOne({
            serviceId: service._id,
            queueDate: {
                $gte: new Date(today.setHours(0, 0, 0, 0)),
                $lt: new Date(today.setHours(23, 59, 59, 999))
            }
        })
        if (!queue) {
            return { statusCode: 200, data: { "queueStatus": "NOT_FOUND" }, message: "Queue has not started yet." };
        }
        const queueItems = await QueueItem.find({
            serviceQueueId: queue._id,
            status: { $in: ["WAITING", "IN_PROGRESS"] }
        }).sort({ tokenNumber: 1 });
        const waitingAppointments = queueItems.filter(item => item.status === "WAITING" && item.type === "APPOINTMENT");
        const waitingWalkins = queueItems.filter(item => item.status === "WAITING" && item.type === "WALKIN");
        const inProgress = queueItems.filter(item => item.status === "IN_PROGRESS");
        const completed = await QueueItem.find({
            serviceQueueId: queue._id,
            status: "COMPLETED"
        }).sort({ tokenNumber: 1 });
        const waiting = queueItems.filter(item => item.status === "WAITING");

        const baseTime = inProgress[0]?.actualStartTime ?? new Date();

        const avgSlotMs =
            (service.avgDurationMinutes + service.bufferMinutes) * 60000;

        const nextAvailable = new Date(
            baseTime.getTime() + waiting.length * avgSlotMs
        );
        const myItem = queueItems.find(q => q.userId.equals(user._id));
        let myETA;
        let ahead;
        if (myItem) {
            ahead = queueItems.filter(
                q => q.tokenNumber < myItem.tokenNumber &&
                    q.status === "WAITING"
            ).length;

            myETA = new Date(
                baseTime.getTime() + ahead * avgSlotMs
            );
        }
        let warning = "";
        const closingTime = new Date(
            `${today}T${todayHours.closesAt}:00`
        );
        if (myETA > closingTime) {
            warning = "Service is likely to close before your turn"
        }
        return { statusCode: 200, data: { queueStatus: queue.status, currentToken: queue.currentToken, lastTokenIssued: queue.lastTokenIssued, waitingAppointments: waitingAppointments.length, waitingWalkins: waitingWalkins.length, inProgress: inProgress.length, completed: completed.length, nextAvailable, warning, inQueue: myItem ? true : false, tokenNumber: myItem ? myItem.tokenNumber : null, ahead, estimatedStartTime: myETA }, message: "Queue status fetched successfully" };
    } catch (error) {
        return { statusCode: 500, message: error.message };
    }
}

export { create, deactivate, reactivate, updateDetails, updateImages, getAll, getDetails, checkAvailability, getAppointments, join, queueStatus }