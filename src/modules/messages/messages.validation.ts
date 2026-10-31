import { body } from "express-validator";

export const sendMessageValidator = [
  body("text").trim().optional(),
  body("chatId").trim().notEmpty().withMessage("chatId not valid")
]