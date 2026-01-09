import mongoose from "mongoose";

const queueItemSchema = new mongoose.Schema({
    serviceQueueId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ServiceQueue",
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
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    tokenNumber: {
        type: Number,
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ["APPOINTMENT", "WALKIN", "INTERNAL_BLOCK"],
        default: "APPOINTMENT",
        required: true
    },
    status: {
        type: String,
        enum: ["WAITING", "IN_PROGRESS", "COMPLETED", "SKIPPED", "CANCELLED"],
        required: true,
        index: true
    },
    estimatedStartTime: {
        type: Date,
        required: true
    },
    actualStartTime: {
        type: Date,
    },
    actualEndTime: {
        type: Date,
    },
}, {
    timestamps: true
})

queueItemSchema.index({userId: 1, createdAt: 1})

export const QueueItem = mongoose.model("QueueItem", queueItemSchema);