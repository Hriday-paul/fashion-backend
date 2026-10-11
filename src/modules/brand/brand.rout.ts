import { Router } from "express";

import { brandController } from "./brand.controller";
import { rateLimiter } from "../../middleware/RateLimiter";
import auth from "../../middleware/auth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();
router.get("/", brandController.allBrands);

router.post("/", rateLimiter(), auth(Role.ADMIN), brandController.addNewBrand);

router.post("/assign",  rateLimiter({max : 10}), auth(Role.ADMIN), brandController.assignBrandToCategory);

router.delete("/remove-assign",  rateLimiter({ max: 10 }), auth(Role.ADMIN), brandController.rmvBrandFromCategory);

router.delete("/:brandId",  rateLimiter({max: 10}), auth(Role.ADMIN), brandController.dleBrand);

export const brandRouter = router;