import { Router } from "express";
import req_validator from "../../middleware/req_validation";
import { Role } from "../../../generated/prisma/enums";
import { keywordControler } from "./keyword.controler";
import { addNewKeywordValidator, keywordSuggestionProducts } from "./keyword.validator";
import auth from "../../middleware/auth";

const router = Router();

router.get("/suggestions",
    keywordSuggestionProducts,
    req_validator(),
    keywordControler.searchSuggestions);

router.get("/people",
    keywordSuggestionProducts,
    req_validator(),
    keywordControler.peopleSuggestions);

router.post("/",
    addNewKeywordValidator,
    req_validator(),
    auth(Role.ADMIN),
    keywordControler.addNewKeyword);

router.get("/",
    auth(Role.ADMIN),
    keywordControler.allkeywords);

router.delete("/:id",
    auth(Role.ADMIN),
    keywordControler.dltKeyword);

export const keywordRoutes = router;