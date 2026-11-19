import { body, query, ValidationChain } from "express-validator";

export const addProductValidator: ValidationChain[] = [
  // Basic Info
  body("title")
    .trim()
    .notEmpty().withMessage("Title is required"),

  body("description")
    .optional()
    .trim(),

  // Pricing
  body("price")
    .notEmpty().withMessage("Price is required")
    .isFloat({ min: 0 }).withMessage("Price must be a positive number"),

  body("discountPct")
    .notEmpty().withMessage("discountPct is required")
    .isFloat({ min: 0, max: 100 }).withMessage("discountPct must be between 0 to 100"),

  // Relations (IDs)
  body("brandId")
    .trim()
    .notEmpty().withMessage("Brand is required")
    .isUUID().withMessage("Invalid brand ID"),

  body("sizeId")
    .trim()
    .notEmpty().withMessage("Size is required")
    .isUUID().withMessage("Invalid size ID"),

  body("SizeFormat")
    .trim()
    .notEmpty().withMessage("Size format is required")
    .isIn(["UK", "US", "EU", "FR", "IT", "LETTER"]).withMessage("Invalid size format"),

  body("categoryId")
    .trim()
    .notEmpty().withMessage("Category is required")
    .isUUID().withMessage("Invalid category ID"),

  // Product Details
  body("condition")
    .trim()
    .notEmpty().withMessage("Condition is required"),

  body("color")
    .trim()
    .notEmpty().withMessage("Color is required"),

  // Arrays
  body("tags")
    .optional()
    .isArray().withMessage("Tags must be an array"),
  body("tags.*")
    .trim()
    .notEmpty().withMessage("Tag must not be empty"),

  body("meterials")
    .optional()
    .isArray().withMessage("Materials must be an array"),
  body("meterials.*")
    .trim()
    .notEmpty().withMessage("Material must not be empty"),

  body("care_instructions")
    .optional()
    .isArray().withMessage("Care instructions must be an array"),
  body("care_instructions.*")
    .trim()
    .notEmpty().withMessage("Care instruction must not be empty"),

  // Settings
  body("allow_offer")
    .optional()
    .isBoolean().withMessage("allow_offer must be a boolean"),

  body("return_window")
    .optional()
    .isInt({ min: 0, max: 365 }).withMessage("Return window must be between 0 and 365 days"),
  body("donation_percent")
    .optional()
    .isInt({ min: 0, max: 100 }).withMessage("Donation Percent must be between 0 and 100").toInt(),

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

  body("donationPrivacy")
    .optional()
    .isBoolean().withMessage("Donation Privacy must be a boolean").toBoolean(),
];

export const productByTypeValidator = [
  query('type')
    .optional()
    .isIn(['trending', 'topSelling', 'recomended'])
    .withMessage('type must be trending, topSelling or recomended')
]

export const makeofferValidator = [
  body('productIds')
    .isArray({ min: 1 })
    .withMessage('productIds must be an array with at least one product ID'),
  body('productIds.*')
    .isUUID()
    .withMessage('Each product ID must be a valid UUID'),
  body('offerPrice')
    .isFloat({ min: 0 })
    .withMessage('offerPrice must be a positive number'),
  body('sellerId')
    .isString()
    .withMessage('seller must be a string')
    .notEmpty()
    .withMessage('seller is required')
    .isUUID()
    .withMessage('seller must be a valid UUID'),
]

export const acceptOfferValidator = [
  body('offerId')
    .isString()
    .withMessage('offerId must be a string')
    .notEmpty()
    .withMessage('offerId is required')
    .isUUID()
    .withMessage('offerId must be a valid UUID'),
]

export const counterOfferValidator = [
  body('offerId')
    .isString()
    .withMessage('offerId must be a string')
    .notEmpty()
    .withMessage('offerId is required')
    .isUUID()
    .withMessage('offerId must be a valid UUID'),

  body('offerPrice')
    .isFloat({ min: 0 })
    .withMessage('offerPrice must be a positive number'),
]
export const declineOfferValidator = [
  body('offerId')
    .isString()
    .withMessage('offerId must be a string')
    .notEmpty()
    .withMessage('offerId is required')
    .isUUID()
    .withMessage('offerId must be a valid UUID')
]

export const dropPriceValidator = [
  body('productId')
    .isString()
    .withMessage('productId must be a string')
    .notEmpty()
    .withMessage('productId is required')
    .isUUID()
    .withMessage('productId must be a valid UUID'),

  body('newPrice')
    .isFloat({ min: 0 })
    .withMessage('newPrice must be a positive number'),
]