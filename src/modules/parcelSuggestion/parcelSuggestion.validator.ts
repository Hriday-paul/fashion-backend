import { check, body, ValidationChain } from "express-validator";

export const addParcelSuggestionValidator: ValidationChain[] = [
    check("categoryId")
        .trim()
        .notEmpty().withMessage("categoryId is required"),
    body("weight_kg")
        .notEmpty().withMessage("weight_kg is required")
        .isFloat({ min: 0 }).withMessage("weight_kg must be a positive number"),
    body("height_cm")
        .notEmpty().withMessage("height_cm is required")
        .isFloat({ min: 0 }).withMessage("height_cm must be a positive number"),
    body("width_cm")
        .notEmpty().withMessage("width_cm is required")
        .isFloat({ min: 0 }).withMessage("width_cm must be a positive number"),
    body("length_cm")
        .notEmpty().withMessage("length_cm is required")
        .isFloat({ min: 0 }).withMessage("length_cm must be a positive number"),
];

export const editParcelSuggestionValidator: ValidationChain[] = [
    body("weight_kg")
        .optional()
        .isFloat({ min: 0 }).withMessage("weight_kg must be a positive number"),
    body("height_cm")
        .optional()
        .isFloat({ min: 0 }).withMessage("height_cm must be a positive number"),
    body("width_cm")
        .optional()
        .isFloat({ min: 0 }).withMessage("width_cm must be a positive number"),
    body("length_cm")
        .optional()
        .isFloat({ min: 0 }).withMessage("length_cm must be a positive number"),
];

