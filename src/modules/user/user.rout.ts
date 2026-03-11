import { Router } from "express";
import auth from "../../middleware/auth";
import { userController } from "./user.controller";
import { statusUpdateValidator } from "./user.validator";
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

router.patch(
    '/update-my-profile',
     auth(Role.ADMIN, Role.INDIVIDUAL_USER, Role.AMBASSADOR, Role.ASSISTED_SELLER, Role.CELEBRITY, Role.CHARITABLE_ORGANIZATION, Role.CHARITY_SHOP, Role.ECO_FRIENDLY_STORE, Role.PROFESSIONAL_SELLER),
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
    '/:id',
     auth(Role.ADMIN, Role.INDIVIDUAL_USER, Role.AMBASSADOR, Role.ASSISTED_SELLER, Role.CELEBRITY, Role.CHARITABLE_ORGANIZATION, Role.CHARITY_SHOP, Role.ECO_FRIENDLY_STORE, Role.PROFESSIONAL_SELLER),
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