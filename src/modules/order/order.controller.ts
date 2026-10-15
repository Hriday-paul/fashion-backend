import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { orderService } from "./order.service";
import pick from "../../shared/pick";
import { PaginateOptions } from "../../helper/pagination.helper";
import { uploadManyToS3 } from "../../utils/s3";
import { userService } from "../user/user.service";
import AppError from "../../error/AppError";

const addNewOrder = catchAsync(async (req: Request, res: Response) => {
    // add order
    const result = await orderService.addNewOrder(req.body, req.user?.id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Order created successfully, Pay now',
        data: result,
    });
});

const addNewSingleOrder = catchAsync(async (req: Request, res: Response) => {
    // add order
    const result = await orderService.addNewSingleOrder(req.body, { email: req.user?.email, userId: req.user?.id });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Order created successfully, Pay now',
        data: result,
    });
});

const addNewOfferOrder = catchAsync(async (req: Request, res: Response) => {
    // add order
    const result = await orderService.addNewOfferOrder(req.body, req.user?.id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Order created successfully, Pay now',
        data: result,
    });
});

const ordersForSellerByUserName = catchAsync(async (req: Request, res: Response) => {

    const query = pick(req.query, ["searchTerm", "status"])
    const options = pick(req.query, PaginateOptions);

    const userName = req.params?.userName;

    const user = await userService.getuserIdByUserName(userName);

    if (!user) {
        throw new AppError(
            httpStatus.NOT_FOUND,
            'User does not exist',
        );
    }

    const result = await orderService.ordersAsASeller(user?.id, query, options);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Orders retrieved successfully',
        data: result,
    });
});

const orders = catchAsync(async (req: Request, res: Response) => {

    const query = pick(req.query, ["searchTerm", "status", "currentShipTo", "paymentStatus"])
    const options = pick(req.query, PaginateOptions);

    const result = await orderService.orders(query, options);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Orders retrieved successfully',
        data: result,
    });
});

const ordersBySeller = catchAsync(async (req: Request, res: Response) => {

    const query = pick(req.query, ["searchTerm", "status"])
    const options = pick(req.query, PaginateOptions);

    const result = await orderService.ordersAsASeller(req.user?.id, query, options);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Orders retrieved successfully',
        data: result,
    });
});

const ordersAsABuyer = catchAsync(async (req: Request, res: Response) => {

    const query = pick(req.query, ["searchTerm", "status"])
    const options = pick(req.query, PaginateOptions);

    const result = await orderService.ordersAsABuyer(req.user?.id, query, options);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Orders retrieved successfully',
        data: result,
    });
});

const ordersAsABuyerByUserName = catchAsync(async (req: Request, res: Response) => {

    const query = pick(req.query, ["searchTerm", "status"])
    const options = pick(req.query, PaginateOptions);

    const userName = req.params?.userName;

    const user = await userService.getuserIdByUserName(userName);

    if (!user) {
        throw new AppError(
            httpStatus.NOT_FOUND,
            'User does not exist',
        );
    }

    const result = await orderService.ordersAsABuyer(user?.id, query, options);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Orders retrieved successfully',
        data: result,
    });
});

const authenticationOrders = catchAsync(async (req: Request, res: Response) => {

    const query = pick(req.query, ["searchTerm", "status", "paymentStatus", "authStatus", "dateFrom", "dateTo", "currentShipTo"])
    const options = pick(req.query, PaginateOptions);

    const result = await orderService.authenticationOrders(query, options);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Orders retrieved successfully',
        data: result,
    });
});

//buyer mark order received
const confirmOrderReceived = catchAsync(async (req: Request, res: Response) => {
    const { id: userId } = req.user;

    await orderService.confirmOrderReceived(req.body.orderId, userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Order completed successfully',
    });
});


const cancelOrderItemBySeller = catchAsync(async (req: Request, res: Response) => {

    const files = req.files as Express.Multer.File[];

    if (files) {

        const FileAry = files?.map(file => {
            return {
                file,
                path: `evidences/cancelled`,
            };
        });

        const urls = await uploadManyToS3(FileAry);
        req.body.cancelEvidences = urls.map(url => {
            return {
                key: url.key,
                url: url.url,
            };
        });
    }

    await orderService.cancelOrderItemBySeller(req.body, req.user);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Order cancelled successfully',
    });
});


const requestCancelOrderItem = catchAsync(async (req: Request, res: Response) => {
    const { id: userId } = req.user;

    const files = req.files as Express.Multer.File[];

    if (files) {

        const FileAry = files?.map(file => {
            return {
                file,
                path: `evidences/cancelled`,
            };
        });

        const urls = await uploadManyToS3(FileAry);
        req.body.cancelEvidences = urls.map(url => {
            return {
                key: url.key,
                url: url.url,
            };
        });
    }

    await orderService.requestCancelOrderItem(req.body, userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Cancel request submitted successfully',
    });
});


const approveCancelOrderItemBySeller = catchAsync(async (req: Request, res: Response) => {
    const { id: userId } = req.user;

    await orderService.approveCancelOrderItemBySeller(req.body?.orderItemId, userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Order cancel approved successfully',
    });
});

const declineCancelOrderItemBySeller = catchAsync(async (req: Request, res: Response) => {
    const { id: userId } = req.user;

    await orderService.declineCancelOrderItemBySeller(req.body?.orderItemId, userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Order cancel declined successfully',
    });
});

const markOrderReceivedFromAuthCenter = catchAsync(async (req: Request, res: Response) => {
    await orderService.markOrderReceivedFromAuthCenter(req.body?.orderId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Order marked as received from authentication center successfully',
    });
});

const markOrderAuthInProgress = catchAsync(async (req: Request, res: Response) => {
    await orderService.markOrderAuthInProgress(req.body?.orderId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Order marked as in progress for authentication successfully',
    });
});
const addAuthResultToOrder = catchAsync(async (req: Request, res: Response) => {
    await orderService.addAuthResultToOrder(req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Authentication result added to order successfully',
    });
});

const getShippingLebel = catchAsync(async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const { id: userId } = req.user;

    const labelUrl = await orderService.getShipingLebel(orderId, userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Shipping label retrieved successfully',
        data: { labelUrl },
    });
});

const getAuthShippingLebel = catchAsync(async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const { id: userId } = req.user;

    const labelUrl = await orderService.getAuthShippingLebel(userId, orderId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Shipping label retrieved successfully',
        data: { labelUrl },
    });
});

const orderDetails = catchAsync(async (req: Request, res: Response) => {
    const { orderCode } = req.params;

    const data = await orderService.orderDetails(orderCode);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Order details retrieved successfully',
        data,
    });
});

const orderStats = catchAsync(async (req: Request, res: Response) => {

    const data = await orderService.orderStats();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Order stats retrieved successfully',
        data,
    });
});

export const orderControler = {
    addNewSingleOrder,
    addNewOrder,
    addNewOfferOrder,
    authenticationOrders,
    orders,
    ordersBySeller,
    ordersAsABuyer,
    confirmOrderReceived,
    cancelOrderItemBySeller,
    requestCancelOrderItem,
    approveCancelOrderItemBySeller,
    declineCancelOrderItemBySeller,
    getShippingLebel,

    ordersForSellerByUserName,
    ordersAsABuyerByUserName,
    markOrderReceivedFromAuthCenter,
    markOrderAuthInProgress,
    addAuthResultToOrder,
    getAuthShippingLebel,
    orderDetails,
    orderStats
}
