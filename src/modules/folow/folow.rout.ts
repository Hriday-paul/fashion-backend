import { Router } from "express";
import auth from "../../middleware/auth";
import { allRoles } from "../user/user.rout";
import { folowControler } from "./folow.controler";
import { addFolowValidator } from "./folow.validator";
import req_validator from "../../middleware/req_validation";
import { rateLimiter } from "../../middleware/RateLimiter";

const router = Router();

router.post(
    '/',
     rateLimiter(),
    addFolowValidator,
    req_validator(),
    auth(...allRoles),
    folowControler.folowToNewMemeber,
);
router.post(
    '/unfolow',
     rateLimiter(),
    addFolowValidator,
    req_validator(),
    auth(...allRoles),
    folowControler.unfolowMemeber,
);

export const folowRouts = router;

