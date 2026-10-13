import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import { otpServices } from './otp.service';
import sendResponse from '../../utils/sendResponse';
import { Request, Response } from 'express';

const verifyOtp = catchAsync(async (req: Request, res: Response) => {
  const token = req?.headers?.token;
  const result = await otpServices.verifyOtp(token as string, req.body.otp);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'OTP verified successfully',
    data: result,
  });
});

const resendOtp = catchAsync(async (req: Request, res: Response) => {
  const result = await otpServices.resendOtp(req?.body?.email);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'OTP sent successfully',
    data: result,
  });
});

const resendOtpIntoPhone = catchAsync(async (req: Request, res: Response) => {
  const result = await otpServices.resendOtpIntoPhone(req?.body?.phone, req?.user?.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'OTP sent successfully',
    data: result,
  });
});

const phoneVerifyOtp = catchAsync(async (req: Request, res: Response) => {
  const token = req?.headers?.token || req?.body?.token;
  const result = await otpServices.verifyPhoneOtp(token as string, req.body.otp);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'OTP verified successfully',
    data: result,
  });
});

export const otpControllers = {
  verifyOtp,
  resendOtp,
  phoneVerifyOtp,
  resendOtpIntoPhone
};
