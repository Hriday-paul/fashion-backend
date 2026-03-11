import { Router } from "express";
import { productControler } from "./product.controler";
import parseData from "../../middleware/parseData";
import { addProductValidator } from "./product.validator";
import req_validator from "../../middleware/req_validation";
import { image_Upload } from "../../utils/s3";
import auth from "../../middleware/auth";
import { allRoles } from "../user/user.rout";

const router = Router();

router.post("/", auth(...allRoles), image_Upload.array('images'), parseData(), addProductValidator, req_validator(), productControler.addNewProduct);

router.get("/", productControler.allProducts);

export const productRouts = router;