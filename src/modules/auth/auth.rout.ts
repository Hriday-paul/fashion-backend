import { Router } from "express";
import { authController } from "./auth.controller";
import { changePasswordValidator, createAccountValidator, forgotPasswordValidator, loginAccountValidator, refreshTokenValidator, resetPasswordValidator, socialSignInValidator, socialSignupValidator, userNameCheckerValidator } from "./auth.validator";
import req_validator from "../../middleware/req_validation";
import { otpPhoneResendValidator, otpResendValidator, otpVerifyValidator } from "../otp/otp.validation";
import { otpControllers } from "../otp/otp.controller";
import auth from "../../middleware/auth";
import { Role } from "../../../generated/prisma/enums";
import { rateLimiter } from "../../middleware/RateLimiter";
import { allRoles } from "../user/user.rout";

const router = Router();

router.post('/create',
    rateLimiter(),
    createAccountValidator,
    req_validator(),
    authController.createUser
)

router.post('/social-signup',
    rateLimiter(),
    socialSignupValidator,
    req_validator(),
    authController.socialSignUp
)

router.post('/login',
    rateLimiter(),
    loginAccountValidator,
    req_validator(),
    authController.loginUser
)
router.post('/login/social',
    rateLimiter(),
    socialSignInValidator,
    req_validator(),
    authController.socialLogin
)

router.post('/admin/login',
    rateLimiter(),
    loginAccountValidator,
    req_validator(),
    authController.adminLogin
)

router.patch(
    '/change-password',
    rateLimiter(),
    changePasswordValidator,
    req_validator(),
    auth(Role.ADMIN, Role.INDIVIDUAL_USER, Role.AMBASSADOR, Role.ASSISTED_SELLER, Role.CELEBRITY, Role.CHARITABLE_ORGANIZATION, Role.CHARITY_SHOP, Role.ECO_FRIENDLY_STORE, Role.PROFESSIONAL_SELLER),
    authController.changePassword,
);

router.post('/refresh',
    // refreshTokenValidator,
    // req_validator(),
    authController.refreshToken
)

router.post(
    '/verify-otp',
    rateLimiter(),
    otpVerifyValidator,
    req_validator(),
    otpControllers.verifyOtp,
);

router.post(
    '/verify-phone-otp',
    rateLimiter(),
    otpVerifyValidator,
    req_validator(),
    otpControllers.phoneVerifyOtp,
);

router.post(
    '/resend-otp',
    rateLimiter({ windowMs: 1 * 60 * 1000, max: 2, msg: 'Only 2 request allowed per minutes. please try again after a minute' }),
    otpResendValidator,
    req_validator(),
    otpControllers.resendOtp,
);

router.post(
    '/resend-phone-otp',
    rateLimiter({ windowMs: 1 * 60 * 1000, max: 2, msg: 'Only 2 request allowed per minutes. please try again after a minute' }),
    auth(...allRoles),
    otpPhoneResendValidator,
    req_validator(),
    otpControllers.resendOtpIntoPhone,
);

router.post('/check-username',
    userNameCheckerValidator,
    req_validator(),
    authController.usernameChacker
)

router.post('/forgot-password',
    rateLimiter({ windowMs: 1 * 60 * 1000, max: 2, msg: 'Only 2 request allowed per minutes. please try again after a minute' }),
    forgotPasswordValidator, req_validator(), authController.forgotPassword);

router.patch('/reset-password',
    rateLimiter(),
    resetPasswordValidator, req_validator(), authController.resetPassword);

export const authRouts = router