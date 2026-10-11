import { Router } from "express";
import { packageControler } from "./package.controler";
import { addPackageValidator } from "./package.validator";
import req_validator from "../../middleware/req_validation";
import auth from "../../middleware/auth";
import { Role } from "../../../generated/prisma/enums";
import { rateLimiter } from "../../middleware/RateLimiter";

const router = Router();

router.post("/", rateLimiter(), addPackageValidator, req_validator(), auth(Role.ADMIN), packageControler.addNewpackage);
router.patch("/:id", rateLimiter(), auth(Role.ADMIN), packageControler.UpdatePackage);
router.delete("/:id", rateLimiter(), auth(Role.ADMIN), packageControler.DeletePackage);
router.get("/", packageControler.allPackages);

export const packageRouters = router;