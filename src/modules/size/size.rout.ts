import { Router } from "express";
import req_validator from "../../middleware/req_validation";
import { sizeController } from "./size.controller";
import { addNewSizeValidator, addSizeToCategoryValidator, removeSizeFromCategoryValidator } from "./size.validator";


const router = Router();
router.get("/", sizeController.allsizes);

router.post("/", addNewSizeValidator, req_validator(), sizeController.addNewSize);

router.post("/assign", addSizeToCategoryValidator, req_validator(), sizeController.assignSizeToCategory);
router.delete("/remove-assign", removeSizeFromCategoryValidator, req_validator(), sizeController.rmvSizeFromCategory);


router.delete("/:sizeId", sizeController.dltSize);


export const sizeRouter = router;