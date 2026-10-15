import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import auth from "../../middleware/auth";
import { rateLimiter } from "../../middleware/RateLimiter";
import req_validator from "../../middleware/req_validation";
import { sellCountriesController } from "./sellCountries.controller";
import { addSellCountryValidator } from "./sellCountries.validator";

const router = Router();

// / (get all available lists without pagination or search)
router.get("/", sellCountriesController.getAllSellCountries);

// / (post a new countries, accept name & code in body)
router.post(
    "/",
    rateLimiter({ max: 20 }),
    auth(Role.ADMIN),
    addSellCountryValidator,
    req_validator(),
    sellCountriesController.addNewSellCountry
);

// /:id (delete a country)
router.delete(
    "/:id",
    rateLimiter({ max: 20 }),
    auth(Role.ADMIN),
    sellCountriesController.deleteSellCountry
);

export const sellCountriesRouter = router;

