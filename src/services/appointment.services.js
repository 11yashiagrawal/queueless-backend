import { Appointment } from "../models/appointment.models.js";
import { Service } from "../models/service.models.js";
import { Business } from "../models/business.models.js";
import { getSlotAvailability } from "../utils/availability.js";

const createAppointmentService = async (user, serviceId, businessId, appointmentDate, slotStart, slotEnd, charges) => {
    const service = await Service.findById(serviceId);
    if (!service || !service.isActive) {
        return { statusCode: 404, message: "Service not found" };
    }

    const business = await Business.findById(businessId);
    if (!business || !business.isActive) {
        return { statusCode: 404, message: "Business not found" };
    }

    if (user.role === "ADMIN" && business.userId.toString() === user._id.toString()) {
        return { statusCode: 403, message: "You are not authorized to create an appointment for this business" };
    }

    if (service.businessId.toString() !== businessId) {
        return { statusCode: 403, message: "This service does not belong to this business" };
    }

    const day = appointmentDate.toLocaleString("en-US", { weekday: "long" }).toLowerCase();
    const workingDay = service.availableHours.find(d => d.day == day);
    if (!workingDay) {
        return { statusCode: 400, message: "This service is not available on this day" };
    }
    const appointments = await Appointment.find({
        serviceId: service._id,
        appointmentDate: {
            $gte: new Date(`${date}T00:00:00`),
            $lt: new Date(`${date}T23:59:59`)
        },
        status: { $in: ["BOOKED", "CONFIRMED"] }
    })

    const slots = await getSlotAvailability(service, workingDay, appointmentDate, appointments);
    if (slots.find(slot => slot.startTime === slotStart && slot.endTime === slotEnd)?.available === false) {
        return { statusCode: 400, message: "This service is not available at this time" };
    }

    if (appointmentDate < new Date()) {
        return { statusCode: 400, message: "Appointment date cannot be in the past" };
    }

    if (slotEnd - slotStart < service.avgDurationMinutes) {
        return { statusCode: 400, message: `Slot duration should be minimum of ${service.avgDurationMinutes} minutes` };
    }

    let status = "BOOKED";

    if (service.confirmationMode === "AUTO") {
        status = "CONFIRMED";
    }

    const appointment = await Appointment.create({
        userId: user._id,
        serviceId: service._id,
        businessId: business._id,
        appointmentDate,
        slotStart,
        slotEnd,
        charges,
        status
    });

    return { statusCode: 201, data: appointment, message: "Appointment created successfully" };
}

const getAllAppointmentsService = async (user, serviceId, businessId, status, minTime, maxTime, date, sortBy, sortOrder, page, limit) => {
    const service = await Service.findById(serviceId);
    if (!service || !service.isActive) {
        return { statusCode: 404, message: "Service not found" };
    }

    const business = await Business.findById(businessId);
    if (!business || !business.isActive) {
        return { statusCode: 404, message: "Business not found" };
    }

    if (user.role === "ADMIN" && business.userId.toString() !== user._id.toString()) {
        return { statusCode: 403, message: "You are not authorized to view appointments for this business" };
    }

    if (service.businessId.toString() !== businessId) {
        return { statusCode: 403, message: "This service does not belong to this business" };
    }

    const match = {
        serviceId: serviceId,
        businessId: businessId
    };

    if (status) {
        match.status = status;
    }

    if (date) {
        match.appointmentDate = { $gte: date };
    }

    if (minTime) {
        match.slotStart = { $gte: minTime };
        match.slotEnd = { $gte: minTime };
    }

    if (maxTime) {
        match.slotStart = { $lte: maxTime };
        match.slotEnd = { $lte: maxTime };
    }

    const sort = {};
    if (sortBy) {
        sort[sortBy] = sortOrder === "asc" ? 1 : -1;
    }

    try {
        const appointments = await Appointment.find(match).sort(sort).skip((page - 1) * limit).limit(limit);
        return { statusCode: 200, data: appointments, message: "Appointments fetched successfully" };
    } catch (error) {
        return { statusCode: 500, message: error.message };
    }
}

const getMyAppointmentsService = async (user, status, minTime, maxTime, date, sortBy, sortOrder, page, limit) => {
    const match = {
        userId: user._id
    };

    if (status) {
        match.status = status;
    }

    if (date) {
        match.appointmentDate = { $gte: date };
    }

    if (minTime) {
        match.slotStart = { $gte: minTime };
        match.slotEnd = { $gte: minTime };
    }

    if (maxTime) {
        match.slotStart = { $lte: maxTime };
        match.slotEnd = { $lte: maxTime };
    }

    const sort = {};
    if (sortBy) {
        sort[sortBy] = sortOrder === "asc" ? 1 : -1;
    }

    try {
        const appointments = await Appointment.find(match).sort(sort).skip((page - 1) * limit).limit(limit);
        return { statusCode: 200, data: appointments, message: "Appointments fetched successfully" };
    } catch (error) {
        return { statusCode: 500, message: error.message };
    }
}

const updateAppointmentAdminService = async (user, appointmentId, date, slotStart, slotEnd, charges) => {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
        return { statusCode: 404, message: "Appointment not found" };
    }

    if (appointment.businessId.toString() !== user.business._id.toString()) {
        return { statusCode: 403, message: "You are not authorized to update this appointment" };
    }

    if (appointment.status === "CANCELLED" || appointment.status === "COMPLETED") {
        return { statusCode: 400, message: "Appointment cannot be updated as it is already cancelled or completed" };
    }
    const service = await Service.findById(appointment.serviceId);
    if (date || slotStart || slotEnd) {
        const day = new Date(date).toLocaleString("en-US", { weekday: "long" }).toLowerCase();
        const workingDay = service.availableHours.find(d => d.day == day);
        if (!workingDay) {
            return { statusCode: 400, message: "This service is not available on this day" };
        }
        const appointments = await Appointment.find({
            serviceId: service._id,
            appointmentDate: {
                $gte: new Date(`${date}T00:00:00`),
                $lt: new Date(`${date}T23:59:59`)
            },
            status: { $in: ["BOOKED", "CONFIRMED"] }
        })
        const slots = await getSlotAvailability(service, workingDay, new Date(date), appointments);
        if (slots.find(slot => slot.startTime === slotStart && slot.endTime === slotEnd)?.available === false) {
            return { statusCode: 400, message: "This service is not available at this time" };
        }
    }

    try {
        const updatedAppointment = await Appointment.findByIdAndUpdate(appointmentId, {
            appointmentDate: new Date(date) || appointment.appointmentDate,
            slotStart: slotStart || appointment.slotStart,
            slotEnd: slotEnd || appointment.slotEnd,
            charges: charges || appointment.charges
        }, { new: true });
        return { statusCode: 200, data: updatedAppointment, message: "Appointment updated successfully" };
    } catch (error) {
        return { statusCode: 500, message: error.message };
    }
}

const cancelAppointmentAdminService = async (user, appointmentId, cancelReason) => {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
        return { statusCode: 404, message: "Appointment not found" };
    }

    if (appointment.businessId.toString() !== user.business._id.toString()) {
        return { statusCode: 403, message: "You are not authorized to cancel this appointment" };
    }

    if (appointment.status === "CANCELLED" || appointment.status === "COMPLETED") {
        return { statusCode: 400, message: "Appointment cannot be cancelled as it is already cancelled or completed" };
    }

    try {
        const updatedAppointment = await Appointment.findByIdAndUpdate(appointmentId, {
            status: "CANCELLED"
        }, { new: true });
        return { statusCode: 200, data: { appointment: updatedAppointment, reason: cancelReason }, message: "Appointment cancelled successfully" };
    } catch (error) {
        return { statusCode: 500, message: error.message };
    }
}

const rescheduleAppointmentService = async (user, appointmentId, date, slotStart, slotEnd) => {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
        return { statusCode: 404, message: "Appointment not found" };
    }

    if ((user.role == "CUSTOMER" && appointment.userId.toString() !== user._id.toString()) || (user.role == "ADMIN" && appointment.businessId.toString() !== user.business._id.toString())) {
        return { statusCode: 403, message: "You are not authorized to reschedule this appointment" };
    }

    if (appointment.status === "CANCELLED" || appointment.status === "COMPLETED") {
        return { statusCode: 400, message: "Appointment cannot be rescheduled as it is already cancelled or completed" };
    }

    const service = await Service.findById(appointment.serviceId);
    if (date || slotStart || slotEnd) {
        const day = new Date(date).toLocaleString("en-US", { weekday: "long" }).toLowerCase();
        const workingDay = service.availableHours.find(d => d.day == day);
        if (!workingDay) {
            return { statusCode: 400, message: "This service is not available on this day" };
        }
        const appointments = await Appointment.find({
            serviceId: service._id,
            appointmentDate: {
                $gte: new Date(`${date}T00:00:00`),
                $lt: new Date(`${date}T23:59:59`)
            },
            status: { $in: ["BOOKED", "CONFIRMED"] }
        })
        const slots = await getSlotAvailability(service, workingDay, new Date(date), appointments);
        if (slots.find(slot => slot.startTime === slotStart && slot.endTime === slotEnd)?.available === false) {
            return { statusCode: 400, message: "This service is not available at this time" };
        }
    }

    let status = "BOOKED";
    if(service.confirmationMode == "AUTO" && user.role == "CUSTOMER") {
        status = "CONFIRMED";
    }

    try {
        const updatedAppointment = await Appointment.findByIdAndUpdate(appointmentId, {
            appointmentDate: new Date(date) || appointment.appointmentDate,
            slotStart: slotStart || appointment.slotStart,
            slotEnd: slotEnd || appointment.slotEnd,
            status: status
        }, { new: true });
        return { statusCode: 200, data: updatedAppointment, message: "Appointment rescheduled successfully" };
    } catch (error) {
        return { statusCode: 500, message: error.message };
    }
}

const changeStatusService = async (user, appointmentId, status) => {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
        return { statusCode: 404, message: "Appointment not found" };
    }

    if (appointment.businessId.toString() !== user.business._id.toString()) {
        return { statusCode: 403, message: "You are not authorized to change the status of this appointment" };
    }

    if (appointment.status === "COMPLETED") {
        return { statusCode: 400, message: "Appointment cannot be changed as it has already been completed" };
    }

    try {
        const updatedAppointment = await Appointment.findByIdAndUpdate(appointmentId, {
            status: status.toUpperCase()
        }, { new: true });
        return { statusCode: 200, data: updatedAppointment, message: "Appointment status changed successfully" };
    } catch (error) {
        return { statusCode: 500, message: error.message };
    }
}

const getAppointmentByIdService = async(user, id) => {
    const appointment = await Appointment.findById(id);
    if(!appointment) {
        return { statusCode: 404, message: "Appointment not found" };
    }

    if((user.role == "CUSTOMER" && appointment.userId.toString() !== user._id.toString()) || (user.role == "ADMIN" && appointment.businessId.toString() !== user.business._id.toString())) {
        return { statusCode: 403, message: "You are not authorized to view this appointment" };
    }

    return { statusCode: 200, data: appointment, message: "Appointment fetched successfully" };
}

const cancelAppointmentService = async(user, id) => {
    const appointment = await Appointment.findById(id);
    if(!appointment) {
        return { statusCode: 404, message: "Appointment not found" };
    }

    if((user.role == "CUSTOMER" && appointment.userId.toString() !== user._id.toString()) || (user.role == "ADMIN" && appointment.businessId.toString() !== user.business._id.toString())) {
        return { statusCode: 403, message: "You are not authorized to cancel this appointment" };
    }

    if(appointment.status === "CANCELLED" || appointment.status === "COMPLETED") {
        return { statusCode: 400, message: "Appointment cannot be cancelled as it is already cancelled or completed" };
    }

    try {
        const updatedAppointment = await Appointment.findByIdAndUpdate(id, {
            status: "CANCELLED"
        }, { new: true });
        return { statusCode: 200, data: updatedAppointment, message: "Appointment cancelled successfully" };
    } catch (error) {
        return { statusCode: 500, message: error.message };
    }
}

export { createAppointmentService, getAllAppointmentsService, getMyAppointmentsService, updateAppointmentAdminService, cancelAppointmentAdminService, rescheduleAppointmentService, changeStatusService, getAppointmentByIdService, cancelAppointmentService }