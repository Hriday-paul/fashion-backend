import { Router } from "express";
import auth, { PublicAuth } from "../../middleware/auth";
import { userController } from "./user.controller";
import { statusUpdateValidator, validateBillingDetails } from "./user.validator";
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
    image_Upload.single('picture'),
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
    auth(Role.ADMIN, Role.INDIVIDUAL_USER, Role.AMBASSADOR, Role.ASSISTED_SELLER, Role.CELEBRITY, Role.CHARITABLE_ORGANIZATION, Role.CHARITY_SHOP, Role.ECO_FRIENDLY_STORE, Role.PROFESSIONAL_SELLER),
    userController.UpdateNotification,
);

router.get(
    '/my-profile',
    auth(Role.ADMIN, Role.INDIVIDUAL_USER, Role.AMBASSADOR, Role.ASSISTED_SELLER, Role.CELEBRITY, Role.CHARITABLE_ORGANIZATION, Role.CHARITY_SHOP, Role.ECO_FRIENDLY_STORE, Role.PROFESSIONAL_SELLER),
    userController.getMyProfile,
);

router.get(
    '/charities',
    auth(...allRoles),
    userController.allCharies,
);

//------Billing details--------
router.put(
    '/billing-details',
    validateBillingDetails,
    req_validator(),
    auth(...allRoles),
    userController.addOrUpdateBillingDetails,
);
router.get(
    '/billing-details',
    auth(...allRoles),
    userController.billingDetailsByUser
);

router.get(
    '/:username',
    PublicAuth(),
    userController.userDetails,
);

router.delete(
    '/delete-account',
    auth(Role.INDIVIDUAL_USER, Role.AMBASSADOR, Role.ASSISTED_SELLER, Role.CELEBRITY, Role.CHARITABLE_ORGANIZATION, Role.CHARITY_SHOP, Role.ECO_FRIENDLY_STORE, Role.PROFESSIONAL_SELLER),
    userController.deletemyAccount,
);

router.delete(
    '/delete-account/:id',
    auth(Role.ADMIN),
    userController.deleteUser,
);

export const userRoutes = router;