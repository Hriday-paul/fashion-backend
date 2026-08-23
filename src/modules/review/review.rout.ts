import { Router } from "express";
import parseData from "../../middleware/parseData";
import req_validator from "../../middleware/req_validation";
import { image_Upload } from "../../utils/s3";
import auth, { PublicAuth } from "../../middleware/auth";
import { allRoles } from "../user/user.rout";
import { reviewControler } from "./review.controller";

const router = Router();

// router.post("/", auth(...allRoles), image_Upload.array('images'), parseData(), addProductValidator, req_validator(), productControler.addNewProduct);


router.get("/stats/:userName", reviewControler.reviewsStats);
router.get("/member/:userName", reviewControler.reviewsByUser);


export const reviewRouts = router;