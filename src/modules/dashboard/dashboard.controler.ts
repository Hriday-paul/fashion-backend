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

export const dashboardControler = {
    userChart,
    countData,
    productCountByParentCategory,
    ordersOverviewChart,
    orderStatusChart,
    bestSellsUserByMonth
}