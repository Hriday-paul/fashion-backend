import { body } from "express-validator";

export const thanksSendValidator = [
    body('message').not().isEmpty().withMessage('Message is required'),
    body('msgType').not().isEmpty().withMessage('msgType is required').isIn(['SELL', 'DIRECT', 'CLOTH']).withMessage('msgType must be one of SELL, DIRECT, CLOTH'),
    body('referenceId').not().isEmpty().withMessage('referenceId is required'),
]