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

export const validateCartCheckoutTreeGift = [
  body('cartGroupId')
    .exists({ checkFalsy: true }).withMessage('cartGroupId is required')
    .isUUID().withMessage('cartGroupId must be a UUID'),

  body('treeGiftCount')
    .trim()
    .notEmpty().withMessage("treeGiftCount is required")
    .isInt({ min: 0 }).withMessage('treeGiftCount must be a non-negative integer')
    .toInt(),
];

export const validateCartCheckoutAuthentication = [
  body('cartGroupId')
    .exists({ checkFalsy: true }).withMessage('cartGroupId is required')
    .isUUID().withMessage('cartGroupId must be a UUID'),

  body('allowAuthentication')
    .exists().withMessage('allowAuthentication is required')
    .isBoolean().withMessage('allowAuthentication must be a boolean')
    .toBoolean(),
];