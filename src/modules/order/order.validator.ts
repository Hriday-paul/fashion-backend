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
];