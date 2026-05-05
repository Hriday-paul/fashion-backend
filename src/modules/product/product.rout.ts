import { Router } from "express";
import { productControler } from "./product.controler";
import parseData from "../../middleware/parseData";
import { addProductValidator, productByTypeValidator } from "./product.validator";
import req_validator from "../../middleware/req_validation";
import { image_Upload } from "../../utils/s3";
import auth, { PublicAuth } from "../../middleware/auth";
import { allRoles } from "../user/user.rout";

const router = Router();

router.post("/", auth(...allRoles), image_Upload.array('images'), parseData(), addProductValidator, req_validator(), productControler.addNewProduct);

router.get("/", PublicAuth(), productControler.allProducts);
router.get("/member/:username", PublicAuth(), productControler.productsByUserName);
router.get("/by-type", productByTypeValidator, req_validator(), PublicAuth(), productControler.productsByType);
router.get("/new-arrival", PublicAuth(), productControler.newArrivalProducts);

router.get("/recent-views", productControler.recentViewProducts);
router.get("/trendings", productControler.trendingProducts);
router.get("/top-sellings", productControler.topSellingProducts);
router.get("/recommended", PublicAuth(), productControler.recomendedProducts);

router.get("/:id", PublicAuth(), productControler.productDetails);

export const productRouts = router;