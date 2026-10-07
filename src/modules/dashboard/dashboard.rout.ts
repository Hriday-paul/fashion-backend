
import { Router } from "express";
import auth from "../../middleware/auth";
import { dashboardControler } from "./dashboard.controler";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.get('/userChart', auth(Role.ADMIN), dashboardControler.userChart);


router.get('/stats',
    auth(Role.ADMIN),
    dashboardControler.countData);

router.get('/productStatsByCategory',
    auth(Role.ADMIN),
    dashboardControler.productCountByParentCategory);

router.get('/ordersOverview',
    auth(Role.ADMIN),
    dashboardControler.ordersOverviewChart);

router.get('/orderStatusOverview',
    auth(Role.ADMIN),
    dashboardControler.orderStatusChart);

router.get('/bestSeller',
    auth(Role.ADMIN),
    dashboardControler.bestSellsUserByMonth);

export const dashboardRouts = router