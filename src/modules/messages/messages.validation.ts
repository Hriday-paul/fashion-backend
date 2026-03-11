import { check } from "express-validator";

export const sendMessageValidator = [
  check("chat").trim().trim().not().isEmpty().withMessage("chat id is required"),
  check("receiver").trim().trim().not().isEmpty().withMessage("receiver id is not valid"),
  check("type").trim().trim().not().isEmpty().isIn(["text", "file"]).withMessage("message type should be text or file"),
]