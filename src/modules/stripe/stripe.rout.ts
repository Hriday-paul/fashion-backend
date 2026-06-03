import { Router } from "express";
import auth from "../../middleware/auth";
import { stripeControler } from "./stripe.controler";
import { allRoles } from "../user/user.rout";

const router = Router();

router.patch("/connect", auth(...allRoles), stripeControler.stripLinkAccount);
router.get("/account-data", auth(...allRoles), stripeControler.getConnectedAccountData);
router.get("/return/:id", stripeControler.returnUrl);
router.get("/refresh/:id", stripeControler.refresh);

export const stripeRouts = router;
