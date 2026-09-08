import { Router } from "express";
import auth from "../../middleware/auth";
import { allRoles } from "../user/user.rout";
import req_validator from "../../middleware/req_validation";
import { Role } from "../../../generated/prisma/enums";
import { assistentSellControler } from "./assistentSell.controler";
import { assistentSellValidator } from "./assistentSell.validator";
import parseData from "../../middleware/parseData";
import { image_Upload } from "../../utils/s3";

const router = Router();

export const excludedCharityRoles: Role[] = [
    Role.CHARITABLE_ORGANIZATION,
    // Role.CHARITY_SHOP,
];

router.post("/",
    auth(...(allRoles.filter(role => !excludedCharityRoles.includes(role)))),
    image_Upload.array('images'),
    parseData(),
    assistentSellValidator,
    req_validator(),
    assistentSellControler.addNewRequest);

router.get("/",
    auth(...(allRoles.filter(role => !excludedCharityRoles.includes(role)))),
    assistentSellControler.myRequests);

router.delete("/:id",
    auth(...(allRoles.filter(role => !excludedCharityRoles.includes(role)))),
    assistentSellControler.dltRequest);


export const assistentSellRouts = router;