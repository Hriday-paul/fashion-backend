import { body } from 'express-validator';
import { CancelReason } from '../../../generated/prisma/enums';

export const validateOrderProducts = [
    body('products')
        .isArray({ min: 1 })
        .withMessage('Products must be a non-empty array'),

    body('treeCredit')
        .optional()
        .isInt({ min: 0 })
        .withMessage('treeCredit must be a positive integer').toInt(),

    body('products.*.productId')
        .notEmpty()
        .withMessage('productId is required')
        .isUUID()
        .withMessage('productId must be a valid UUID'),

    body('products.*.quantity')
        .notEmpty()
        .withMessage('quantity is required')
        .isInt({ min: 1 })
        .withMessage('quantity must be a positive non-zero integer').toInt(),

    body('products.*.extra_donation')
        .optional()
        .isInt({ min: 0 })
        .withMessage('extra donation must be a positive integer').toInt(),

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

export const cancelOrderItemValidator = [
    body('orderItemId')
        .notEmpty()
        .withMessage('Item ID is required')
        .isUUID()
        .withMessage('Item ID must be a valid ID'),

    body('reason')
        .notEmpty()
        .withMessage('Cancellation reason is required')
        .isIn(Object.values(CancelReason))
        .withMessage('Invalid cancellation reason'),

    body("details")
        .optional()
        .isString()
        .withMessage('Reason details must be a string')

]

export const validateOrderReceivedmark = [
    body('orderId')
        .notEmpty()
        .withMessage('Order ID is required')
        .isUUID()
        .withMessage('Order ID must be a valid ID')
]

export const validateApproveCancelReq = [
    body('orderItemId')
        .notEmpty()
        .withMessage('Item ID is required')
        .isUUID()
        .withMessage('Item ID must be a valid ID'),

]