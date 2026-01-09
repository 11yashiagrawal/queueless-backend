import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema({
    businessId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Business",
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    avgDurationMinutes: {
        type: Number,
        required: true
    },
    bufferMinutes: {
        type: Number
    },
    images: {
        type: [String]
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, 
{
    timestamps: true
});

export const Service = mongoose.model("Service", serviceSchema);