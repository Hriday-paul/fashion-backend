import { body, query, ValidationChain } from "express-validator";
import { DonationType, WashedType } from "../../../generated/prisma/enums";

export const createClothDonationValidator: ValidationChain[] = [
    body("charityId")
        .trim()
        .notEmpty().withMessage("charityId is required")
        .isUUID().withMessage("charityId must be a valid UUID"),

    body("donationType")
        .trim()
        .notEmpty().withMessage("donationType is required")
        .toUpperCase()
        .isIn([DonationType.SINGLE, DonationType.MULTIPLE])
        .withMessage(`donationType must be either ${DonationType.SINGLE} or ${DonationType.MULTIPLE}`),

    body("condition")
        .trim()
        .notEmpty().withMessage("condition is required"),

    body("washedType")
        .trim()
        .notEmpty().withMessage("washedType is required")
        .toUpperCase()
        .isIn([WashedType.RECENT_WASHED, WashedType.WASHED, WashedType.UNWASHED])
        .withMessage(`washedType must be one of: ${WashedType.RECENT_WASHED}, ${WashedType.WASHED}, ${WashedType.UNWASHED}`),

    body("description")
        .optional()
        .trim(),

    body("itemTypes")
        .trim()
        .notEmpty().withMessage("itemTypes is required")
        .isArray({ min: 1 })
        .withMessage("itemTypes must be an array with at least one item."),

    body("personTypes")
        .trim()
        .notEmpty().withMessage("personTypes is required")
        .isArray({ min: 1 })
        .withMessage("personTypes must be an array with at least one item."),

    body("brands")
        .optional()
        .isArray()
        .withMessage("brands must be an array."),
];

export const updateClothDonationStatusValidator: ValidationChain[] = [
    body("status")
        .notEmpty().withMessage("status or action is required")
        .isIn(["ACCEPTED", "REJECTED"])
];

export const getClothDonationsQueryValidator: ValidationChain[] = [
    query("page").optional().isInt({ min: 1 }).withMessage("page must be a positive integer"),
    query("limit").optional().isInt({ min: 1 }).withMessage("limit must be a positive integer"),
    query("donationType").optional().isString(),
    query("status").optional().isString(),
];

export const getLabelValidator: ValidationChain[] = [
    body("donationReqId")
        .notEmpty().withMessage("donationReqId is required")
]

export const payShipingCostValidator: ValidationChain[] = [
    body("donationReqId")
        .notEmpty().withMessage("donationReqId is required"),

    body("shipmentServiceId")
        .notEmpty().withMessage("shipmentServiceId is required"),
]