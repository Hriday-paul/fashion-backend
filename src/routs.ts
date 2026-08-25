import express, { NextFunction, Request, Response } from 'express';
import { authRouts } from './modules/auth/auth.rout';
import { userRoutes } from './modules/user/user.rout';
import { notificationRoutes } from './modules/notification/notification.routes';
import { settingsRoutes } from './modules/settings/settings.rout';
import { messagesRoutes } from './modules/messages/messages.route';
import { categoryRouter } from './modules/category/category.rout';
import { productRouts } from './modules/product/product.rout';
import { favouriteRouts } from './modules/favourite/favourite.rout';
import { orderRouts } from './modules/order/order.rout';
import { paymentsRoutes } from './modules/payments/payments.route';
import { questionRouts } from './modules/question/question.rout';
import { folowRouts } from './modules/folow/folow.rout';
import { donationRouts } from './modules/donation/donation.rout';
import { stripeRouts } from './modules/stripe/stripe.rout';
import { cartRouts } from './modules/cart/cart.rout';
import { returnRoutes } from './modules/return/return.rout';
import { reviewRouts } from './modules/review/review.rout';
import { brandRouter } from './modules/brand/brand.rout';
import { sizeRouter } from './modules/size/size.rout';

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
    {
        path: '/payments',
        route: paymentsRoutes,
    },
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
        path: '/carts',
        route: cartRouts,
    },
    {
        path: '/questions',
        route: questionRouts,
    },
    {
        path: '/orders',
        route: orderRouts,
    },
    {
        path: '/returns',
        route: returnRoutes,
    },
    {
        path: '/folow',
        route: folowRouts,
    },
    {
        path: '/donations',
        route: donationRouts,
    },
    {
        path: '/stripe',
        route: stripeRouts,
    },
    {
        path: '/reviews',
        route: reviewRouts,
    },
    {
        path: '/brands',
        route: brandRouter,
    },
    {
        path: '/sizes',
        route: sizeRouter,
    },
];

moduleRoutes.forEach(route => router.use(route.path, route.route));

export default router;