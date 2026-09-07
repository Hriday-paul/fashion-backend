import { Router } from "express";
import auth from "../../middleware/auth";
import { allRoles } from "../user/user.rout";
import req_validator from "../../middleware/req_validation";
import { orderControler } from "./order.controller";
import { cancelItemsValidator, validateApproveCancelReq, validateOrderProducts, validateOrderReceivedmark } from "./order.validator";
import { Role } from "../../../generated/prisma/enums";
import parseData from "../../middleware/parseData";
import { image_Upload } from "../../utils/s3";

const router = Router();

export const excludedCharityRoles: Role[] = [
    Role.CHARITABLE_ORGANIZATION,
    // Role.CHARITY_SHOP,
];

// router.get("/", auth(...allRoles), favouriteControler.favouritesByUser);

router.post("/",
    validateOrderProducts,
    req_validator(),
    auth(...(allRoles.filter(role => !excludedCharityRoles.includes(role)))),
    orderControler.addNewOrder);

router.post("/shipping-label/:orderId",
    auth(...(allRoles.filter(role => !excludedCharityRoles.includes(role)))),
    orderControler.getShippingLebel);

router.get("/by-seller",
    auth(...(allRoles.filter(role => !excludedCharityRoles.includes(role)))),
    orderControler.ordersBySeller);

router.get("/by-buyer",
    auth(...(allRoles.filter(role => !excludedCharityRoles.includes(role)))),
    orderControler.ordersAsABuyer);

//seller cancel order item
router.post("/items/cancel",
    auth(...(allRoles.filter(role => !excludedCharityRoles.includes(role)))),
    image_Upload.array('evidences'),
    parseData(),
    cancelItemsValidator,
    req_validator(),
    orderControler.cancelOrderItemBySeller);

//buyer request cancel order item
router.post("/items/cancel/request",
    auth(...(allRoles.filter(role => !excludedCharityRoles.includes(role)))),
    image_Upload.array('evidences'), 
    parseData(),
    cancelItemsValidator,
    req_validator(),
    orderControler.requestCancelOrderItem);


//seller approve buyer cancel request
router.patch("/items/cancel/approve",
    validateApproveCancelReq,
    req_validator(),
    auth(...(allRoles.filter(role => !excludedCharityRoles.includes(role)))),
    orderControler.approveCancelOrderItemBySeller);

//seller decline buyer cancel request
router.patch("/items/cancel/decline",
    validateApproveCancelReq,
    req_validator(),
    auth(...(allRoles.filter(role => !excludedCharityRoles.includes(role)))),
    orderControler.declineCancelOrderItemBySeller);

router.patch("/confirm-received",
    validateOrderReceivedmark,
    req_validator(),
    auth(...(allRoles.filter(role => !excludedCharityRoles.includes(role)))),
    orderControler.confirmOrderReceived);

export const orderRouts = router;