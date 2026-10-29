import { body, check, header } from "express-validator";

export const otpVerifyValidator = [
    header('token').trim().not().isEmpty().withMessage('Invalid request').isString(),
    body('otp').trim().not().isEmpty().withMessage('otp token is required').isString()
]

export const otpResendValidator = [
    body('email').trim().not().isEmpty().withMessage("Email address required").isEmail().normalizeEmail({ all_lowercase: true }).withMessage('Invalid Email'),
]
export const otpPhoneResendValidator = [
    body('phone').trim().not().isEmpty().withMessage("Phone number required").isMobilePhone("any").withMessage('Invalid Phone Number'),
]