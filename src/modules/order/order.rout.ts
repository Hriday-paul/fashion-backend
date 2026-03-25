import { Router } from "express";
import auth from "../../middleware/auth";
import { allRoles } from "../user/user.rout";
import req_validator from "../../middleware/req_validation";
import { orderControler } from "./order.controller";
import { validateOrderProducts } from "./order.validator";

const router = Router();

// router.get("/", auth(...allRoles), favouriteControler.favouritesByUser);

router.post("/",
    validateOrderProducts,
    req_validator(),
    auth(...allRoles),
    orderControler.addNewOrder);

export const orderRouts = router;