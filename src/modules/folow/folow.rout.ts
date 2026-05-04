import { Router } from "express";
import auth from "../../middleware/auth";
import { allRoles } from "../user/user.rout";
import { folowControler } from "./folow.controler";
import { addFolowValidator } from "./folow.validator";
import req_validator from "../../middleware/req_validation";

const router = Router();

router.post(
    '/',
    addFolowValidator,
    req_validator(),
    auth(...allRoles),
    folowControler.folowToNewMemeber,
);
router.post(
    '/unfolow',
    addFolowValidator,
    req_validator(),
    auth(...allRoles),
    folowControler.unfolowMemeber,
);

export const folowRouts = router;

