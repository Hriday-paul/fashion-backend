import { body, param, query } from "express-validator";

const formatRules = (prefix = "") => ["UK", "US", "EU", "FR", "IT"].map((key) =>
    body(`${prefix}${key}`).trim().not().isEmpty().withMessage(`${key} size is required`)
);

const groupName = body("groupName").trim().not().isEmpty().withMessage("groupName is required");

export const createSizeGroupValidator = [
    groupName,
    body("sizes").isArray({ min: 1 }).withMessage("sizes must be an array and cannot be empty"),
    ...formatRules("sizes.*."),
];

export const groupNameValidator = [groupName];

export const addSizeValidator = [
    param("id").isUUID().withMessage("id must be a valid UUID"),
    ...formatRules(),
];

export const createLetterGroupValidator = [
    groupName,
    body("sizes").isArray({ min: 1 }).withMessage("sizes must be an array and cannot be empty"),
    body("sizes.*.value").trim().not().isEmpty().withMessage("size value is required"),
];

export const addLetterSizeValidator = [
    body("value").trim().not().isEmpty().withMessage("size value is required"),
];

// letter sizes send `value`, other sizes send the five formats; the service enforces which one
export const updateSizeValidator = [
    param("sizeId").isUUID().withMessage("sizeId must be a valid UUID"),
    body("value").optional().trim().not().isEmpty().withMessage("size value is required"),
    ...["UK", "US", "EU", "FR", "IT"].map((key) =>
        body(key).optional().trim().not().isEmpty().withMessage(`${key} size is required`)
    ),
];

export const assignToCategoryValidator = [
    body("categoryId").trim().isUUID().withMessage("categoryId must be a valid UUID"),
    body("sizeGroupId").optional().trim().isUUID().withMessage("sizeGroupId must be a valid UUID"),
    body("letterSizeGroupId").optional().trim().isUUID().withMessage("letterSizeGroupId must be a valid UUID"),
];

export const removeFromCategoryValidator = [
    param("categoryId").isUUID().withMessage("categoryId must be a valid UUID"),
    query("type").isIn(["size", "letter"]).withMessage("type must be size or letter"),
];
