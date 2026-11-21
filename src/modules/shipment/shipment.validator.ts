import { body } from "express-validator";

export const eventPayloadValidator = [
    body("event_type")
        .isString()
        .withMessage("event_type must be a string")
        .trim()
        .notEmpty()
        .withMessage("event_type is required"),

    body("data")
        .exists({ values: "null" })
        .withMessage("data is required")
        .isObject()
        .withMessage("data must be an object"),

    body("data.easyship_shipment_id")
        .isString()
        .withMessage("data.easyship_shipment_id must be a string")
        .trim()
        .notEmpty()
        .withMessage("data.easyship_shipment_id is required"),
];