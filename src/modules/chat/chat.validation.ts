import { check } from "express-validator";

export const createChatValidation = [
  check("participants")
    .isArray({ min: 2, max: 2 })
    .withMessage("participants must be an array with exactly 2 user IDs"),

  check("participants.*")
    .notEmpty()
    .withMessage("participant ID cannot be empty")
];

export const createChatBuyValidation = [
  check("chatId")
    .isString()
    .withMessage("chatId must be a string"),
  check("sellerId")
    .isString()
    .withMessage("sellerId must be a string"),

];