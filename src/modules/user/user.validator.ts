import { check, body } from "express-validator";

export const statusUpdateValidator = [
    check('status').not().isEmpty().withMessage('status is required').isBoolean().withMessage("status must be boolean").toBoolean(),
]

export const validateBillingDetails = [
  body('country')
    .notEmpty()
    .withMessage('country is required')
    .isString()
    .withMessage('country must be a string')
    .isLength({ min: 2, max: 100 })
    .withMessage('country must be between 2 and 100 characters'),

  body('full_name')
    .optional()
    .isString()
    .withMessage('Full name must be a string')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),

  body('address1')
    .notEmpty()
    .withMessage('address1 is required')
    .isString()
    .withMessage('address1 must be a string'),

  body('address2')
    .optional()
    .isString()
    .withMessage('address2 must be a string'),

  body('zip_code')
    .notEmpty()
    .withMessage('zip code is required')
    .isPostalCode('any')
    .withMessage('zip code must be a valid'),

  body('city')
    .notEmpty()
    .withMessage('city is required')
    .isString()
    .withMessage('city must be a string'),

  body('contact')
    .notEmpty()
    .withMessage('contact is required')
    .isMobilePhone('any')
    .withMessage('contact must be a valid phone number')
];