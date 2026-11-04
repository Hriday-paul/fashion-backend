import { PaginateOptions } from "../../helper/pagination.helper";
import pick from "../../shared/pick";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { paymentsService } from "../payments/payments.service";
import { accountService } from "./account.service";
import httpStatus from 'http-status';

const stripLinkAccount = catchAsync(async (req, res) => {

    const result = await accountService.stripLinkAccount(req?.user?.id);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        data: result,
        message: "Connect account URL generated successfully.",
    });
});

const refresh = catchAsync(async (req, res) => {
    const result = await accountService.refresh(req.query);

    // Remove sendResponse after res.redirect to avoid setting headers twice
    res.redirect(result);
});

const returnUrl = catchAsync(async (req, res) => {
    const result = await accountService.returnUrl(req.params?.id, req?.query as any);

    // Remove sendResponse after res.redirect to avoid setting headers twice
    res.redirect(result.url);

    //sendResponse(res, {
    //  success: true,
    //  statusCode: StatusCodes.OK,
    //  data: result,
    //  message: "Stripe account updated successfully.",
    //});
});

const getConnectedAccountData = catchAsync(async (req, res) => {

    const result = await accountService.getConnectedAccountData(req.user?.id);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        data: result,
        message: "Account data retrived successfully.",
    });
});

const accountBalance = catchAsync(async (req, res) => {
    const result = await accountService.accountBalance(req?.user?.id);
    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Account balance retrived successfully',
        data: result,
    });
});

const requestToWithdraw = catchAsync(async (req, res) => {
    const result = await accountService.requestToWithdraw(req?.user?.id, req.body.amount);
    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Withdrawal request submitted successfully',
        data: result,
    });
});

const transactionHistory = catchAsync(async (req, res) => {
    const options = pick(req.query, PaginateOptions);
    const result = await accountService.transactionHistory(req?.user?.id, options);
    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Transaction history retrived successfully',
        data: result,
    });
});

export const accountControler = {
    stripLinkAccount,
    refresh,
    returnUrl,
    getConnectedAccountData,
    requestToWithdraw,
    transactionHistory,
    accountBalance
}