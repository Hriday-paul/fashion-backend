import express, { NextFunction, Request, Response } from 'express';
import { authRouts } from './modules/auth/auth.rout';
import { userRoutes } from './modules/user/user.rout';
// import { paymentsRoutes } from './modules/payments/payments.route';
import { packageRouters } from './modules/package/package.rout';
// import { dashboardRouts } from './modules/dasboard/dashboard.rout';
import { notificationRoutes } from './modules/notification/notification.routes';
import { settingsRoutes } from './modules/settings/settings.rout';
import { messagesRoutes } from './modules/messages/messages.route';
import { categoryRouter } from './modules/category/category.rout';
import { productRouts } from './modules/product/product.rout';
import { favouriteRouts } from './modules/favourite/favourite.rout';
import { orderRouts } from './modules/order/order.rout';

const router = express.Router();

const moduleRoutes = [
    {
        path: '/auth',
        route: authRouts,
    },
    {
        path: '/users',
        route: userRoutes,
    },
    {
        path: '/messages',
        route: messagesRoutes,
    },
    // {
    //     path: '/payments',
    //     route: paymentsRoutes,
    // },
    {
        path: '/notifications',
        route: notificationRoutes,
    },
    {
        path: '/setting',
        route: settingsRoutes,
    },
    {
        path: '/category',
        route: categoryRouter,
    },
    {
        path: '/products',
        route: productRouts,
    },
    {
        path: '/favourites',
        route: favouriteRouts,
    },
    {
        path: '/orders',
        route: orderRouts,
    },
];

moduleRoutes.forEach(route => router.use(route.path, route.route));

export default router;