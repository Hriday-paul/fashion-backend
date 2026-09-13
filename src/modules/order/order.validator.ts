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

        body('allowedAuthentication')
        .notEmpty()
        .withMessage('allowedAuthentication is required')
        .isBoolean()
        .withMessage('allowedAuthentication must be a valid boolean').toBoolean(),

    body('treeGiftCount')
        .notEmpty()
        .withMessage('treeGiftCount is required')
        .isInt({ min: 0 })
        .withMessage('treeGiftCount must be a non-negative integer').toInt(),
];

export const cancelItemsValidator = [
    body("orderId")
        .trim()
        .notEmpty()
        .withMessage("Order ID is required")
        .isUUID()
        .withMessage("Invalid order ID"),

    body("itemIds")
        .isArray({ min: 1 })
        .withMessage("At least one item ID is required"),

    body("itemIds.*")
        .trim()
        .notEmpty()
        .withMessage("Item ID cannot be empty")
        .isUUID()
        .withMessage("Invalid item ID"),

    body("cancelReason")
        .isIn(Object.values(CancelReason))
        .withMessage("Invalid cancel reason"),

    body("cancelReasonDescription")
        .trim()
        .notEmpty()
        .withMessage("Cancel reason description is required")
        .isLength({ min: 5 })
        .withMessage(
            "Cancel reason description must be at least 5 characters"
        ),
];

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