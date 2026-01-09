import { User } from "../models/user.models.js";
import { Business } from "../models/business.models.js";
import { Appointment } from "../models/appointment.models.js";
import { QueueItem } from "../models/queueItem.models.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";

const updatePasswordService = async (userId, oldPassword, newPassword) => {
    const user = await User.findById(userId);
    const isPasswordCorrect = await user.comparePassword(oldPassword);

    if (!isPasswordCorrect) {
        return { statusCode: 400, message: "Invalid password." };
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return { statusCode: 200, message: "Password updated successfully." };
}

const updateAccountDetailsService = async (userId, name, email, phoneNo) => {
    try {
        if (email) {
            const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailPattern.test(email)) {
                return { statusCode: 400, message: "Invalid Email." };
            }
        }
        if (phoneNo) {
            if (phoneNo.trim().length !== 10) {
                return { statusCode: 400, message: "Invalid Phone Number." };
            }
        }
        const existingUser = await User.findOne({ $or: [{ email }, { phoneNo }] });
        if (existingUser && existingUser._id.toString() !== userId) {
            return { statusCode: 400, message: "Email or Phone Number already exists." };
        }
        const user = await User.findByIdAndUpdate(userId, { $set: { name, email, phoneNo } }, { new: true }).select("-password -refreshToken");
        return { statusCode: 200, message: "Account details updated successfully.", data: user };
    } catch (error) {
        return { statusCode: 400, message: "Account details update failed." };
    }
}

const deleteAccountService = async (userId, password) => {
    try {
        const user = await User.findById(userId);
        const isPasswordCorrect = await user.comparePassword(password);
        if (!isPasswordCorrect) {
            return { statusCode: 400, message: "Invalid password." };
        }
        if (!user.isActive) {
            return { statusCode: 400, message: "Account is already inactive." };
        }

        const session = await mongoose.startSession();
        session.startTransaction();
        if (user.role === "ADMIN") {
            const businesses = await Business.find({ ownerId: user._id, isActive: true }, { session });
            if (businesses.length > 0) {
                return { statusCode: 400, message: "Deactivate or delete your business before deleting your account" };
            }
        }
        await Appointment.updateMany(
            {
                userId: user._id,
                status: "BOOKED"
            },
            {
                status: "CANCELLED",
            },
            { session }
        );
        await QueueItem.updateMany(
            {
                userId: user._id,
                status: "WAITING"
            },
            {
                status: "CANCELLED",
            },
            { session }
        );
        await User.findByIdAndUpdate(userId, { $set: { isActive: false, refreshToken: null } }, { new: true }, { session });
        session.commitTransaction();
        return { statusCode: 200, message: "Account deactivated successfully." };
    } catch (error) {
        session.abortTransaction();
        return { statusCode: 400, message: "Account deletion failed." };
    }
}

const updateIdentityProofService = async (userId, identityProofLocalPath) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            return { statusCode: 400, message: "User not found." };
        }
        const identityProof = await uploadOnCloudinary(identityProofLocalPath);
        if (!identityProof) {
            return { statusCode: 400, message: "Identity proof upload failed." };
        }
        await deleteFromCloudinary(user.identityProof);
        const updatedUser = await User.findByIdAndUpdate(userId, { $set: { identityProof: identityProof?.url } }, { new: true }).select("-password -refreshToken");
        return { statusCode: 200, message: "Identity proof updated successfully.", data: updatedUser };
    } catch (error) {
        // console.log(error);
        return { statusCode: 400, message: "Identity proof update failed." };
    }
}

export { updatePasswordService, updateAccountDetailsService, deleteAccountService, updateIdentityProofService }