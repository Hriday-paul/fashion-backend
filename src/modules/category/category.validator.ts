import { check } from "express-validator";

export const addCategoryValidator = [
    check('name').trim().not().isEmpty().withMessage('name is required'),
]