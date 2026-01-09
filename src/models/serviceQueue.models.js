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
        required: true
    },
    lastTokenIssued: {
        type: Number,
        required: true
    },
    currentToken: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ["ACTIVE", "PAUSED", "CLOSED"],
        required: true
    },
    appointmentQueue: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "QueueItem",
        required: true
    },
    walkInQueue: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "QueueItem",
        required: true
    }
}, {
    timestamps: true
});

serviceQueueSchema.index({ serviceId: 1, queueDate: 1 }, { unique: true });

export const ServiceQueue = mongoose.model("ServiceQueue", serviceQueueSchema);