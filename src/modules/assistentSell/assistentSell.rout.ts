import { Router } from "express";
import auth from "../../middleware/auth";
import { allRoles } from "../user/user.rout";
import req_validator from "../../middleware/req_validation";
import { Role } from "../../../generated/prisma/enums";
import { assistentSellControler } from "./assistentSell.controler";
import { addAssitedSellListingValidator, assistentSellListValidator, assistentSellRespondValidator, assistentSellValidator } from "./assistentSell.validator";
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

router.get("/", //all requests
    auth(Role.ADMIN),
    assistentSellControler.allRequests);

router.get("/earnings", //all requests
    auth(Role.ADMIN),
    assistentSellControler.assitedSellsEarnings);

router.get("/requests", //my requests
    auth(...(allRoles.filter(role => !excludedCharityRoles.includes(role)))),
    assistentSellControler.myRequests);

router.delete("/:id",
    auth(...(allRoles.filter(role => !excludedCharityRoles.includes(role)))),
    assistentSellControler.dltRequest);

router.patch("/accept-decline",
    auth(Role.ADMIN),
    assistentSellRespondValidator,
    req_validator(),
    assistentSellControler.acceptDeclineRequest);

router.patch("/listed",
    auth(Role.ADMIN),
    assistentSellListValidator,
    req_validator(),
    assistentSellControler.markAsListed);

router.get("/stats/:requestId",
    auth(Role.ADMIN),
    assistentSellControler.requestListingStats);

router.get("/listings/:requestId",
    auth(Role.ADMIN),
    assistentSellControler.listings);

router.post("/listings",
    auth(Role.ADMIN),
    image_Upload.array('images'),
    parseData(),
    addAssitedSellListingValidator, req_validator(),
    assistentSellControler.addNewListing);

router.get("/:requestId",
    auth(Role.ADMIN),
    assistentSellControler.requestDetails);


export const assistentSellRouts = router;