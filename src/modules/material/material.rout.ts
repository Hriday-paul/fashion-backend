import { Router } from "express";

import { materialController } from "./material.controller";
import { rateLimiter } from "../../middleware/RateLimiter";
import auth from "../../middleware/auth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();
router.get("/", materialController.allMaterials);

router.post("/", rateLimiter(), auth(Role.ADMIN), materialController.addNewMaterial);

router.post("/assign", rateLimiter({ max: 10 }), auth(Role.ADMIN), materialController.assignMaterialToCategory);

router.delete("/remove-assign", rateLimiter({ max: 10 }), auth(Role.ADMIN), materialController.rmvMaterialFromCategory);

router.delete("/:materialId", rateLimiter({ max: 10 }), auth(Role.ADMIN), materialController.dleMaterial);

export const materialRouter = router;

