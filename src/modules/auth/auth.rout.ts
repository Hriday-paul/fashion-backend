import { Router } from "express";
import { authController } from "./auth.controller";
import { changePasswordValidator, createAccountValidator, forgotPasswordValidator, loginAccountValidator, refreshTokenValidator, resetPasswordValidator } from "./auth.validator";
import req_validator from "../../middleware/req_validation";
import { otpResendValidator, otpVerifyValidator } from "../otp/otp.validation";
import { otpControllers } from "../otp/otp.controller";
import auth from "../../middleware/auth";
import { Role } from "../../../generated/prisma/enums";
import { document_Upload } from "../../utils/s3";
import parseData from "../../middleware/parseData";

const router = Router();

router.post('/create',
    document_Upload.array('documents'),
    parseData(),
    createAccountValidator,
    req_validator(),
    authController.createUser
)

router.post('/login',
    loginAccountValidator,
    req_validator(),
    authController.loginUser
)

router.post('/admin/login',
    loginAccountValidator,
    req_validator(),
    authController.adminLogin
)

router.patch(
    '/change-password',
    changePasswordValidator,
    req_validator(),
    auth(Role.ADMIN, Role.INDIVIDUAL_USER, Role.AMBASSADOR, Role.ASSISTED_SELLER, Role.CELEBRITY, Role.CHARITABLE_ORGANIZATION, Role.CHARITY_SHOP, Role.ECO_FRIENDLY_STORE, Role.PROFESSIONAL_SELLER),
    authController.changePassword,
);

router.post('/refresh',
    refreshTokenValidator,
    req_validator(),
    authController.refreshToken
)

router.post(
    '/verify-otp',
    otpVerifyValidator,
    req_validator(),
    otpControllers.verifyOtp,
);

router.post(
    '/resend-otp',
    otpResendValidator,
    req_validator(),
    otpControllers.resendOtp,
);

router.post('/forgot-password', forgotPasswordValidator, req_validator(), authController.forgotPassword);
router.patch('/reset-password', resetPasswordValidator, req_validator(), authController.resetPassword);

export const authRouts = router