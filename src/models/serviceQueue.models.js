import mongoose from "mongoose";

const serviceQueueSchema = new mongoose.Schema({
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
    queueDate: {
        type: Date,
        required: true,
        default: new Date()
    },
    lastTokenIssued: {
        type: Number,
        required: true,
        default: 0
    },
    currentToken: {
        type: Number,
        required: true,
        default: 0
    },
    status: {
        type: String,
        enum: ["ACTIVE", "PAUSED", "CLOSED"],
        required: true,
        default: "ACTIVE"
    },
    appointmentQueue: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "QueueItem",
        required: true,
        default: []
    },
    walkInQueue: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "QueueItem",
        required: true,
        default: []
    }
}, {
    timestamps: true
});

serviceQueueSchema.index({ serviceId: 1, queueDate: 1 }, { unique: true });

export const ServiceQueue = mongoose.model("ServiceQueue", serviceQueueSchema);