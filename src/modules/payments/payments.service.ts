import AppError from '../../error/AppError';
import httpStatus from 'http-status';
import { createCheckoutSession, createDonationCheckoutSession } from './payments.utils';
import { Payment, Prisma as GeneratedPrisma, DirectDonation } from '../../../generated/prisma/client';
import prisma from '../../shared/prisma';
import { paginationHelper, TPaginationOptions } from '../../helper/pagination.helper';
import generateRandomString from '../../utils/generateRandomString';

import Stripe from 'stripe';
import config from '../../config';
import moment from 'moment';
import { CompletePaymentQueue } from '../../queues/completePayment.queue';
import { jobs } from '../../queues/jobs.name';

const stripe = new Stripe(config.stripe?.stripe_api_secret as string, {
  apiVersion: "2025-03-31.basil", // Valid API version
  typescript: true,
});

//-----------------create donation checkout---------------------
const donationCheckout = async (payload: DirectDonation, userId: string) => {

  const { paymentIntentId, donatedAt, currency, status, transactionId, updatedAt, ...body } = payload;

  const result = await prisma.$transaction(async (transactionClient) => {

    let donation = await transactionClient.directDonation.findFirst({
      where: { donorId: userId, charityId: payload.charityId, status: "PENDING", amount: payload.amount },
      include: {
        charity: true,
        donor: true,
      }
    });

    const tranId = generateRandomString(10);

    if (!donation) {
      donation = await transactionClient.directDonation.create({
        data: {
          ...body,
          transactionId: tranId,
          donorId: userId,
          status: "PENDING"
        },
        include: {
          charity: true,
          donor: true,
        }
      });
    } else {
      await transactionClient.directDonation.update({
        where: { id: donation.id },
        data: { status: "PENDING", transactionId: tranId, amount: payload.amount },
        include: {
          charity: true,
          donor: true,
        }
      });
    }

    if (!donation?.charity?.stripeAccountId) {
      throw new AppError(httpStatus.BAD_REQUEST, 'This charity is not set up to receive payments yet.');
    }

    if (!donation) throw new AppError(httpStatus.BAD_REQUEST, 'Donation not found');

    const donation_charge = {
      amount: donation?.amount,
      images: [],
      name: `Money Donation to ${donation.charity?.fname}`,
      quantity: 1,
    }

    const checkoutSession = await createDonationCheckoutSession({
      // customerId: customer.id,
      products: [donation_charge],
      user: donation?.donor!,
      donationId: donation?.id,
      stripeAccountId: donation?.charity?.stripeAccountId,
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

  //mark payment as complete
  await CompletePaymentQueue.add(jobs.markPaymentAsCompleted, {
    paymentId: paymentId,
    paymentIntentId: paymentIntentId,
    checkoutSessionId: sessionId
  });

};

const confirmDonationPayment = async (query: Record<string, any>) => {

  const { sessionId, donationId } = query;

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

      const donation = await transactionClient.directDonation.findFirst({ where: { id: donationId } });

      if (!donation) {
        throw new AppError(httpStatus.NOT_FOUND, "Donation not found");
      }

      if (donation?.status == "SUCCESS") {
        return;
      }

      await transactionClient.directDonation.update({
        where: { id: donationId },
        data: {
          status: "SUCCESS",
          paymentIntentId,
          donatedAt: new Date(),
        }
      });

      //send notification
      // sendAdminNotifications({
      //   title: "New Order Payment Received",
      //   message: `A new Order payment has been successfully received from a customer. Transaction id is : ${payment?.transactionId}`
      // });

    })

    return result;
  } catch (error: any) {

    if (paymentIntentId) {
      try {
        await stripe.refunds.create({
          payment_intent: paymentIntentId,
        });
        await prisma.directDonation.update({
          where: { id: donationId },
          data: {
            status: "REFUNDED",
            paymentIntentId,
            donatedAt: null,
          }
        });
      } catch (refundError: any) {
        console.error('Error processing refund:', refundError.message);
        throw new AppError(httpStatus.BAD_GATEWAY, refundError.message);
      }
    }

    throw new AppError(httpStatus.BAD_GATEWAY, error.message);
  }

};

const getAllPayments = async (query: Record<string, unknown>, options: TPaginationOptions) => {

  const AndConditions: GeneratedPrisma.PaymentWhereInput[] = [
    {
      status: "SUCCESSED"
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
            fname: {
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
    where: { status: "SUCCESSED" },
    _sum: { total_amount: true },
  })

  const startOfTodayUTC = moment.utc().startOf("day").toDate();
  const endOfTodayUTC = moment.utc().endOf("day").toDate();

  const today_earning = await prisma.payment.aggregate({
    where: {
      createdAt: {
        gte: startOfTodayUTC,
        lte: endOfTodayUTC,
      },
    },
    _sum: {
      total_amount: true,
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
    where: { userId, status: "SUCCESSED" },
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
    select: {
      paymentData: false,
      id: true,
      total_amount: true,
      transactionId: true,
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
  confirmPayment,
  getPaymentsByUserId,
  generateInvoice,
  donationCheckout,
  confirmDonationPayment,
};
