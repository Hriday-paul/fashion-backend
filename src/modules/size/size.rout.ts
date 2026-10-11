import { Router } from "express";
import req_validator from "../../middleware/req_validation";
import { sizeController } from "./size.controller";
import { addNewSizeValidator, addSizeToCategoryValidator, removeSizeFromCategoryValidator } from "./size.validator";
import { rateLimiter } from "../../middleware/RateLimiter";
import auth from "../../middleware/auth";
import { Role } from "../../../generated/prisma/enums";


const router = Router();
router.get("/", sizeController.allsizes);

router.post("/",  rateLimiter({max : 50}), auth(Role.ADMIN), addNewSizeValidator, req_validator(), sizeController.addNewSize);

router.post("/assign", rateLimiter({max : 50}), auth(Role.ADMIN), addSizeToCategoryValidator, req_validator(), sizeController.assignSizeToCategory);
router.delete("/remove-assign", rateLimiter({max : 50}), auth(Role.ADMIN), removeSizeFromCategoryValidator, req_validator(), sizeController.rmvSizeFromCategory);


router.delete("/:sizeId", rateLimiter({max : 50}), auth(Role.ADMIN), sizeController.dltSize);


export const sizeRouter = router;