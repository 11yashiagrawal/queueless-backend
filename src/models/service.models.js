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
    availableHours: {
        type: Number,
        required: true
    },
    images: {
        type: [String]
    },
    isActive: {
        type: Boolean,
        default: true
    },
    confirmationMode: {
        type: String,
        enum: ["AUTO", "MANUAL"],
        default: "AUTO",
        required: true
    }
}, 
{
    timestamps: true
});

export const Service = mongoose.model("Service", serviceSchema);