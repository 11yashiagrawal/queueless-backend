import mongoose from "mongoose";

const workingHoursSchema = new mongoose.Schema({
    day: {
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        required: true
    },
    opensAt: {
        type: String,  // "09:00"
        required: true,
        default: "09:00"
    },
    closesAt: {
        type: String,  // "18:00"
        required: true,
        default: "18:00"
    },
    isOpen: {
        type: Boolean,
        default: true
    }
});

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
    type: {
        type: String,
        required: true,
        lowercase: true
    },
    avgDurationMinutes: {
        type: Number,
        required: true,
        index: true
    },
    bufferMinutes: {
        type: Number,
        required: true,
        index: true
    },
    availableHours: {
        type: [workingHoursSchema],
        validate: {
            validator: function (arr) {
                const days = arr.map(d => d.day);
                return days.length === new Set(days).size;
            },
            message: "Duplicate days not allowed"
        },
        required: true
    },
    images: {
        type: [String]
    },
    chargesPerAppointment: {
        type: Number,
        required: true,
        index: true
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