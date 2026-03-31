import { body } from 'express-validator';

export const validateOrderProducts = [
    body('products')
        .isArray({ min: 1 })
        .withMessage('Products must be a non-empty array'),

    body('products.*.productId')
        .notEmpty()
        .withMessage('productId is required')
        .isUUID()
        .withMessage('productId must be a valid UUID'),

    body('products.*.quantity')
        .notEmpty()
        .withMessage('quantity is required')
        .isInt({ min: 1 })
        .withMessage('quantity must be a positive non-zero integer'),

    body('products.*.extra_donation')
        .optional()
        .isInt({ min: 1 })
        .withMessage('extra donation must be a positive non-zero integer'),

    body('products.*.charities')
        .optional()
        .isArray()
        .withMessage('charities must be an array'),

    // ✅ Validate each charityId inside the array
    body('products.*.charities.*')
        .optional()
        .isUUID()
        .withMessage('charityId must be a valid UUID'),
];