import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import { dashboardService } from "./dashboard.service";
import sendResponse from "../../utils/sendResponse";
import httpStatus from 'http-status'

const userChart = catchAsync(async (req: Request, res: Response) => {
    const result = await dashboardService.userChart(req.query);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'user chart data retrive successfully',
        data: result,
    });
})

const countData = catchAsync(async (req: Request, res: Response) => {
    const result = await dashboardService.countData();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'total count data retrive successfully',
        data: result,
    });
})

const productCountByParentCategory = catchAsync(async (req: Request, res: Response) => {
    const result = await dashboardService.productCountByParentCategory();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'product count by parent category data retrive successfully',
        data: result,
    });
})

const ordersOverviewChart = catchAsync(async (req: Request, res: Response) => {
    const result = await dashboardService.ordersOverviewChart(req.query);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'orders overview chart data retrive successfully',
        data: result,
    });
})

const orderStatusChart = catchAsync(async (req: Request, res: Response) => {
    const result = await dashboardService.orderStatusChart(req.query);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'order status chart data retrive successfully',
        data: result,
    });
})

const bestSellsUserByMonth = catchAsync(async (req: Request, res: Response) => {
    const result = await dashboardService.bestSellsUserByMonth(req.query);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'best sells user by month data retrive successfully',
        data: result,
    });
})

const charityStats = catchAsync(async (req: Request, res: Response) => {

    const result = await dashboardService.charityStats(req.user?.id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'charity stats data retrive successfully',
        data: result,
    });
})

const charityDonationChart = catchAsync(async (req: Request, res: Response) => {

    const result = await dashboardService.charityDonationChart(req.user?.id, req.query);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'charity donation chart data retrive successfully',
        data: result,
    });
})

const charityShopStats = catchAsync(async (req: Request, res: Response) => {

    const result = await dashboardService.charityShopStats(req.user?.id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'charity shop stats data retrive successfully',
        data: result,
    });
})
const charityShopChart = catchAsync(async (req: Request, res: Response) => {

    const result = await dashboardService.charityShopChart(req.user?.id, req.query);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'charity shop chart data retrive successfully',
        data: result,
    });
})
const sellsChart = catchAsync(async (req: Request, res: Response) => {

    const result = await dashboardService.sellsChart(req.user?.id, req.query);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'sells chart data retrive successfully',
        data: result,
    });
})
const sellerStats = catchAsync(async (req: Request, res: Response) => {

    const result = await dashboardService.sellerStats(req.user?.id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'seller stats data retrive successfully',
        data: result,
    });
})

export const dashboardControler = {
    userChart,
    countData,
    productCountByParentCategory,
    ordersOverviewChart,
    orderStatusChart,
    bestSellsUserByMonth,
    charityStats,
    charityDonationChart,

    charityShopStats,
    charityShopChart,
    sellerStats,
    sellsChart
}