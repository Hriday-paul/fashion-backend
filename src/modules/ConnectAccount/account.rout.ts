import { Router } from "express";
import auth from "../../middleware/auth";
// import { apiLimiter } from "../auth/auth.rout";
import { allRoles } from "../user/user.rout";
import { accountControler } from "./account.controler";

const router = Router();

router.patch("/connect", auth(...allRoles), accountControler.stripLinkAccount);

router.get("/account-data", auth(...allRoles), accountControler.getConnectedAccountData);

router.get("/connect/return/:id", accountControler.returnUrl);
router.get("/connect/refresh/:id", accountControler.refresh);

router.get("/balance", auth(...allRoles), accountControler.accountBalance);

export const accountRouts = router;
