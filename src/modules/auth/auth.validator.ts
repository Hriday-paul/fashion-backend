import { check } from 'express-validator';
import { parsePhoneNumberFromString } from 'libphonenumber-js'

export const createAccountValidator = [
    check('fname').trim().not().isEmpty().withMessage('First name is required').isString().withMessage('First name should be string').isLength({ min: 1 }).withMessage('First name min length is 1'),

    check('phone').trim().not().isEmpty()
        .custom((value) => {
            // enforce country code (+)
            if (!value.startsWith('+')) {
                throw new Error('Phone number must include country code');
            }

            const phoneNumber = parsePhoneNumberFromString(value);

            if (!phoneNumber || !phoneNumber.isValid()) {
                throw new Error('Invalid phone number');
            }

            return true;
        })
        .customSanitizer((value) => {
            const phoneNumber = parsePhoneNumberFromString(value);
            if (!phoneNumber || !phoneNumber.isValid()) {
                return value;
            }
            return phoneNumber.format('E.164');
        }),

    check('email').trim().not().isEmpty().withMessage("Email address required").isEmail().normalizeEmail({ all_lowercase: true }).withMessage('Invalid Email'),

    check('password').trim().not().isEmpty().withMessage('password is required').isString(),
    
    check('role').trim().not().isEmpty().withMessage('role is required').isIn(["INDIVIDUAL_USER" , "CHARITABLE_ORGANIZATION" , "CHARITY_SHOP" , "ECO_FRIENDLY_STORE" , "CELEBRITY" , "AMBASSADOR" , "PROFESSIONAL_SELLER" , "ASSISTED_SELLER"]),
]

export const addVendorAccountValidator = [
    check('fname').trim().not().isEmpty().withMessage('First name is required').isString().withMessage('First name should be string').isLength({ min: 1 }).withMessage('First name min length is 1'),

    check('phone').trim().not().isEmpty()
        .custom((value) => {
            // enforce country code (+)
            if (!value.startsWith('+')) {
                throw new Error('Phone number must include country code');
            }

            const phoneNumber = parsePhoneNumberFromString(value);

            if (!phoneNumber || !phoneNumber.isValid()) {
                throw new Error('Invalid phone number');
            }

            return true;
        })
        .customSanitizer((value) => {
            const phoneNumber = parsePhoneNumberFromString(value);
            if (!phoneNumber || !phoneNumber.isValid()) {
                return value;
            }
            return phoneNumber.format('E.164');
        }),

    check('email').optional({ checkFalsy: true }).trim().isEmail().normalizeEmail({ all_lowercase: true }).withMessage('Invalid Email'),

    check('address').optional().trim().isString(),

    check('password').trim().not().isEmpty().withMessage('password is required').isString(),
]

export const loginAccountValidator = [
    check('email').trim().not().isEmpty().withMessage("Email address required").isEmail().normalizeEmail({ all_lowercase: true }).withMessage('Invalid Email'),
    check('password').trim().not().isEmpty().withMessage('password is required').isString(),
]

export const refreshTokenValidator = [
    check('refreshToken').trim().not().isEmpty().withMessage('refreshToken is required').isString(),
]

export const forgotPasswordValidator = [
    check('email').trim().not().isEmpty().withMessage("Email address required").isEmail().normalizeEmail({ all_lowercase: true }).withMessage('Invalid Email'),
]

export const resetPasswordValidator = [
    check('newPassword').trim().not().isEmpty().withMessage('newPassword is required'),
    check('confirmPassword').trim().not().isEmpty().withMessage('confirmPassword is required'),
]

export const changePasswordValidator = [
    check('oldPassword').trim().not().isEmpty().withMessage('oldPassword is required').isString(),
    check('newPassword').trim().not().isEmpty().withMessage('newPassword is required').isString(),
    check('confirmPassword').trim().not().isEmpty().withMessage('confirmPassword is required').isString(),
]