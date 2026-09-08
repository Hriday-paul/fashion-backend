import { body } from 'express-validator';
import { parsePhoneNumberFromString } from 'libphonenumber-js'

export const createAccountValidator = [
    body('fname').trim().not().isEmpty().withMessage('First name is required').isString().withMessage('First name should be string').isLength({ min: 1 }).withMessage('First name min length is 1'),
    body('userName').trim().not().isEmpty().withMessage('Username is required').isString().withMessage('Username should be string').isLength({ min: 1 }).withMessage('Username min length is 1'),

    body("phone")
        .optional({ values: "falsy" })
        .trim()
        .custom((value) => {
            // Enforce country code (+)
            if (!value.startsWith("+")) {
                throw new Error("Phone number must include country code");
            }

            const phoneNumber = parsePhoneNumberFromString(value);

            if (!phoneNumber || !phoneNumber.isValid()) {
                throw new Error("Invalid phone number");
            }

            return true;
        })
        .customSanitizer((value) => {
            const phoneNumber = parsePhoneNumberFromString(value);

            if (!phoneNumber || !phoneNumber.isValid()) {
                return value;
            }

            return phoneNumber.format("E.164");
        }),

    body('email').trim().not().isEmpty().withMessage("Email address required").isEmail().normalizeEmail({ all_lowercase: true }).withMessage('Invalid Email'),

    body('password').trim().not().isEmpty().withMessage('password is required').isString(),

    body('role').trim().not().isEmpty().withMessage('role is required').isIn(["INDIVIDUAL_USER", "CHARITABLE_ORGANIZATION", "CHARITY_SHOP", "ECO_FRIENDLY_STORE", "CELEBRITY", "AMBASSADOR", "PROFESSIONAL_SELLER", "ASSISTED_SELLER"])
];

export const socialSignupValidator = [
    body('fname').trim().not().isEmpty().withMessage('First name is required').isString().withMessage('First name should be string').isLength({ min: 1 }).withMessage('First name min length is 1'),

    body('userName').trim().not().isEmpty().withMessage('Username is required').isString().withMessage('Username should be string').isLength({ min: 1 }).withMessage('Username min length is 1'),

    body('role').trim().not().isEmpty().withMessage('role is required').isIn(["INDIVIDUAL_USER", "CHARITABLE_ORGANIZATION", "CHARITY_SHOP", "ECO_FRIENDLY_STORE", "CELEBRITY", "AMBASSADOR", "PROFESSIONAL_SELLER", "ASSISTED_SELLER"]),

    body('idToken').trim().not().isEmpty().withMessage('Id token is required').isString(),
]

export const socialSignInValidator = [
    body('idToken').trim().not().isEmpty().withMessage('Id token is required').isString(),
]

export const loginAccountValidator = [
    body('email').trim().not().isEmpty().withMessage("Email address required").isEmail().normalizeEmail({ all_lowercase: true }).withMessage('Invalid Email'),
    body('password').trim().not().isEmpty().withMessage('password is required').isString(),
]

export const refreshTokenValidator = [
    body('refreshToken').trim().not().isEmpty().withMessage('refreshToken is required').isString(),
]

export const forgotPasswordValidator = [
    body('email').trim().not().isEmpty().withMessage("Email address required").isEmail().normalizeEmail({ all_lowercase: true }).withMessage('Invalid Email'),
]

export const resetPasswordValidator = [
    body('newPassword').trim().not().isEmpty().withMessage('newPassword is required'),
    body('confirmPassword').trim().not().isEmpty().withMessage('confirmPassword is required'),
]

export const changePasswordValidator = [
    body('oldPassword').trim().not().isEmpty().withMessage('oldPassword is required').isString(),
    body('newPassword').trim().not().isEmpty().withMessage('newPassword is required').isString(),
    body('confirmPassword').trim().not().isEmpty().withMessage('confirmPassword is required').isString(),
]