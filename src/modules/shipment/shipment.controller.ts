import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { shipmentService } from "./shipment.service";
import AppError from "../../error/AppError";

const webhookShipmet = catchAsync(async (req: Request, res: Response) => {

    const signatureU = req.headers["X-EASYSHIP-SIGNATURE"] as string;
    const signatureL = req.headers["x-easyship-signature"] as string;

    const signature = signatureU || signatureL;

    if (!signature) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            'Missing signature in the request',
        );
    }

    const result = await shipmentService.webhookShipmet(signature, req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Shipment webhook processed successfully',
        data: result,
    });
});

export const shipmentController = {
    webhookShipmet
}