import { Router } from "express";
import { categoryControler } from "./category.controler";
import { addBrandValidator, addCategoryValidator, addSizeValidator } from "./category.validator";
import req_validator from "../../middleware/req_validation";

const router = Router();
router.post("/", addCategoryValidator, req_validator(), categoryControler.addNewCategory);
router.delete("/:id", categoryControler.deleteCategory);
router.get("/", categoryControler.getCategories);

router.get("/child/:id", categoryControler.getChildChain);
router.get("/parent", categoryControler.getParentChain);

router.post("/brands", addBrandValidator, req_validator(), categoryControler.addNewBrand);
router.get("/brands/:id", categoryControler.allBrands);
router.delete("/brands/:id", categoryControler.deletBrand);

router.get("/filtered-attributes", categoryControler.filteredAttributes);

// router.get("/sizes/:id", categoryControler.allSizes);
// router.post("/sizes", addSizeValidator, req_validator(), categoryControler.addSize);
// router.delete("/sizes/:id", categoryControler.deleteSize);

export const categoryRouter = router;