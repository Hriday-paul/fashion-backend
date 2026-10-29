import { Router } from "express";
import auth from "../../middleware/auth";
import { allRoles } from "../user/user.rout";
import req_validator from "../../middleware/req_validation";
import { donationControler } from "./donation.controler";
import { Role } from "../../../generated/prisma/enums";
import { thanksSendValidator } from "./doantion.validator";
import { rateLimiter } from "../../middleware/RateLimiter";

const router = Router();

// router.get("/", auth(...allRoles), favouriteControler.favouritesByUser);

router.get("/stats/:username",
    donationControler.memberDonationStats);

router.get("/contribution-stats",
    auth(...allRoles),
    donationControler.contributionStats);

router.get("/sell/:username",
    donationControler.selldonations);

router.get("/sell-contributed",
    auth(...allRoles),
    donationControler.sellDonationContributed);

router.get("/purchase/:username",
    donationControler.purchaseDonationsContribute);

router.get("/direct/:username",
    donationControler.directMoneyDonations);

router.get("/direct-contributed",
    auth(...allRoles),
    donationControler.directDonationContributed);

router.get("/tree/:username",
    donationControler.treeDonations);

router.get("/seller-charity-support/:username",
    donationControler.sellerCharitySupportStats);

router.get("/charity-stats/:userName",
    auth(Role.ADMIN),
    donationControler.charityStats);

router.get("/sell-raised/:userName",
    auth(Role.ADMIN),
    donationControler.sellDonationsRaised);

router.get("/direct-raised/:userName",
    auth(Role.ADMIN),
    donationControler.directDonationRaised);

router.get("/extra-raised/:userName",
    auth(Role.ADMIN),
    donationControler.extraDonationsRaised);

router.get("/sell-raised-list",
    auth(Role.CHARITY_SHOP, Role.CHARITABLE_ORGANIZATION),
    donationControler.mySellDonationsRaised);

router.get("/direct-raised-list",
    auth(Role.CHARITY_SHOP, Role.CHARITABLE_ORGANIZATION),
    donationControler.mydirectDonationRaised);

router.get("/extra-raised-list",
    auth(Role.CHARITY_SHOP, Role.CHARITABLE_ORGANIZATION),
    donationControler.myExtraDonationsRaised);

router.post("/thanks-message",
    rateLimiter(),
    thanksSendValidator,
    req_validator(),
    auth(Role.CHARITY_SHOP, Role.CHARITABLE_ORGANIZATION),
    donationControler.sendThanksMessage);

export const donationRouts = router;