import { Request, Response } from "express";
import { authService } from "./auth.service"
import sendResponse from "../../utils/sendResponse";
import httpStatus from 'http-status'
import { otpServices } from "../otp/otp.service";
import catchAsync from "../../utils/catchAsync";
import prisma from "../../shared/prisma";
import AppError from "../../error/AppError";

//create user
const createUser = catchAsync(async (req: Request, res: Response) => {

    // check userName is exist or not
    const exist = await prisma.user.findFirst({ where: { userName: req.body?.userName } });

    if (exist) {
        throw new AppError(httpStatus.CONFLICT, "User name already exist");
    }

    const result = await authService.createUser(req.body);

    let otptoken;

    if (!result?.auth?.isverified) {
        otptoken = await otpServices.resendOtp(result?.email);
    }

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'user register successfully',
        data: { otpToken: otptoken },
    });
})

//create user
const socialSignUp = catchAsync(async (req: Request, res: Response) => {

    // check userName is exist or not
    const exist = await prisma.user.findFirst({ where: { userName: req.body?.userName } });

    if (exist) {
        throw new AppError(httpStatus.CONFLICT, "User name already exist");
    }

    const result = await authService.socialSignUp(req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Signup successfully',
        data: result,
    });
})

//login user
const loginUser = catchAsync(async (req: Request, res: Response) => {

    const result = await authService.loginUser(req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Logged in successfully',
        data: result,
    });
})

const adminLogin = catchAsync(async (req: Request, res: Response) => {
    const result = await authService.adminLogin(req.body)

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Logged in successfully',
        data: result,
    });
})

// change password
const changePassword = catchAsync(async (req: Request, res: Response) => {
    const result = await authService.changePassword(req?.user?.id, req.body);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Password changed successfully',
        data: result,
    });
});

// forgot password
const forgotPassword = catchAsync(async (req: Request, res: Response) => {
    const result = await authService.forgotPassword(req?.body?.email);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'An OTP sent to your email!',
        data: result,
    });
});

//reset password
const resetPassword = catchAsync(async (req: Request, res: Response) => {
    const result = await authService.resetPassword(
        req?.headers?.token as string,
        req?.body,
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Password reset successfully',
        data: result,
    });
});


// refresh token
const refreshToken = catchAsync(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    const result = await authService.refreshToken(refreshToken);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Access token retrieved successfully',
        data: result,
    });
});

export const authController = {
    createUser,
    loginUser,
    socialSignUp,
    adminLogin,
    changePassword,
    resetPassword,
    forgotPassword,
    refreshToken
}