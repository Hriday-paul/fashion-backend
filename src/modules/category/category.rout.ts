import { Router } from "express";
import { categoryControler } from "./category.controler";
import {addCategoryValidator } from "./category.validator";
import req_validator from "../../middleware/req_validation";
import { rateLimiter } from "../../middleware/RateLimiter";
import auth from "../../middleware/auth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();
router.post("/",  rateLimiter({max: 10}), auth(Role.ADMIN), addCategoryValidator, req_validator(), categoryControler.addNewCategory);

router.delete("/:id", rateLimiter({max: 10}), auth(Role.ADMIN), categoryControler.deleteCategory);

router.get("/", categoryControler.getCategories);

router.get("/child/:id", categoryControler.getChildChain);
router.get("/parent", categoryControler.getParentChain);

router.get("/filtered-attributes", categoryControler.filteredAttributes);


export const categoryRouter = router;