import { Router } from "express";
import auth from "../../middleware/auth";
import { allRoles } from "../user/user.rout";
import req_validator from "../../middleware/req_validation";
import { orderControler } from "./order.controller";
import { cancelItemsValidator, validateApproveCancelReq, validateOfferOrder, validateOrderAuthResult, validateOrderProducts, validateOrderReceivedmark } from "./order.validator";
import { Role } from "../../../generated/prisma/enums";
import parseData from "../../middleware/parseData";
import { image_Upload } from "../../utils/s3";

const router = Router();

export const excludedCharityRoles: Role[] = [
    Role.CHARITABLE_ORGANIZATION,
    // Role.CHARITY_SHOP,
];

router.get("/", auth(Role.ADMIN), orderControler.orders);
router.get("/stats", auth(Role.ADMIN), orderControler.orderStats);

router.post("/",
    validateOrderProducts,
    req_validator(),
    auth(...(allRoles.filter(role => !excludedCharityRoles.includes(role)))),
    orderControler.addNewOrder);

router.post("/offer",
    validateOfferOrder,
    req_validator(),
    auth(...(allRoles.filter(role => !excludedCharityRoles.includes(role)))),
    orderControler.addNewOfferOrder);

router.post("/shipping-label/:orderId",
    auth(...(allRoles.filter(role => !excludedCharityRoles.includes(role)))),
    orderControler.getShippingLebel);

router.post("/shipping-auth-label/:orderId",
    auth(Role.ADMIN),
    orderControler.getAuthShippingLebel);

router.get("/authentications",
    auth(Role.ADMIN),
    orderControler.authenticationOrders);

router.get("/by-seller",
    auth(...(allRoles.filter(role => !excludedCharityRoles.includes(role)))),
    orderControler.ordersBySeller);

router.get("/by-seller/:userName",
    auth(Role.ADMIN),
    orderControler.ordersForSellerByUserName);

router.get("/by-buyer",
    auth(...(allRoles.filter(role => !excludedCharityRoles.includes(role)))),
    orderControler.ordersAsABuyer);

router.get("/by-buyer/:userName",
    auth(Role.ADMIN),
    orderControler.ordersAsABuyerByUserName);

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

router.patch("/auth-received",
    validateOrderReceivedmark,
    req_validator(),
    auth(Role.ADMIN),
    orderControler.markOrderReceivedFromAuthCenter);

router.patch("/auth-in-progress",
    validateOrderReceivedmark,
    req_validator(),
    auth(Role.ADMIN),
    orderControler.markOrderAuthInProgress);

router.patch("/auth-result",
    validateOrderAuthResult,
    req_validator(),
    auth(Role.ADMIN),
    orderControler.addAuthResultToOrder);

router.get("/details/:orderCode",
    orderControler.orderDetails);

export const orderRouts = router;