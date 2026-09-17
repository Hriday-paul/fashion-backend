import { body } from "express-validator";

export const addBrandValidator = [
    body('name').trim().not().isEmpty().withMessage('name is required'),
    body('categoryId').trim().not().isEmpty().withMessage('categoryId is required'),
]