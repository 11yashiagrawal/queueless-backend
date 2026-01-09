import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
        required: true
    },
    businessId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Business",
        required: true
    },
    appointmentDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    slotStart: {
        type: timestamps,
        required: true,
        default: Date.now
    },
    slotEnd: {
        type: timestamps,
        required: true
    },
    status: {
        type: String,
        enum: ["BOOKED", "CANCELLED", "NO_SHOW", "COMPLETED"],
        required: true,
        default: "BOOKED"
    }
}, 
{
    timestamps: true
})

appointmentSchema.index({serviceId: 1, appointmentDate: 1}, {unique: true});

export const Appointment = mongoose.model("Appointment", appointmentSchema);