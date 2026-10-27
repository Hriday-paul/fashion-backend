
import { Router } from "express";
import auth from "../../middleware/auth";
import { dashboardControler } from "./dashboard.controler";
import { Role } from "../../../generated/prisma/enums";
import { allRoles } from "../user/user.rout";

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

router.get('/charity-stats',
    auth(Role.CHARITABLE_ORGANIZATION),
    dashboardControler.charityStats);

router.get('/charity-donation-chart',
    auth(Role.CHARITABLE_ORGANIZATION),
    dashboardControler.charityDonationChart);



router.get('/seller-stats',
    auth(...allRoles),
    dashboardControler.sellerStats);

router.get('/charity-shop-stats',
    auth(Role.CHARITY_SHOP),
    dashboardControler.charityShopStats);

router.get('/charity-shop-donation-chart',
    auth(Role.CHARITY_SHOP),
    dashboardControler.charityShopChart);

router.get('/sells-chart',
    auth(...allRoles),
    dashboardControler.sellsChart);

export const dashboardRouts = router