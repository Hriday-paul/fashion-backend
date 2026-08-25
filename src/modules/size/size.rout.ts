import { Router } from "express";
import req_validator from "../../middleware/req_validation";
import { sizeController } from "./size.controller";


const router = Router();
router.get("/", sizeController.allsizes);


export const sizeRouter = router;