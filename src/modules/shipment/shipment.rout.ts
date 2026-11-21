import { Router } from "express";
import req_validator from "../../middleware/req_validation";
import { shipmentController } from "./shipment.controller";
import { eventPayloadValidator } from "./shipment.validator";

const router = Router();

router.post("/webhook/easy-ship", eventPayloadValidator, req_validator, shipmentController.webhookShipmet);


export const shipmentRouter = router;