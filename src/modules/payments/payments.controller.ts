import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import { paymentsService } from './payments.service';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';
import pick from '../../shared/pick';
import { PaginateOptions } from '../../helper/pagination.helper';
import config from '../../config';

const donationCheckout = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentsService.donationCheckout(req.body, req?.user?.id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    data: result,
    message: 'Payment link get successful',
  });
});

const confirmPayment = catchAsync(async (req: Request, res: Response) => {

  const result = await paymentsService.confirmPayment(req?.query);

  res.redirect(`${config.BASE_URL}${config.success_url}`);

  // sendResponse(res, {
  //   success: true,
  //   statusCode: httpStatus.OK,
  //   data: result,
  //   message: 'payment successful',
  // });
});



const getPaymentsByUserId = catchAsync(async (req: Request, res: Response) => {
  const options = pick(req.query, PaginateOptions);
  const result = await paymentsService.getPaymentsByUserId(options, req.user?.id);
  if (!result) {
    return sendResponse(res, {
      success: false,
      statusCode: httpStatus.NOT_FOUND,
      message: 'Payment not found',
      data: {},
    });
  }
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    data: result,
    message: 'Payment retrieved successfully',
  });
});

const getPaymentsByUserIdWithParams = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  // const result = await paymentsService.getPaymentsByUserId(id, req.query);
  // if (!result) {
  //   return sendResponse(res, {
  //     success: false,
  //     statusCode: httpStatus.NOT_FOUND,
  //     message: 'Payment not found',
  //     data: {},
  //   });
  // }
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    data: {},
    message: 'Payment retrieved successfully',
  });
});

const getAllPayments = catchAsync(async (req: Request, res: Response) => {
  const query = pick(req.query, ["searchTerm", "status", "paymentType", "startDate", "endDate"]);
  const options = pick(req.query, PaginateOptions);
  const result = await paymentsService.getAllPayments(query, options);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    data: result,
    message: 'All payments retrieved successfully',
  });
});

const paymentStats = catchAsync(async (req: Request, res: Response) => {

  const result = await paymentsService.paymentStats();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    data: result,
    message: 'Payment stats retrieved successfully',
  });
});

const getPaymentsById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await paymentsService.getPaymentsById(id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    data: result,
    message: 'Payment retrieved successfully',
  });
});

const updatePayments = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const paymentData = req.body;
  const result = await paymentsService.updatePayments(id, paymentData); // Assume this service method exists

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    data: result,
    message: 'Payment updated successfully',
  });
});
const deletePayments = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await paymentsService.deletePayments(id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.NO_CONTENT,
    message: 'Payment deleted successfully',
    data: result,
  });
});

const sellEarnings = catchAsync(async (req: Request, res: Response) => {
  const options = pick(req.query, PaginateOptions);
  const result = await paymentsService.sellEarnings(options, req?.user?.id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    data: result,
    message: 'Sell Earnings retrieved successfully',
  });
});

const donationRaisedFromSell = catchAsync(async (req: Request, res: Response) => {
  const options = pick(req.query, PaginateOptions);
  const result = await paymentsService.donationRaisedFromSell(options, req?.user?.id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    data: result,
    message: 'Sell Donations retrieved successfully',
  });
});

const directDonationRaised = catchAsync(async (req: Request, res: Response) => {
  const options = pick(req.query, PaginateOptions);
  const result = await paymentsService.directDonationRaised(options, req?.user?.id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    data: result,
    message: 'Direct Donations retrieved successfully',
  });
});


const platformEarnignStats = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentsService.platformEarnignStats();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    data: result,
    message: 'Platform earnings stats retrieved successfully',
  });
});

export const paymentsController = {
  paymentStats,
  getAllPayments,
  getPaymentsById,
  updatePayments,
  deletePayments,
  confirmPayment,
  getPaymentsByUserId,
  getPaymentsByUserIdWithParams,
  donationCheckout,

  sellEarnings,
  donationRaisedFromSell,
  directDonationRaised,
  platformEarnignStats
};
