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

const businessSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        lowercase: true
    },
    description: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    contact: {
        type: BigInt,
        required: true,
        unique: true
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    gstNo: {
        type: String,
        required: true
    },
    documents: {
        type: String,
        required: true
    },
    workingHours: {
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
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

export const Business = mongoose.model("Business", businessSchema);