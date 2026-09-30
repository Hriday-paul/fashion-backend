import { Router } from "express";
import req_validator from "../../middleware/req_validation";
import { shipmentController } from "./shipment.controller";



const router = Router();

router.post("/webhook/easy-ship",  shipmentController.webhookShipmet);


export const shipmentRouter = router;