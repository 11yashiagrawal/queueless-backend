import { asyncHandler } from "../utils/asyncHandler.js";
import { signupService, loginService, refreshTokensService, logoutService } from "../services/auth.services.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const signup = asyncHandler(async (req, res) => {
    const { name, email, phoneNo, password } = req.body;

    if (!name || !email || !phoneNo || !password) {
        throw new ApiError(400, "All fields are required");
    }

    const identityProofLocalPath = req.file?.path;

    if (!identityProofLocalPath) {
        throw new ApiError(400, "Identity proof is required");
    }

    const { statusCode, data, message } = await signupService(name, email, phoneNo, password, identityProofLocalPath);

    if (statusCode >= 400) {
        throw new ApiError(statusCode, message)
    }
    return res.status(statusCode).json(new ApiResponse(statusCode, data, message));
})

const login = asyncHandler(async (req, res) => {
    const { email, phoneNo, password } = req.body;

    if (!(email || phoneNo) || !password) {
        throw new ApiError(400, "Email or Phone Number and Password are required");
    }

    const { statusCode, data, message, accessToken, refreshToken } = await loginService(email, phoneNo, password);

    if (statusCode >= 400) {
        throw new ApiError(statusCode, message)
    }

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/"
    };

    return res
        .status(statusCode)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(statusCode, data, message));
})

const refreshTokens = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized Request.");
  }

  const {statusCode, data, refreshToken, accessToken, message} = await refreshTokensService(incomingRefreshToken);

  const options = {
      httpOnly: true,
      secure: true,
    };

    if(statusCode>=400) {
        throw new ApiError(statusCode, message)
    }

    return res
    .status(statusCode)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(statusCode, data, message));
})

const logout = asyncHandler(async (req, res) => {
    const {statusCode, data, message} = await logoutService(req.user);
    if(statusCode>=400) {
        throw new ApiError(statusCode, message)
    }
    const options = {
        httpOnly: true,
    secure: true,
    }
    return res
    .status(statusCode)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(statusCode, data, message));
})

export { signup, login, refreshTokens, logout }