import { Router } from "express";

import { brandController } from "./brand.controller";

const router = Router();
router.get("/", brandController.allBrands);

router.post("/", brandController.addNewBrand);


router.post("/assign", brandController.assignBrandToCategory);
router.delete("/remove-assign", brandController.rmvBrandFromCategory);

router.delete("/:brandId", brandController.dleBrand);

export const brandRouter = router;