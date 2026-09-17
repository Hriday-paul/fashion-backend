import { body } from "express-validator";

export const addSizeToCategoryValidator = [
    body('categoryId').trim().not().isEmpty().withMessage('categoryId is required').isUUID().withMessage('categoryId must be a valid UUID'),

    body('sizes')
        .isArray({ min: 1 })
        .withMessage('sizes must be an array and cannot be empty'),

    body('sizes.*.sizeId').trim().not().isEmpty().withMessage('sizeId is required').isUUID().withMessage('sizeId must be a valid UUID'),
]

export const removeSizeFromCategoryValidator = [
    body('categoryId').trim().not().isEmpty().withMessage('categoryId is required').isUUID().withMessage('categoryId must be a valid UUID'),
    body('sizeId').trim().not().isEmpty().withMessage('sizeId is required').isUUID().withMessage('sizeId must be a valid UUID'),
]

export const addNewSizeValidator = [
    body('title').trim().not().isEmpty().withMessage('Intl size is required'),
    body('UK').trim().not().isEmpty().withMessage('UK size is required'),
    body('US').trim().not().isEmpty().withMessage('US size is required'),
    body('EU').trim().not().isEmpty().withMessage('EU size is required'),

    //optional
    body('parentId').optional().trim().isUUID().withMessage('parentId must be a valid UUID'),
]