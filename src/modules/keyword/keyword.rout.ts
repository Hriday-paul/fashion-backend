import { Router } from "express";
import auth from "../../middleware/auth";
import { allRoles } from "../user/user.rout";
import req_validator from "../../middleware/req_validation";
import { Role } from "../../../generated/prisma/enums";
import parseData from "../../middleware/parseData";
import { image_Upload } from "../../utils/s3";
import { keywordControler } from "./keyword.controler";
import { keywordSuggestionProducts } from "./keyword.validator";

const router = Router();

router.get("/suggestions",
    keywordSuggestionProducts,
    req_validator(),
    keywordControler.searchSuggestions);

router.get("/people",
    keywordSuggestionProducts,
    req_validator(),
    keywordControler.peopleSuggestions);

export const keywordRoutes = router;