import { body } from "express-validator";

export const addFolowValidator = [
    body('memberId')
        .trim()
        .notEmpty().withMessage("memberId is required")
        .isUUID().withMessage("Invalid memberId"),
]