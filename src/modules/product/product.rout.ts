import { Router } from "express";
import { productControler } from "./product.controler";
import parseData from "../../middleware/parseData";
import { acceptOfferValidator, addProductValidator, counterOfferValidator, declineOfferValidator, dropPriceValidator, makeofferValidator, productByTypeValidator } from "./product.validator";
import req_validator from "../../middleware/req_validation";
import { image_Upload } from "../../utils/s3";
import auth, { PublicAuth } from "../../middleware/auth";
import { allRoles } from "../user/user.rout";
import { Role } from "../../../generated/prisma/enums";
import { rateLimiter } from "../../middleware/RateLimiter";

export const excludedCharityRoles: Role[] = [
    Role.CHARITABLE_ORGANIZATION,
    // Role.CHARITY_SHOP,
];

const router = Router();

router.post("/", rateLimiter(), auth(...(allRoles.filter(role => !excludedCharityRoles.includes(role)))), image_Upload.array('images'), parseData(), addProductValidator, req_validator(), productControler.addNewProduct);

router.get("/", PublicAuth(), productControler.allProducts);
router.get("/my-items", auth(...allRoles), productControler.myProducts);
router.get("/member/:username", PublicAuth(), productControler.productsByUserName);
router.get("/authenticate", PublicAuth(), productControler.authenticateProducts);

router.get("/recent-views", PublicAuth(), productControler.recentViewProducts);
router.get("/trendings", PublicAuth(), productControler.trendingProducts);


router.get("/new-arrival", PublicAuth(), productControler.newArrivalProducts);
router.get("/top-sellings", productControler.topSellingProducts);
router.get("/recommended", PublicAuth(), productControler.recomendedProducts);
router.get("/by-type", productByTypeValidator, req_validator(), PublicAuth(), productControler.productsByType);


router.get("/stats/:productId", PublicAuth(), productControler.productStats);
router.get("/donation-support/:productId", productControler.donationSupportByProduct);

router.get("/similar-from-seller/:productId", PublicAuth(), productControler.similarProductsFromSeller);
router.get("/same-category/:productId", PublicAuth(), productControler.sameCategoryProducts);
router.get("/same-color/:productId", PublicAuth(), productControler.sameColorProducts);

router.post("/offer", rateLimiter(), makeofferValidator, req_validator(), auth(...allRoles), productControler.makeAnOfferAsBuyer);
router.post("/offer/accept", rateLimiter(), acceptOfferValidator, req_validator(), auth(...allRoles), productControler.acceptOfferAsSeller);
router.post("/offer/decline", rateLimiter(), declineOfferValidator, req_validator(), auth(...allRoles), productControler.declineOfferAsSeller);
router.post("/offer/counter", rateLimiter(), counterOfferValidator, req_validator(), auth(...allRoles), productControler.counterOfferAsSeller);

router.post("/price/drop", rateLimiter(), dropPriceValidator, req_validator(), auth(...allRoles), productControler.dropPriceForAProduct);

router.patch("/:productId/mark-sold", rateLimiter(), auth(...allRoles), productControler.markProductSold);

router.get("/:id", PublicAuth(), productControler.productDetails);

router.delete("/:productId", rateLimiter(), auth(...allRoles), productControler.dltAProduct);

export const productRouts = router;