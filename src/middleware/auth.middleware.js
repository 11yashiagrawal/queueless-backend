import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import { Business } from "../models/business.models.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unathorized Access");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "Unathorized Access Token");
    }

    if (!user.isActive) {
      throw new ApiError(401, "User account is inactive");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Access Token");
  }
});

export const verifyAdmin = asyncHandler(async (req, res, next) => {
  try {
    if (req.user?.role !== "ADMIN") {
      throw new ApiError(401, "Unauthorized Access");
    }
    const businesses = await Business.find({
      ownerId: req.user?._id
    })
    if (!businesses) {
      throw new ApiError(401, "Unauthorized Access");
    }
    req.user.businesses = businesses;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Unauthorized Access");
  }
});