import { Router } from "express";
import { favouriteControler } from "./favourite.controler";
import auth from "../../middleware/auth";
import { allRoles } from "../user/user.rout";
import { addFavouriteValidator } from "./favourite.validator";
import req_validator from "../../middleware/req_validation";

const router = Router();

router.get("/", auth(...allRoles), favouriteControler.favouritesByUser);

router.post("/",
    addFavouriteValidator,
    req_validator(),
    auth(...allRoles),
    favouriteControler.addFavourite);

router.delete("/:id",
    auth(...allRoles),
    favouriteControler.deleteFavourite);

export const favouriteRouts = router;