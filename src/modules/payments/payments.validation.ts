import { check } from "express-validator";

export const checkoutValidator = [
    check('orderId').escape().not().isEmpty().withMessage('orderId is required').isUUID().withMessage("invalid order id")
]

export const donationCheckoutValidator = [
    check('amount').escape().not().isEmpty().withMessage('Amount is required').isFloat({ gt: 0 }).withMessage("Amount must be a positive number").toInt(),
    check('charityId').escape().not().isEmpty().withMessage('Charity ID is required').isUUID().withMessage("Invalid charity ID"),
    check('isAnonymous').escape().not().isEmpty().withMessage('Anonymous status is required').isBoolean().withMessage("Invalid anonymous status").toBoolean()
]