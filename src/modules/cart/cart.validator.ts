import { body } from 'express-validator';

export const validateCartAdd = [
  body('productId')
    .exists({ checkFalsy: true }).withMessage('productId is required')
    .isUUID().withMessage('productId must be a UUID'),

  body('quantity')
    .exists().withMessage('quantity is required')
    .isInt({ min: 1 }).withMessage('quantity must be a positive integer')
    .toInt(),

  body('extraDonation')
    .optional()
    .isFloat({ min: 0 }).withMessage('extraDonation must be a non-negative number')
    .toFloat(),

  body('extraDonationAnonymous')
    .optional()
    .isBoolean().withMessage('extraDonationAnonymous must be a boolean')
    .toBoolean(),

  body('charities')
    .isArray().withMessage('charities must be an array'),

  body('charities.*.charityId')
    .exists({ checkFalsy: true }).withMessage('charityId is required')
    .isUUID().withMessage('charityId must be a UUID'),
];