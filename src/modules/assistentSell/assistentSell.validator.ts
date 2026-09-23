import { body, query, ValidationChain } from "express-validator";
import { addProductValidator } from "../product/product.validator";

export const assistentSellValidator: ValidationChain[] = [

    body("itemsTitle")
        .trim()
        .notEmpty().withMessage("Items title is required"),

    body("itemsDetails")
        .optional()
        .trim(),

    body("itemsCount")
        .notEmpty().withMessage("Items count is required")
        .isFloat({ min: 1 }).withMessage("Items count must be minimum 1").toFloat(),

    body("contactNumber")
        .optional()
        .trim()
        .isMobilePhone('any')
        .withMessage("Contact number must be a valid phone number"),

    body("donationPct")
        .optional()
        .isFloat({ min: 0, max: 100 }).withMessage("donationPct must be between 0 to 100").toFloat(),

    // Product Details
    body("priceType")
        .trim()
        .notEmpty().withMessage("Price type is required")
        .isIn(["TARGET_AMOUNT", "DISCUSSION", "MARKET_PRICE"])
        .withMessage("Price type is invalid"),

    // Pricing
    body("targetPrice")
        .if((value, { req }) => req.body.priceType === "TARGET_AMOUNT")
        .notEmpty()
        .withMessage("Target price is required")
        .isFloat({ min: 1 })
        .withMessage("Target price must be a positive number")
        .toFloat(),

    body("additionalNotes")
        .optional()
        .trim(),

    // Charities
    body("charities")
        .optional()
        .isArray()
        .withMessage("Charities must be an array"),

    body("charities.*")
        .trim()
        .notEmpty()
        .withMessage("Charity ID is required")
        .isUUID()
        .withMessage("Invalid charity ID"),

    body("donationAnonymous")
        .optional()
        .isBoolean().withMessage("Donation Anonymous must be a boolean").toBoolean(),
];

export const assistentSellRespondValidator: ValidationChain[] = [

    body("requestId")
        .trim()
        .notEmpty().withMessage("Request ID is required"),

    body("status")
        .trim()
        .notEmpty().withMessage("Status is required")
        .isIn(["APPROVED", "REJECTED"])
        .withMessage("Status is invalid"),
]

export const assistentSellListValidator: ValidationChain[] = [

    body("requestId")
        .trim()
        .notEmpty().withMessage("Request ID is required"),
]

export const addAssitedSellListingValidator: ValidationChain[] = [

    body("assistentSellId")
        .trim()
        .notEmpty().withMessage("Assistent Sell ID is required"),

    ...addProductValidator

]