import { Router } from "express";
import auth from "../../middleware/auth";
import req_validator from "../../middleware/req_validation";
import { settingsControler } from "./settings.controler";
import { SettingsValidator, updateSettingsValidator } from "./settings.validator";
import { Role } from "../../../generated/prisma/enums";
import { rateLimiter } from "../../middleware/RateLimiter";

const router = Router();

router.get('/:key', SettingsValidator, req_validator(), settingsControler.singleSettingItem);

router.patch(
    '/',
     rateLimiter(),
    auth(Role.ADMIN),
    updateSettingsValidator,
    req_validator(),
    settingsControler.updateSettingItem,
);

export const settingsRoutes = router;