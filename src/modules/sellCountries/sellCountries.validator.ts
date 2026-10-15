import { body, ValidationChain } from "express-validator";

export const addSellCountryValidator: ValidationChain[] = [
    body('name')
        .trim()
        .notEmpty().withMessage('name is required'),
    body('code')
        .trim()
        .notEmpty().withMessage('code is required'),
];

