import { body } from "express-validator";

export const payoutValidator = [
    body('amount').escape().not().isEmpty().withMessage('Amount is required').isFloat({ gt: 0 }).withMessage("Amount must be a positive number").toFloat()
]