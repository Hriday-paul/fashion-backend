import { Router } from "express";

import auth from "../../middleware/auth";
import { allRoles } from "../user/user.rout";

import req_validator from "../../middleware/req_validation";
import { cartControler } from "./cart.controler";
import { validateCartAdd } from "./cart.validator";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

export const excludedCharityRoles: Role[] = [
    Role.CHARITABLE_ORGANIZATION,
    // Role.CHARITY_SHOP,
];

router.get("/", auth(...allRoles), cartControler.cartsByUser);
router.get("/:cartGroupId", auth(...allRoles), cartControler.checkoutItem);

router.post("/",
    validateCartAdd,
    req_validator(),
    auth(...(allRoles.filter(role => !excludedCharityRoles.includes(role)))),
    cartControler.addToCart);

router.delete("/:itemId",
    auth(...(allRoles.filter(role => !excludedCharityRoles.includes(role)))),
    cartControler.deleteCartItem);

export const cartRouts = router;