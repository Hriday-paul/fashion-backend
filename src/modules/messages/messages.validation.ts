import { body } from "express-validator";

export const sendMessageValidator = [
  body("text").trim().optional(),
  body("receiverUserName").trim().notEmpty().withMessage("receiver is not valid")
]