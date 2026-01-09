import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

const generateTokens = async (user) => {
    try {
        const u = await User.findById(user._id);
        const accessToken = await u.generateAccessToken();
        const refreshToken = await u.generateRefreshToken();
        u.refreshToken = refreshToken;
        await u.save({ validateBeforeSave: false });
        return { accessToken, refreshToken };
    } catch (error) {
        console.log("Error while generating access and refresh tokens", error);
        return { accessToken: null, refreshToken: null };
    }
}

const signupService = async (name, email, phoneNo, password, identityProofLocalPath) => {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(email) || phoneNo.trim().length !== 10) {
        return { statusCode: 400, message: "Invalid Email or Phone Number." };
    }
    try {
        const existing = await User.findOne({ $or: [{ email }, { phoneNo }] })
        if (existing) {
            return { statusCode: 400, message: "User with this email or phone number already exists" };
        }
        const identityProof = await uploadOnCloudinary(identityProofLocalPath);
        if (!identityProof) {
            return { statusCode: 400, message: "Failed to upload identity proof" };
        }
        const user = await User.create({ name, email, phoneNo, password, identityProof: identityProof.url });
        const createdUser = await User.findById(user._id).select(
            "-password -refreshToken"
        );
        return { statusCode: 201, data: createdUser, message: "Signup Successfull" };

    } catch (error) {
        console.log("Error while creating user", error);
        return { statusCode: 500, message: "Failed to create user" };
    }
};

const loginService = async (email, phoneNo, password) => {
    const user = await User.findOne({ $or: [{ email }, { phoneNo }] });
    if (!user) {
        return { statusCode: 400, message: "User not found" };
    }
    if (!user.isActive) {
        return { statusCode: 401, message: "User account is inactive" };
    }
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
        return { statusCode: 400, message: "Invalid password" };
    }
    const { accessToken, refreshToken } = await generateTokens(user);
    if (!accessToken || !refreshToken) {
        return { statusCode: 500, message: "Failed to generate access and refresh tokens" };
    }
    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    return { statusCode: 200, data: loggedInUser, message: "Login Successfull", accessToken, refreshToken };
};

const refreshTokensService = async (incomingRefreshToken) => {
    try {
        const decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decoded?._id);
        if (!user) {
            return { statusCode: 401, message: "Invalid Refresh Token" };
        }
        if (!user.isActive) {
            return { statusCode: 401, message: "User account is inactive" };
        }
        // console.log(incomingRefreshToken);
        // console.log(user?.refreshToken);
        if (incomingRefreshToken !== user?.refreshToken) {
            return { statusCode: 401, message: "Refresh Token is expired or used" };
        }
        const { accessToken, refreshToken } = await generateTokens(user);
        return { statusCode: 200, data: user, accessToken, refreshToken, message: "Refresh and Access Tokens generated successfully" };

    } catch (error) {
        console.log("Error while generating access and refresh tokens", error);
        return { statusCode: 500, message: "Failed to generate access and refresh tokens" };
    }
}

const logoutService = async (user) => {
    try {
        user.refreshToken = null;
        await user.save({ validateBeforeSave: false });
        return { statusCode: 200, data: {}, message: "Logout Successfull" };
    } catch (error) {
        console.log("Error while logging out", error);
        return { statusCode: 500, message: "Failed to logout" };
    }
}

export { signupService, loginService, refreshTokensService, logoutService }
