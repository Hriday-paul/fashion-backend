import { body, check } from "express-validator";

export const sendMessageValidator = [
  body("text").trim().trim().not().isEmpty().withMessage("text is required"),
  body("receiverUserName").trim().trim().not().isEmpty().withMessage("receiver is not valid")
]