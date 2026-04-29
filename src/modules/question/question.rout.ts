import { Router } from "express";
import auth, { PublicAuth } from "../../middleware/auth";
import { allRoles } from "../user/user.rout";
import req_validator from "../../middleware/req_validation";
import { questionControler } from "./question.controler";
import { addAnswerValidator, addQuestionValidator } from "./question.validator";

const router = Router();

router.get("/:id", PublicAuth(), questionControler.questionsByProd); //by productId

router.post("/",
    addQuestionValidator,
    req_validator(),
    auth(...allRoles),
    questionControler.addQuestionToProd);

router.post("/answer",
    addAnswerValidator,
    req_validator(),
    auth(...allRoles),
    questionControler.answerToQues);

export const questionRouts = router;