import { Router } from "express";
import auth from "../../middleware/auth";
import { allRoles } from "../user/user.rout";
import req_validator from "../../middleware/req_validation";
import { orderControler } from "./order.controller";
import { validateOrderProducts } from "./order.validator";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

export const excludedCharityRoles: Role[] = [
    Role.CHARITABLE_ORGANIZATION,
    // Role.CHARITY_SHOP,
];

// router.get("/", auth(...allRoles), favouriteControler.favouritesByUser);

router.post("/",
    validateOrderProducts,
    req_validator(),
    auth(...allRoles),
    orderControler.addNewOrder);

router.get("/by-seller",
    auth(...(allRoles.filter(role => !excludedCharityRoles.includes(role)))),
    orderControler.ordersBySeller);

router.patch("/confirm/:sellerGroupId",
    auth(...(allRoles.filter(role => !excludedCharityRoles.includes(role)))),
    orderControler.confirmOrder);

router.patch("/cancel/:sellerGroupId",
    auth(...(allRoles.filter(role => !excludedCharityRoles.includes(role)))),
    orderControler.cancelOrder);

export const orderRouts = router;