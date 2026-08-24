import { Router } from "express";

import req_validator from "../../middleware/req_validation";
import { brandController } from "./brand.controller";

const router = Router();
router.get("/", brandController.allBrands);

export const brandRouter = router;