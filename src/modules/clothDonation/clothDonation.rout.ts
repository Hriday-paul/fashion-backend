import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import auth from "../../middleware/auth";
import parseData from "../../middleware/parseData";
import { rateLimiter } from "../../middleware/RateLimiter";
import req_validator from "../../middleware/req_validation";
import { image_Upload } from "../../utils/s3";
import { allRoles } from "../user/user.rout";
import { clothDonationControler } from "./clothDonationControler";
import {
    createClothDonationValidator,
    getClothDonationsQueryValidator,
    updateClothDonationStatusValidator
} from "./clothDonation.validator";

const router = Router();

// Post a new cloth donation (donor)
router.post(
    "/",
    rateLimiter(),
    auth(...allRoles),
    image_Upload.array("photos"),
    parseData(),
    createClothDonationValidator,
    req_validator(),
    clothDonationControler.createClothDonation
);


router.get(
    "/my-donations",
    auth(...allRoles),
    getClothDonationsQueryValidator,
    req_validator(),
    clothDonationControler.getDonationsAsDonor
);

// Get donations as charity (with pagination, single/multiple donationType filter, status filter)
router.get(
    "/charity",
    auth(Role.CHARITABLE_ORGANIZATION, Role.CHARITY_SHOP, Role.ADMIN),
    getClothDonationsQueryValidator,
    req_validator(),
    clothDonationControler.getDonationsAsCharity
);

// Status update (approve, decline) as charity
router.patch(
    "/:id/status",
    rateLimiter({ max: 20 }),
    auth(Role.CHARITABLE_ORGANIZATION, Role.CHARITY_SHOP, Role.ADMIN),
    updateClothDonationStatusValidator,
    req_validator(),
    clothDonationControler.updateStatusAsCharity
);

export const clothDonationRouts = router;

