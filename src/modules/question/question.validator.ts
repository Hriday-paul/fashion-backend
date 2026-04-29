import { body } from "express-validator";

export const addQuestionValidator = [
    body("productId")
        .trim()
        .notEmpty().withMessage("productId is required")
        .isUUID().withMessage("Invalid productId"),

    body("question")
        .trim()
        .notEmpty().withMessage("question is required")
]

export const addAnswerValidator = [
    body("questionId")
        .trim()
        .notEmpty().withMessage("questionId is required")
        .isUUID().withMessage("Invalid questionId"),

    body("answer")
        .trim()
        .notEmpty().withMessage("answer is required")
]