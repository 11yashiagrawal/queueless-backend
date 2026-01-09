import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { updatePasswordService, updateAccountDetailsService, deleteAccountService, updateIdentityProofService } from "../services/user.services.js";

const password = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "Old Password and New Password are required");
    }

    const { statusCode, message } = await updatePasswordService(req.user?._id, oldPassword, newPassword);

    if (statusCode >= 400) {
        throw new ApiError(statusCode, message)
    }
    return res.status(statusCode).json(new ApiResponse(statusCode, {}, message));
})

const accountDetails = asyncHandler(async (req, res) => {
    const { name, email, phoneNo } = req.body;

    if (!name && !email && !phoneNo) {
        throw new ApiError(400, "No fields to update");
    }

    const { statusCode, data, message } = await updateAccountDetailsService(req.user?._id, name, email, phoneNo);

    if (statusCode >= 400) {
        throw new ApiError(statusCode, message)
    }
    return res.status(statusCode).json(new ApiResponse(statusCode, data, message));
})

const account = asyncHandler(async (req, res) => {
    const { statusCode, message } = await deleteAccountService(req.user?._id);

    if (statusCode >= 400) {
        throw new ApiError(statusCode, message)
    }
    return res.status(statusCode).json(new ApiResponse(statusCode, message));
})

const identityProof = asyncHandler(async (req, res) => {
    const identityProofLocalPath = req.file?.path;
    if (!identityProofLocalPath) {
        throw new ApiError(400, "Identity Proof is required");
    }
    const { statusCode, data, message } = await updateIdentityProofService(req.user?._id, identityProofLocalPath);

    if (statusCode >= 400) {
        throw new ApiError(statusCode, message)
    }
    return res.status(statusCode).json(new ApiResponse(statusCode, data, message));
})

const user = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "User retrieved successfully."));
})

export { password, accountDetails, account, identityProof, user }