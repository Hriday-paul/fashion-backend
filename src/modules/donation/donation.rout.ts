import { Router } from "express";
import auth from "../../middleware/auth";
import { allRoles } from "../user/user.rout";
import req_validator from "../../middleware/req_validation";
import { donationControler } from "./donation.controler";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

// router.get("/", auth(...allRoles), favouriteControler.favouritesByUser);

router.get("/stats/:username",
    donationControler.memberDonationStats);

router.get("/sell/:username",
    donationControler.selldonations);

router.get("/purchase/:username",
    donationControler.purchaseDonationsContribute);

router.get("/direct/:username",
    donationControler.directMoneyDonations);

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

export const donationRouts = router;