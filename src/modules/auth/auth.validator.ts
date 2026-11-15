import { body, type Meta } from "express-validator";
import { parsePhoneNumberFromString } from 'libphonenumber-js'
import { Role } from '../../../generated/prisma/enums';
import { allRoles } from "../user/user.rout";

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

export const userNameCheckerValidator = [
    body('userName').trim().not().isEmpty().withMessage('Username is required').isString().withMessage('Username should be string').isLength({ min: 1 }).withMessage('Username min length is 1'),
]

const forRole = (role: Role) =>(_value: unknown, { req }: Meta) =>
    req.user?.role === role;

const requiredString = (field: string, role: Role) =>
  body(`${field}`)
    .if(forRole(role))
    .isString()
    .withMessage(`${field} must be a string`)
    .bail()
    .trim()
    .notEmpty()
    .withMessage(`${field} is required`)
    .bail()
    .isLength({ max: 255 })
    .withMessage(`${field} must not exceed 255 characters`);

const optionalString = (field: string, role: Role) =>
  body(`${field}`)
    .if(forRole(role))
    .optional({ values: "null" })
    .isString()
    .withMessage(`${field} must be a string`)
    .bail()
    .trim()
    .isLength({ max: 255 })
    .withMessage(`${field} must not exceed 255 characters`);

export const roleVerificationValidator = [

  // INDIVIDUAL_USER
  optionalString("dateOfBirth", Role.INDIVIDUAL_USER),
  optionalString("identityType", Role.INDIVIDUAL_USER),
  optionalString("identityCountry", Role.INDIVIDUAL_USER),
  optionalString("identityNumber", Role.INDIVIDUAL_USER),
  optionalString("identityDocumentKey", Role.INDIVIDUAL_USER),
  optionalString("identityBackKey", Role.INDIVIDUAL_USER),

  // CHARITABLE_ORGANIZATION
  requiredString("legalName", Role.CHARITABLE_ORGANIZATION),
  requiredString("registrationCountry", Role.CHARITABLE_ORGANIZATION),
  requiredString("authorizedPersonName", Role.CHARITABLE_ORGANIZATION),
  requiredString("authorizedPersonRole", Role.CHARITABLE_ORGANIZATION),
  optionalString("registrationNumber", Role.CHARITABLE_ORGANIZATION),
  optionalString("registeredAddress", Role.CHARITABLE_ORGANIZATION),
  optionalString("registrationDocumentKey", Role.CHARITABLE_ORGANIZATION),
  optionalString("authorizationDocumentKey", Role.CHARITABLE_ORGANIZATION),

  // CHARITY_SHOP
  requiredString("shopName", Role.CHARITY_SHOP),
  requiredString("operatorType", Role.CHARITY_SHOP),
  optionalString("legalBusinessName", Role.CHARITY_SHOP),
  optionalString("businessRegistrationNumber", Role.CHARITY_SHOP),
  optionalString("registrationCountry", Role.CHARITY_SHOP),
  optionalString("charityRegistrationNumber", Role.CHARITY_SHOP),
  optionalString("charityRelationship", Role.CHARITY_SHOP),
  optionalString("authorizationDocumentKey", Role.CHARITY_SHOP),
  optionalString("registrationDocumentKey", Role.CHARITY_SHOP),

  // ECO_FRIENDLY_STORE
  requiredString("storeName", Role.ECO_FRIENDLY_STORE),
  requiredString("sustainabilityDescription", Role.ECO_FRIENDLY_STORE),
  optionalString("legalBusinessName", Role.ECO_FRIENDLY_STORE),
  optionalString("businessRegistrationNumber", Role.ECO_FRIENDLY_STORE),
  optionalString("registrationCountry", Role.ECO_FRIENDLY_STORE),
  optionalString("certificationName", Role.ECO_FRIENDLY_STORE),
  optionalString("certificationIssuer", Role.ECO_FRIENDLY_STORE),
  optionalString("certificationNumber", Role.ECO_FRIENDLY_STORE),
  optionalString("certificationDocumentKey", Role.ECO_FRIENDLY_STORE),

  // CELEBRITY
  requiredString("legalName", Role.CELEBRITY),
  requiredString("publicName", Role.CELEBRITY),
  optionalString("profession", Role.CELEBRITY),
  optionalString("officialWebsite", Role.CELEBRITY),
  optionalString("identityDocumentKey", Role.CELEBRITY),
  optionalString("publicIdentityEvidenceKey", Role.CELEBRITY),

  body("officialProfileUrls")
    .if(forRole(Role.CELEBRITY))
    .optional()
    .isArray({ max: 10 })
    .withMessage("officialProfileUrls must be an array of up to 10 URLs"),

  body("officialProfileUrls.*")
    .if(forRole(Role.CELEBRITY))
    .isURL({ require_protocol: true })
    .withMessage("Each profile URL must be a valid URL"),

  // AMBASSADOR
  requiredString("ambassadorType", Role.AMBASSADOR),
  optionalString("instagramUsername", Role.AMBASSADOR),
  optionalString("tiktokUsername", Role.AMBASSADOR),
  optionalString("about", Role.AMBASSADOR),
  optionalString("agreementVersion", Role.AMBASSADOR),

  // PROFESSIONAL_SELLER
  requiredString("legalBusinessName", Role.PROFESSIONAL_SELLER),
  requiredString("businessType", Role.PROFESSIONAL_SELLER),
  requiredString("registrationCountry", Role.PROFESSIONAL_SELLER),
  optionalString("tradingName", Role.PROFESSIONAL_SELLER),
  optionalString("businessRegistrationNumber", Role.PROFESSIONAL_SELLER),
  optionalString("registeredAddress", Role.PROFESSIONAL_SELLER),
  optionalString("registrationDocumentKey", Role.PROFESSIONAL_SELLER),
  optionalString("taxIdentificationNumber", Role.PROFESSIONAL_SELLER),
];
