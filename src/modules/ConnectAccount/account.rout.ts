import { Router } from "express";
import auth from "../../middleware/auth";
// import { apiLimiter } from "../auth/auth.rout";
import { allRoles } from "../user/user.rout";
import { accountControler } from "./account.controler";
import { payoutValidator } from "./account.validator";
import req_validator from "../../middleware/req_validation";
import { rateLimiter } from "../../middleware/RateLimiter";

const router = Router();

router.patch("/connect", rateLimiter(), auth(...allRoles), accountControler.stripLinkAccount);

router.get("/account-data", auth(...allRoles), accountControler.getConnectedAccountData);

router.get("/connect/return/:id", accountControler.returnUrl);
router.get("/connect/refresh/:id", accountControler.refresh);

router.get("/balance", auth(...allRoles), accountControler.accountBalance);

router.get("/transactions", auth(...allRoles), accountControler.transactionHistory);

router.post("/payouts", rateLimiter(), payoutValidator, req_validator(), auth(...allRoles), accountControler.requestToWithdraw);


export const accountRouts = router;
