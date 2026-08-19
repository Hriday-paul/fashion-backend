import { Router } from "express";
import auth from "../../middleware/auth";
import { allRoles } from "../user/user.rout";
import req_validator from "../../middleware/req_validation";
import { Role } from "../../../generated/prisma/enums";
import parseData from "../../middleware/parseData";
import { image_Upload } from "../../utils/s3";
import { returnController } from "./return.controller";

const router = Router();

export const excludedCharityRoles: Role[] = [
    Role.CHARITABLE_ORGANIZATION,
    // Role.CHARITY_SHOP,
];

router.get("/by-buyer",
    auth(...(allRoles.filter(role => !excludedCharityRoles.includes(role)))),
    returnController.returnsAsABuyer);

router.get("/by-seller",
    auth(...(allRoles.filter(role => !excludedCharityRoles.includes(role)))),
    returnController.returnsAsASeller);

export const returnRoutes = router;