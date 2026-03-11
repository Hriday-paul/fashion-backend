import { check } from "express-validator";

export const addCategoryValidator = [
    check('name').trim().not().isEmpty().withMessage('name is required'),
]

export const addBrandValidator = [
    check('name').trim().not().isEmpty().withMessage('name is required'),
    check('categoryId').trim().not().isEmpty().withMessage('categoryId is required'),
]

export const addSizeValidator = [
    check('title').trim().not().isEmpty().withMessage('title is required'),
    check('categoryId').trim().not().isEmpty().withMessage('categoryId is required'),
]