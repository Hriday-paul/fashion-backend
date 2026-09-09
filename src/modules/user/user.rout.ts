import { Router } from "express";
import auth, { PublicAuth } from "../../middleware/auth";
import { userController } from "./user.controller";
import { bundleDiscountValidator, statusUpdateValidator, validateBillingDetails } from "./user.validator";
import req_validator from "../../middleware/req_validation";
import { image_Upload } from "../../utils/s3";
import parseData from "../../middleware/parseData";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.get(
    '/',
    auth(Role.ADMIN),
    userController.all_users,
);

export const allRoles: Role[] = [Role.ADMIN, Role.INDIVIDUAL_USER, Role.AMBASSADOR, Role.ASSISTED_SELLER, Role.CELEBRITY, Role.CHARITABLE_ORGANIZATION, Role.CHARITY_SHOP, Role.ECO_FRIENDLY_STORE, Role.PROFESSIONAL_SELLER]

router.patch(
    '/update-my-profile',
    auth(...allRoles),
    image_Upload.fields([{ name: "picture", maxCount: 1 }, { name: "charityImgs", maxCount: 8 }]),
    parseData(),
    userController.updateProfile,
);

router.patch(
    '/status/:id',
    statusUpdateValidator,
    req_validator(),
    auth(Role.ADMIN),
    userController.update_user_status,
);

router.patch(
    '/notofication',
    statusUpdateValidator,
    req_validator(),
    auth(...allRoles),
    userController.UpdateNotification,
);

router.get(
    '/my-profile',
    auth(...allRoles),
    userController.getMyProfile,
);

router.get(
    '/bundle-discount',
    auth(...allRoles),
    userController.bundleDiscount,
);

router.put(
    '/bundle-discount',
    bundleDiscountValidator,
    req_validator(),
    auth(...allRoles),
    userController.updateBundleDiscount,
);

router.get(
    '/stats/:userName',
    userController.memberStats
);

router.get(
    '/charity-stats/:userName',
    userController.charityStats
);

router.get(
    '/charity-about/:userName',
    userController.charityAbout
);

router.get(
    '/charities',
    // auth(...allRoles),
    userController.allCharies,
);

//------shipping details--------
router.put(
    '/buying-details',
    validateBillingDetails,
    req_validator(),
    auth(...allRoles),
    userController.addOrUpdateBillingDetails,
);
router.put(
    '/selling-address',
    validateBillingDetails,
    req_validator(),
    auth(...allRoles),
    userController.addOrUpdateSellingDetails,
);
router.get(
    '/addresses',
    auth(...allRoles),
    userController.addressesByUser
);

router.get(
    '/bundle-discount-tiers/:userName',
    userController.getSellerBundileTiers
);

router.get(
    '/badge-stats',
    auth(...allRoles),
    userController.getBadgeStats
);

router.get(
    '/folowings/:userName',
    userController.userFolowings,
);

router.get(
    '/folowers/:userName',
    userController.userFolowers,
);

router.get(
    '/:username',
    PublicAuth(),
    userController.userDetails,
);

router.delete(
    '/delete-account',
    auth(...allRoles),
    userController.deletemyAccount,
);

router.delete(
    '/delete-account/:id',
    auth(Role.ADMIN),
    userController.deleteUser,
);

export const userRoutes = router;