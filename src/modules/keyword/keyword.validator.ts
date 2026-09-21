import { body, query } from "express-validator";

export const keywordSuggestionProducts = [
    query('query')
        .notEmpty()
        .withMessage('Query is required')
        .isLength({ min: 1 })
        .withMessage('Query must be at least 1 character long'),
]

export const addNewKeywordValidator = [
    body('keyword')
        .notEmpty()
        .withMessage('Keyword is required')
        .isLength({ min: 1 })
        .withMessage('Keyword must be at least 1 character long'),
]
