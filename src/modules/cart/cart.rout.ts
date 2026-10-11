import { Router } from "express";

import auth from "../../middleware/auth";
import { allRoles } from "../user/user.rout";

import req_validator from "../../middleware/req_validation";
import { cartControler } from "./cart.controler";
import { validateCartAdd, validateCartCheckoutAuthentication, validateCartCheckoutTreeGift } from "./cart.validator";
import { Role } from "../../../generated/prisma/enums";
import { rateLimiter } from "../../middleware/RateLimiter";

const router = Router();

export const excludedCharityRoles: Role[] = [
    Role.CHARITABLE_ORGANIZATION,
    // Role.CHARITY_SHOP,
];

router.get("/", auth(...allRoles), cartControler.cartsByUser);

router.post("/",
    rateLimiter({ max: 10 }),
    validateCartAdd,
    req_validator(),
    auth(...(allRoles.filter(role => !excludedCharityRoles.includes(role)))),
    cartControler.addToCart);

router.delete("/:productId",
    rateLimiter({ max: 10 }),
    auth(...(allRoles.filter(role => !excludedCharityRoles.includes(role)))),
    cartControler.deleteCartItem);

router.get("/checkout/:cartGroupId/summary", auth(...(allRoles.filter(role => !excludedCharityRoles.includes(role)))), cartControler.checkoutSummary);

router.get("/checkout/:cartGroupId/shipping-rates", auth(...(allRoles.filter(role => !excludedCharityRoles.includes(role)))), cartControler.availableRates);

router.get("/by-seller/:sellerUserName", auth(...(allRoles.filter(role => !excludedCharityRoles.includes(role)))), cartControler.cartsByUserSeller);

router.get("/checkout/offer/:offerId/summary", auth(...(allRoles.filter(role => !excludedCharityRoles.includes(role)))), cartControler.offerCheckoutSummary);

router.get("/checkout/offer/:offerId/shipping-rates", auth(...(allRoles.filter(role => !excludedCharityRoles.includes(role)))), cartControler.offerAvailableRates);

router.get("/offer/:offerId", auth(...allRoles), cartControler.offerItems);

router.get("/:cartGroupId", auth(...allRoles), cartControler.checkoutItem);

export const cartRouts = router;