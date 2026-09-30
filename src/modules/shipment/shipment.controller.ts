import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { shipmentService } from "./shipment.service";

const webhookShipmet = catchAsync(async (req: Request, res: Response) => {


    const result = await shipmentService.webhookShipmet();
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