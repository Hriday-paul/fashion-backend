import { check } from "express-validator";

export const checkoutValidator = [
    check('orderId').escape().not().isEmpty().withMessage('orderId is required').isUUID().withMessage("invalid order id")
]