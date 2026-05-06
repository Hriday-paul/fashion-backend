import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { donationService } from "./donation.service";

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

const purchaseDonationsContribute = catchAsync(async (req: Request, res: Response) => {

    const result = await donationService.purchaseDonationsContribute(req.params.username);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Purchase Donations contribution retrived successfully',
        data: result,
    });
});

export const donationControler = {
    memberDonationStats,
    selldonations,
    purchaseDonationsContribute
}
