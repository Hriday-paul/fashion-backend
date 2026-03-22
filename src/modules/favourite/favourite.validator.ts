import { body, ValidationChain } from "express-validator";

export const addFavouriteValidator: ValidationChain[] = [
  body("productId")
    .trim()
    .notEmpty().withMessage("productId is required")
    .isUUID().withMessage("Invalid productId"),
]