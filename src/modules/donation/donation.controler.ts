import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { donationService } from "./donation.service";
import { paymentsService } from "../payments/payments.service";
import { userService } from "../user/user.service";
import AppError from "../../error/AppError";
import pick from "../../shared/pick";
import { PaginateOptions } from "../../helper/pagination.helper";

const memberDonationStats = catchAsync(async (req: Request, res: Response) => {

    const result = await donationService.memberDonationStats(req.params.username);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Donations stats retrived successfully',
        data: result,
    });
});
const selldonations = catchAsync(async (req: Request, res: Response) => {

    const result = await donationService.selldonations(req.params.username);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Sell Donations retrived successfully',
        data: result,
    });
});

const directMoneyDonations = catchAsync(async (req: Request, res: Response) => {

    const result = await donationService.directMoneyDonations(req.params.username);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Direct Money Donations retrived successfully',
        data: result,
    });
});

const purchaseDonationsContribute = catchAsync(async (req: Request, res: Response) => {

    const result = await donationService.purchaseDonationsContribute(req.params.username);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Purchase Donations contribution retrived successfully',
        data: result,
    });
});

const treeDonations = catchAsync(async (req: Request, res: Response) => {

    const result = await donationService.treeDonations(req.params.username);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Tree Donations retrived successfully',
        data: result,
    });
});

const sellerCharitySupportStats = catchAsync(async (req: Request, res: Response) => {

    const result = await donationService.sellerCharitySupportStats(req.params.username);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Seller Charity Support Stats retrived successfully',
        data: result,
    });
});

const charityStats = catchAsync(async (req: Request, res: Response) => {

    const result = await donationService.charityStats(req.params.userName);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Charity Stats retrived successfully',
        data: result,
    });
});

const sellDonationsRaised = catchAsync(async (req: Request, res: Response) => {

    const user = await userService.getuserIdByUserName(req.params.userName);

    if (!user) {
        throw new AppError(
            httpStatus.NOT_FOUND,
            'User does not exist',
        );
    }

    const options = pick(req.query, PaginateOptions);

    const result = await paymentsService.donationRaisedFromSell(options, user?.id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Sell Donations Raised retrived successfully',
        data: result,
    });
});

const directDonationRaised = catchAsync(async (req: Request, res: Response) => {

    const user = await userService.getuserIdByUserName(req.params.userName);

    if (!user) {
        throw new AppError(
            httpStatus.NOT_FOUND,
            'User does not exist',
        );
    }

    const options = pick(req.query, PaginateOptions);

    const result = await paymentsService.directDonationRaised(options, user?.id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Direct Donations Raised retrived successfully',
        data: result,
    });
});

const extraDonationsRaised = catchAsync(async (req: Request, res: Response) => {

    const options = pick(req.query, PaginateOptions);
    const result = await donationService.extraDonationsRaised(options, req.params.userName);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Extra Donations Raised retrived successfully',
        data: result,
    });
});

export const donationControler = {
    memberDonationStats,
    selldonations,
    directMoneyDonations,
    purchaseDonationsContribute,
    treeDonations,
    sellerCharitySupportStats,
    charityStats,
    sellDonationsRaised,
    directDonationRaised,
    extraDonationsRaised
}
