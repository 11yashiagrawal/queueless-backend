import { User } from "../models/user.models.js";
import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js";

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
        const existingUser = await User.findOne({$or: [{email}, {phoneNo}] });
        if (existingUser && existingUser._id.toString() !== userId) {
            return { statusCode: 400, message: "Email or Phone Number already exists." };
        }
       const user = await User.findByIdAndUpdate(userId, { $set: { name, email, phoneNo } }, { new: true }).select("-password -refreshToken"); 
       return { statusCode: 200, message: "Account details updated successfully.", data: user };
    } catch (error) {
        return { statusCode: 400, message: "Account details update failed." };
    }
}

const deleteAccountService = async (userId) => {
    try {
        const user = await User.findByIdAndDelete(userId);
        return { statusCode: 200, message: "Account deleted successfully." };
    } catch (error) {
        return { statusCode: 400, message: "Account deletion failed." };
    }
}

const updateIdentityProofService = async (userId, identityProofLocalPath) => {
    try {
        const user = await User.findById(userId);
        if(!user) {
            return { statusCode: 400, message: "User not found." };
        }
        const identityProof = await uploadOnCloudinary(identityProofLocalPath);
        if(!identityProof) {
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