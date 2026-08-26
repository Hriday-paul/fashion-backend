import { Router } from "express";

import { brandController } from "./brand.controller";

const router = Router();
router.get("/", brandController.allBrands);

export const brandRouter = router;