import AppError from '../../error/AppError';
import httpStatus from 'http-status';
import { createCheckoutSession } from './payments.utils';
import { Payment, Prisma as GeneratedPrisma, User } from '../../../generated/prisma/client';
import prisma from '../../shared/prisma';
import { paginationHelper, TPaginationOptions } from '../../helper/pagination.helper';
import generateRandomString from '../../utils/generateRandomString';
import { sendAdminNotifications } from '../notification/notification.send.admin';

import Stripe from 'stripe';
import config from '../../config';
import moment from 'moment';

const stripe = new Stripe(config.stripe?.stripe_api_secret as string, {
  apiVersion: "2025-03-31.basil", // Valid API version
  typescript: true,
});

//-----------------create checkout---------------------
const checkout = async (reservationId: string, userId: string) => {

  const result = await prisma.$transaction(async (transactionClient) => {
    const reservation = await prisma.reservation.findFirst({ where: { id: reservationId } });

    if (!reservation) {
      throw new AppError(httpStatus.NOT_FOUND, "Reservation not found")
    }

    let paymentData;

    // Check for existing unpaid payment for the reservation
    const isExistPayment = await transactionClient.payment.findFirst({
      where: {
        reservationId: reservation?.id,
        userId: userId,
      }
    })

    const tranId = generateRandomString(10);

    if (isExistPayment) {

      if (isExistPayment?.isPaid) {
        throw new AppError(httpStatus.BAD_REQUEST, "Payment already made success")
      }

      const payment = await transactionClient.payment.update({
        where: { id: isExistPayment?.id },
        data: {
          transactionId: tranId,
          amount: reservation?.final_price,
        },
        include: {
          user: true
        }

      })

      paymentData = payment

    } else {

      const createdPayment = await transactionClient.payment.create({
        data: {
          userId,
          amount: reservation?.final_price,
          isPaid: false,
          reservationId: reservation?.id,
          transactionId: tranId,
        },
        include: {
          user: true
        }
      })


      if (!createdPayment) {
        throw new AppError(
          httpStatus.INTERNAL_SERVER_ERROR,
          'Failed to create payment',
        );
      }
      paymentData = createdPayment;

    }

    if (!paymentData) throw new AppError(httpStatus.BAD_REQUEST, 'Payment not found');

    if (!paymentData?.user) throw new AppError(httpStatus.BAD_REQUEST, 'User not found');


    const checkoutSession = await createCheckoutSession({
      // customerId: customer.id,
      product: {
        amount: paymentData?.amount,
        //@ts-ignore
        name: reservation?.order_type + `(${reservation?.trip_type})`,
        quantity: 1,
      },

      user: paymentData?.user,

      //@ts-ignore
      paymentId: paymentData?.id,
    });

    if (!checkoutSession) {
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'Checkout session creation failed');
    }

    return checkoutSession?.url

  })

  return result;

};

const confirmPayment = async (query: Record<string, any>) => {

  const { sessionId, paymentId } = query;

  const PaymentSession = await stripe.checkout.sessions.retrieve(sessionId);
  const paymentIntentId = PaymentSession.payment_intent as string;

  if (PaymentSession.status !== 'complete') {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Payment session is not completed',
    );
  }

  try {
    const result = await prisma.$transaction(async (transactionClient) => {

      const payment = await transactionClient.payment.findFirst({ where: { id: paymentId } });

      if (!payment) {
        throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
      }

      await transactionClient.payment.update({
        where: { id: paymentId },
        data: {
          isPaid: true,
          paymentData: PaymentSession as any,
        }
      });


      sendAdminNotifications({
        title: "New Reservation Payment Received",
        message: `A new reservation payment has been successfully received from Rider. Transaction id is : ${payment?.transactionId}`
      });

    })

    return result;
  } catch (error: any) {

    if (paymentIntentId) {
      try {
        await stripe.refunds.create({
          payment_intent: paymentIntentId,
        });
      } catch (refundError: any) {
        console.error('Error processing refund:', refundError.message);
      }
    }

    throw new AppError(httpStatus.BAD_GATEWAY, error.message);
  }

};


const getAllPayments = async (query: Record<string, unknown>, options: TPaginationOptions) => {

  const AndConditions: GeneratedPrisma.PaymentWhereInput[] = [
    {
      isPaid: true
    }
  ];

  const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);
  const { searchTerm } = query;

  if (searchTerm) {
    AndConditions.push({
      OR: [
        {
          transactionId: {
            contains: searchTerm as string,
            mode: "insensitive",
          },
        },

        {
          user: {
            name: {
              contains: searchTerm as string,
              mode: "insensitive",
            }
          },
        },
        {
          user: {
            phone: {
              contains: searchTerm as string,
              mode: "insensitive",
            }
          },
        },
        {
          user: {
            email: {
              contains: searchTerm as string,
              mode: "insensitive",
            }
          },
        },

      ],
    });
  }

  const whereConditions: GeneratedPrisma.PaymentWhereInput = AndConditions.length > 0 ? { AND: AndConditions } : {};

  const payments = await prisma.payment.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      user: { include: { picture: true } }
    },
  });

  const total_earning = await prisma.payment.aggregate({
    where: { isPaid: true },
    _sum: { amount: true },
  })

  const startOfTodayUTC = moment.utc().startOf("day").toDate();
  const endOfTodayUTC = moment.utc().endOf("day").toDate();

  const today_earning = await prisma.payment.aggregate({
    where: {
      isPaid: true,
      createdAt: {
        gte: startOfTodayUTC,
        lte: endOfTodayUTC,
      },
    },
    _sum: {
      amount: true,
    },
  });

  const total = await prisma.payment.count({
    where: whereConditions,
  });

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: { payments, today_earning, total_earning },
  };

};

const getPaymentsByUserId = async (
  options: TPaginationOptions,
  userId: string,
) => {

  const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);

  const payments = await prisma.payment.findMany({
    where: { userId, isPaid: true },
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
    select: {
      paymentData: false,
      id: true,
      amount: true,
      transactionId: true,
      isPaid: true,
      createdAt: true,
    }
  })

  const total = await prisma.payment.count({
    where: { userId },
  });

  return {
    meta: {
      total,
      page,
      limit,
      totalPage: Math.ceil(total / limit)
    },
    data: payments,
  };
};

// Get a payment by ID
const getPaymentsById = async (id: string) => {
  // const payment = await Payment.findById(id);
  // if (!payment) {
  //   throw new AppError(httpStatus.NOT_FOUND, 'Payment not found');
  // }
  return { message: "Api not build" };
};

// Update a payment by ID
const updatePayments = async (id: string, updatedData: Payment) => {
  // const updatedPayment = await Payment.findByIdAndUpdate(id, updatedData, {
  //   new: true,
  // });
  // if (!updatedPayment) {
  //   throw new AppError(httpStatus.NOT_FOUND, 'Payment not found to update');
  // }
  return { message: "Api not build" };
};

// Delete a payment by ID
const deletePayments = async (id: string) => {
  // const deletedPayment = await Payment.findByIdAndDelete(id);
  // if (!deletedPayment) {
  //   throw new AppError(httpStatus.NOT_FOUND, 'Payment not found to delete');
  // }
  return { message: "Api not build" };
};

const generateInvoice = async (payload: any) => {
};

export const paymentsService = {
  // createPayments,
  getAllPayments,
  getPaymentsById,
  updatePayments,
  deletePayments,
  checkout,
  confirmPayment,
  getPaymentsByUserId,
  generateInvoice,
};
