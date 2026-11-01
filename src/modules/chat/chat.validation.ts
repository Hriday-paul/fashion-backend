import { check } from "express-validator";

export const createChatValidation = [
  check("products")
    .isArray({ min: 1 })
    .withMessage("products must be an array with at least 1 product ID"),

  check("products.*")
    .notEmpty()
    .withMessage("product ID cannot be empty"),

  check("user2Id")
    .isString()
    .withMessage("seller ID must be a string"),
];

export const createChatBuyValidation = [
  check("chatId")
    .isString()
    .withMessage("chatId must be a string"),
  check("sellerId")
    .isString()
    .withMessage("sellerId must be a string"),

];