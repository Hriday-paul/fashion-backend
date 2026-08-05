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

const stripe = new Stripe(config.stripe?.stripe_api_secret as string, {
  apiVersion: "2025-03-31.basil", // Valid API version
  typescript: true,
});

//-----------------create checkout---------------------
const checkout = async (orderId: string, userId: string) => {

  const result = await prisma.$transaction(async (transactionClient) => {

    const order = await transactionClient.order.findFirst({
      where: { id: orderId }, include: {
        items: {
          include: {
            product: {
              include: {
                images: true
              }
            },
            donations: true,
          }
        },
        deliveryCharge: true,
        seller: true
      }
    });

    if (!order) {
      throw new AppError(httpStatus.NOT_FOUND, "Order not found")
    }

    let paymentData;

    // Check for existing unpaid payment for the reservation
    const isExistPayment = await transactionClient.payment.findFirst({
      where: {
        orderId: order?.id,
        userId: userId,
        status: {
          notIn: ["FAILED", "CANCELLED", "REFUNDED"]
        }
      }
    });

    const tranId = generateRandomString(10);

    if (isExistPayment) {

      if (isExistPayment?.status == "SUCCESSED") {
        throw new AppError(httpStatus.BAD_REQUEST, "Payment already made success")
      }

      const payment = await transactionClient.payment.update({
        where: { id: isExistPayment?.id },
        data: {
          transactionId: tranId,
          total_amount: order?.totalPrice,
          paid_amount: 0,
          seller_required_amount: 0,
          seller_received_amount: 0,
          status: "PENDING",
          stripe_status: "PENDING"
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
          total_amount: order?.totalPrice,
          paid_amount: 0,
          seller_required_amount: 0,
          seller_received_amount: 0,
          status: "PENDING",
          stripe_status: "PENDING",
          orderId: order?.id,
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

    // order products
    const products = order?.items?.map(item => {
      return {
        amount: item?.unitPrice,
        images: item?.product?.images.map(img => img?.url),
        name: item?.product?.title,
        quantity: item?.quantity,
      }
    });

    const extra_donation = order?.items.reduce((itemSum, item) => itemSum + (item?.extra_donation ?? 0), 0);

    const donation_charge = {
      amount: extra_donation,
      images: [],
      name: "Extra Donation",
      quantity: 1,
    }

    const treeCost = {
      amount: order?.treeCredit,
      images: [],
      name: "Tree plantation cost",
      quantity: 1,
    }

    // build delivery charge line item
    const totalDeliveryCharge = order?.deliveryCharge?.finalCharge || 0;

    const delivary_charge = {
      amount: totalDeliveryCharge,
      images: [],
      name: "Delivery Charge",
      description: "",
      quantity: 1,
    }

    const checkoutSession = await createCheckoutSession({
      // customerId: customer.id,
      products: [...products, donation_charge, delivary_charge, treeCost],
      user: paymentData?.user,
      paymentId: paymentData?.id,
    });

    if (!checkoutSession) {
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'Checkout session creation failed');
    }

    return checkoutSession?.url

  })

  return result;

};

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

  try {
    const result = await prisma.$transaction(async (transactionClient) => {

      const payment = await transactionClient.payment.findFirst({ where: { id: paymentId } });

      if (!payment) {
        throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
      }

      if (payment?.status == "SUCCESSED") {
        return;
      }

      await transactionClient.payment.update({
        where: { id: paymentId },
        data: {
          status: "SUCCESSED",
          stripe_status: "ESCROWED",
          paymentIntentId,
          checkoutSessionId: sessionId,
          escrowedAt: new Date(),
          paid_amount: (PaymentSession?.amount_total || 0) / 100,
          seller_received_amount: 0,
          transferGroup: `order_${paymentId}`,
          paymentData: PaymentSession as any,
        }
      });

      //update delivery charge paid
      await transactionClient.orderDeliveryCharge.upsert({
        where: { orderId: payment?.orderId! },
        update: {
          status: "PAID"
        },
        create: {
          status: "PAID",
          orderId: payment?.orderId!,
          baseCharge: PaymentSession?.amount_subtotal ? PaymentSession?.amount_subtotal / 100 : 0,
          finalCharge: PaymentSession?.amount_total ? PaymentSession?.amount_total / 100 : 0,
          paidAt: new Date(),
        }
      })

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
        await prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: "CANCELLED",
            stripe_status: "CANCELLED",
            paymentIntentId,
            checkoutSessionId: sessionId,
            escrowedAt: null,
            paid_amount: 0,
            seller_received_amount: 0,
            transferGroup: `order_${paymentId}`,
            paymentData: {},
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
  checkout,
  confirmPayment,
  getPaymentsByUserId,
  generateInvoice,
  donationCheckout,
  confirmDonationPayment,
};
