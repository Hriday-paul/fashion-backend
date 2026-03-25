import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { orderService } from "./order.service";
import { paymentsService } from "../payments/payments.service";

const addNewOrder = catchAsync(async (req: Request, res: Response) => {
    // add order
    const result = await orderService.addNewOrder(req.body, req.user?.id);
    // generate payment link
    const paymentLink = await paymentsService.checkout(result?.id, req.user?.id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Order created successfully, Pay now',
        data: paymentLink,
    });
});

export const orderControler = {
    addNewOrder
}
