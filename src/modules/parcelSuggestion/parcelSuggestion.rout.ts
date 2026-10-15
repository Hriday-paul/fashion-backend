import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import auth from "../../middleware/auth";
import { rateLimiter } from "../../middleware/RateLimiter";
import req_validator from "../../middleware/req_validation";
import { parcelSuggestionController } from "./parcelSuggestion.controller";
import { addParcelSuggestionValidator, editParcelSuggestionValidator } from "./parcelSuggestion.validator";

const router = Router();

// Get suggestion by categoryId (also supports listing all if categoryId is omitted)
router.get("/:categoryId", parcelSuggestionController.getSuggestionByCategoryId);

router.get("/", parcelSuggestionController.getSuggestionByCategoryId);

router.post(
    "/",
    rateLimiter({ max: 20 }),
    auth(Role.ADMIN),
    addParcelSuggestionValidator,
    req_validator(),
    parcelSuggestionController.addSuggestionByCategory
);

router.put(
    "/:categoryId",
    rateLimiter({ max: 20 }),
    auth(Role.ADMIN),
    addParcelSuggestionValidator,
    req_validator(),
    parcelSuggestionController.editSuggestionByCategory
);

// Delete suggestion by category (Admin)
router.delete(
    "/:categoryId",
    rateLimiter({ max: 20 }),
    auth(Role.ADMIN),
    parcelSuggestionController.deleteSuggestionByCategory
);

export const parcelSuggestionRouter = router;

