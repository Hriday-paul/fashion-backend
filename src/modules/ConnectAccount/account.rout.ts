import { Router } from "express";
import auth from "../../middleware/auth";
// import { apiLimiter } from "../auth/auth.rout";
import { allRoles } from "../user/user.rout";
import { accountControler } from "./account.controler";
import { payoutValidator } from "./account.validator";
import req_validator from "../../middleware/req_validation";

const router = Router();

router.patch("/connect", auth(...allRoles), accountControler.stripLinkAccount);

router.get("/account-data", auth(...allRoles), accountControler.getConnectedAccountData);

router.get("/connect/return/:id", accountControler.returnUrl);
router.get("/connect/refresh/:id", accountControler.refresh);

router.get("/balance", auth(...allRoles), accountControler.accountBalance);


router.get("/payouts", auth(...allRoles), accountControler.payoutHistory);

router.post("/payouts", payoutValidator, req_validator(), auth(...allRoles), accountControler.requestToWithdraw);


export const accountRouts = router;
