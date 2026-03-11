import { check } from "express-validator";

export const checkoutValidator = [
    check('reservationId').escape().not().isEmpty().withMessage('reservationId is required').isInt().withMessage("invalid reservation id").toInt()
]