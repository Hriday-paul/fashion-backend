import { Router } from "express";
import req_validator from "../../middleware/req_validation";
import { sizeController } from "./size.controller";
import {
    addLetterSizeValidator,
    addSizeValidator,
    assignToCategoryValidator,
    createLetterGroupValidator,
    createSizeGroupValidator,
    groupNameValidator,
    removeFromCategoryValidator,
    updateSizeValidator,
} from "./size.validator";
import { rateLimiter } from "../../middleware/RateLimiter";
import auth from "../../middleware/auth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();
const admin = [rateLimiter({ max: 50 }), auth(Role.ADMIN)];

// storefront
router.get("/", sizeController.getSizes);

// size groups
router.get("/groups", auth(Role.ADMIN), sizeController.allSizeGroups);
router.post("/groups", ...admin, createSizeGroupValidator, req_validator(), sizeController.createSizeGroup);
router.patch("/groups/:id", ...admin, groupNameValidator, req_validator(), sizeController.updateSizeGroup);
router.delete("/groups/:id", ...admin, sizeController.deleteSizeGroup);
router.post("/groups/:id/sizes", ...admin, addSizeValidator, req_validator(), sizeController.addSizeToGroup);

// letter size group (single row)
router.get("/letter", auth(Role.ADMIN), sizeController.getLetterSizeGroup);
router.post("/letter", ...admin, createLetterGroupValidator, req_validator(), sizeController.createLetterSizeGroup);
router.patch("/letter", ...admin, groupNameValidator, req_validator(), sizeController.updateLetterSizeGroup);
router.post("/letter/sizes", ...admin, addLetterSizeValidator, req_validator(), sizeController.addLetterSize);

// category assignment (1:1)
router.get("/category/:categoryId", auth(Role.ADMIN), sizeController.getCategoryAssignment);
router.put("/assign", ...admin, assignToCategoryValidator, req_validator(), sizeController.assignToCategory);
router.delete("/assign/:categoryId", ...admin, removeFromCategoryValidator, req_validator(), sizeController.removeFromCategory);

// single size (keep after the static routes above)
router.patch("/:sizeId", ...admin, updateSizeValidator, req_validator(), sizeController.updateSize);
router.delete("/:sizeId", ...admin, sizeController.dltSize);

export const sizeRouter = router;
