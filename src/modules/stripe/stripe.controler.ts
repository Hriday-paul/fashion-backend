import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { paymentsService } from "../payments/payments.service";
import { stripeService } from "./stripe.service";
import httpStatus from 'http-status';

const stripLinkAccount = catchAsync(async (req, res) => {

    const result = await stripeService.stripLinkAccount(req?.user?.id, req.query);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        data: result,
        message: "Connect account URL generated successfully.",
    });
});

const refresh = catchAsync(async (req, res) => {
    const result = await stripeService.refresh(req.query);

    // Remove sendResponse after res.redirect to avoid setting headers twice
    res.redirect(result);
});

const returnUrl = catchAsync(async (req, res) => {
    const result = await stripeService.returnUrl(req.params?.id, req?.query as any);

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

    const result = await stripeService.getConnectedAccountData(req.user?.id);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        data: result,
        message: "Account data retrived successfully.",
    });
});

export const stripeControler = {
    stripLinkAccount,
    refresh,
    returnUrl,
    getConnectedAccountData
}