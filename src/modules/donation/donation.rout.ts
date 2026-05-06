import { Router } from "express";
import auth from "../../middleware/auth";
import { allRoles } from "../user/user.rout";
import req_validator from "../../middleware/req_validation";
import { donationControler } from "./donation.controler";

const router = Router();

// router.get("/", auth(...allRoles), favouriteControler.favouritesByUser);

router.get("/stats/:username",
    donationControler.memberDonationStats);

router.get("/sell/:username",
    donationControler.selldonations);

router.get("/purchase/:username",
    donationControler.purchaseDonationsContribute);

export const donationRouts = router;