import { Router } from "express";

import auth from "../../middleware/auth";
import { allRoles } from "../user/user.rout";

import req_validator from "../../middleware/req_validation";
import { cartControler } from "./cart.controler";

const router = Router();

router.get("/", auth(...allRoles), cartControler.cartsByUser);

router.post("/",
    // addFavouriteValidator,
    // req_validator(),
    auth(...allRoles),
    cartControler.addToCart);

router.delete("/:productId",
    auth(...allRoles),
    cartControler.deleteCartItem);

export const cartRouts = router;