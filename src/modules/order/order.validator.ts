import { body } from 'express-validator';
import { CancelReason } from '../../../generated/prisma/enums';

export const validateOrderProducts = [
    body('cartGroupId')
        .notEmpty()
        .withMessage('cartGroupId is required')
        .isUUID()
        .withMessage('cartGroupId must be a valid UUID'),

    body('shipmentServiceId')
        .notEmpty()
        .withMessage('Shipment service ID is required')
        .isString()
        .withMessage('Shipment service ID must be a valid string'),
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