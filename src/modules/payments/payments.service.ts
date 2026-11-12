import AppError from '../../error/AppError';
import httpStatus from 'http-status';
import { createCheckoutSession } from './payments.utils';
import { Payment, Prisma as GeneratedPrisma, DirectDonation, PaymentStatus, PaymentType } from '../../../generated/prisma/client';
import prisma from '../../shared/prisma';
import { paginationHelper, TPaginationOptions } from '../../helper/pagination.helper';
import generateRandomString from '../../utils/generateRandomString';

import Stripe from 'stripe';
import config from '../../config';
import moment from 'moment';
import { jobs } from '../../queues/jobs.name';
import { BadgeGenerateQueue } from '../../queues/badge.queue';
import { notificationQueue } from '../../queues/notificaion.queue';
import { StockUpdateQueue } from '../../queues/stockUpdate.queue';
import { RefundQueue } from '../../queues/refund.queue';
import { UpdatebalanceQueue } from '../../queues/balance.queue';
import { SendMessageHandle } from '../../socket/handlers/MessageHandler';
import { ExtraDonationQueue } from '../../queues/donation.queue';

const stripe = new Stripe(config.stripe?.stripe_api_secret as string, {
  apiVersion: "2025-03-31.basil", // Valid API version
  typescript: true,
});

//-----------------create donation checkout---------------------
const donationCheckout = async (
  payload: DirectDonation,
  userId: string
) => {
  const { donatedAt, currency, updatedAt, ...body } = payload;

  if (userId == body?.charityId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You cannot donate to your own charity"
    );
  }

  const result = await prisma.$transaction(async (transactionClient) => {

    const tranId = generateRandomString(10);

    const donationdata = await transactionClient.directDonation.create({
      data: {
        ...body,
        donorId: userId
      },
      include: {
        charity: {
          include: {
            picture: true,
          },
        },
        donor: true
      },
    });

    const payment = await transactionClient.payment.create({
      data: {
        userId,
        total_amount: payload.amount,
        paid_amount: 0,
        seller_required_amount: 0,
        seller_received_amount: 0,
        status: "PENDING",
        stripe_status: "PENDING",
        donationId: donationdata.id,
        paymentType: "DONATION",
        transactionId: tranId,
      },
    });


    return { donationdata, payment };
  });

  const { donationdata: donation, payment } = result;

  if (!donation) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Donation does not exist or could not be created"
    );
  }

  const donation_charge = {
    amount: donation.amount,
    images: donation.charity?.picture?.url
      ? [donation.charity.picture.url]
      : [],
    name: `Money Donation to ${donation.charity?.fname}`,
    quantity: 1,
  };

  const checkoutSession = await createCheckoutSession({
    products: [donation_charge],
    user: donation.donor,
    paymentId: payment.id
  });

  if (!checkoutSession) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Checkout session creation failed"
    );
  }

  return checkoutSession.url;
};

const confirmPayment = async (query: Record<string, any>): Promise<{ url: string, message: string }> => {

  const { sessionId, paymentId } = query;

  const PaymentSession = await stripe.checkout.sessions.retrieve(sessionId);
  const paymentIntentId = PaymentSession.payment_intent as string;

  if (PaymentSession.status !== 'complete') {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Payment session is not completed',
    );
  }

  const payment = await prisma.payment.findFirst({
    where: { id: paymentId },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          treeCredit: true,
          buyerId: true,
          sellerId: true,
          items: {
            select: {
              product: {
                select: {
                  id: true,
                  title: true,
                  images: {
                    take: 1,
                    orderBy: {
                      order: "asc"
                    },
                    select: {
                      url: true
                    }
                  }
                }
              },
              extra_donation: true,
            }
          },
          buyer: {
            select: {
              id: true,
              userName: true,
              fcmToken: true
            }
          },
          seller: {
            select: {
              id: true,
              userName: true,
              fcmToken: true
            }
          },
          chatId: true,
        }
      },
      donation: {
        include: {
          charity: {
            select: {
              id: true,
              userName: true,
              fname: true,
              lname: true,
              fcmToken: true,
            }
          },
          donor: {
            select: {
              userName: true
            }
          }
        }
      }
    }
  });

  if (!payment) {
    throw new AppError(httpStatus.NOT_FOUND, "Payment does not exist");
  }

  if (payment?.status === "SUCCESSED") {
    return { url: `${config.BASE_URL}${config.success_url}`, message: "Payment already completed" };
  }

  if (payment?.status === "REFUNDED") {
    return { url: `${config.BASE_URL}${config.cancel_url}`, message: "Payment refunded, please try again" };
  }

  if (payment?.status === "FAILED") {
    return { url: `${config.BASE_URL}${config.cancel_url}`, message: "Payment failed, please try again" };
  }

  const isOrderpayment = payment?.paymentType === "ORDER" && payment?.order;

  const isDonationPayment = payment?.paymentType === "DONATION" && payment?.donation;
  const isShipmentPayment = payment?.paymentType === "SHIPMENT" && payment?.shipmentId;

  try {

    await prisma.$transaction(async (transactionClient) => {


      if (!payment?.userId) {
        throw new AppError(httpStatus.BAD_REQUEST, "Payment userId is missing");
      }

      let wallet = await transactionClient.wallet.findFirst({
        where: { sellerId: payment?.userId }
      });

      if (!wallet) {
        //create a new wallet for the user if not exist
        wallet = await transactionClient.wallet.create({
          data: {
            sellerId: payment?.userId,
          }
        });
      }

      //mark payment as complete
      await transactionClient.payment.update({
        where: { id: paymentId },
        data: {
          status: "SUCCESSED",
          stripe_status: isOrderpayment ? "ESCROWED" : "RELEASED",
          paymentIntentId: paymentIntentId,
          checkoutSessionId: sessionId,
          updatedAt: new Date()
        }
      });

      const txType = isOrderpayment ? "PURCHASE" : "DONATION_SENT";

      const balanceBefore = Number(wallet?.balance ?? 0);
      const amount = Number(payment?.total_amount ?? 0);

      //create a wallet transaction for the payment by payer
      await transactionClient.walletTransaction.create({
        data: {
          amount: payment?.total_amount,
          direction: "OUT",
          txType: txType,
          balanceBefore,
          balanceAfter: amount,
          walletId: wallet?.id,
          userId: payment?.userId,
          stripeBalanceTransactionId: paymentIntentId,
          refId: isOrderpayment ? payment?.orderId : payment?.donationId,
          description: isOrderpayment ? `Purchase of Products` : `Donation to charity`,
          createdAt: new Date(),
        }
      });

      //if payment is order created, crate a system message
      if (isOrderpayment && payment?.order && payment?.order?.chatId) {

        //for buyer
        const msg_buyer = await transactionClient.message.create({
          data: {
            chatId: payment?.order?.chatId,
            SystemMessage: {
              create: {
                title: `Purchase successful`,
                text: `${payment?.order?.seller?.userName} will ship your items soon. We'll keep you updated on the progress.`,
                msgForUserId: payment?.order?.buyerId,
              }
            },
            type: "SYSTEM",
          },
          include: {
            sender: {
              select: {
                id: true,
                picture: {
                  select: {
                    url: true
                  }
                },
                userName: true
              }
            },
            receiver: {
              select: {
                id: true,
                picture: {
                  select: {
                    url: true
                  }
                },
                userName: true
              }
            },
            SystemMessage: true
          }
        })

        //for seller
        const msgSeller = await transactionClient.message.create({
          data: {
            chatId: payment?.order?.chatId,
            SystemMessage: {
              create: {
                title: `Order placed successfully`,
                text: `${payment?.order?.buyer?.userName} has placed an order. Please, ship the items soon. We'll keep you updated on the progress.`,
                msgForUserId: payment?.order?.sellerId,
              }
            },
            type: "SYSTEM",
          },
          include: {
            sender: {
              select: {
                id: true,
                picture: {
                  select: {
                    url: true
                  }
                },
                userName: true
              }
            },
            receiver: {
              select: {
                id: true,
                picture: {
                  select: {
                    url: true
                  }
                },
                userName: true
              }
            },
            SystemMessage: true
          }
        })

        const user1Id = payment?.order?.buyer?.id;
        const user2Id = payment?.order?.seller?.id;

        SendMessageHandle((global as any).socketio, { ...msg_buyer, user1Id, user2Id }, () => { })
        SendMessageHandle((global as any).socketio, { ...msgSeller, user1Id, user2Id }, () => { })

      }

      //if payment is shipment payment, update shipment payment status to paid
      else if (isShipmentPayment && payment?.shipmentId) {

        //update shipment payment status to paid
        await transactionClient.shipment.update({
          where: { id: payment?.shipmentId },
          data: { isPaid: true }
        });

      }

    })

    if (isOrderpayment && payment?.order) {

      //distrubute extra donations
      await ExtraDonationQueue.add(jobs.extraDonatinDistribute, {
        orderId: payment?.order?.id
      }, {
        jobId: `distribute-extra-donation-${payment?.order?.id}`,
      });

      await StockUpdateQueue.add(jobs.stockUpdate, { orderId: payment?.order?.id }, {
        jobId: `stock-update-${payment?.order?.id}`
      });

      const treeCredit = payment?.order?.treeCredit || 0;

      const tree_count = Math.floor(treeCredit / 4); // 1 tree for every $4 spent

      // generate badge for buyer, tree gift badge
      await BadgeGenerateQueue.add(jobs.badgeGenerate, { type: "TREE_PLANTER", userId: payment?.order?.buyerId, increment: tree_count }, { jobId: `badge-generate-${payment?.order?.id}` });


      //send notification to the seller about order creation success
      await notificationQueue.add(jobs.notification, {
        allowPushNotification: true,
        payload: {
          title: `An order has been placed for your items`,
          message: `**${payment?.order?.buyer?.userName}** has placed an order **${payment?.order?.orderNumber}** for your items. Check your sell order list & make process to ship the items.`,
          actorId: payment?.order?.buyerId,
          receiverId: payment?.order?.sellerId,
          entityId: payment?.order?.buyer?.userName,
          entityType: "ORDER",
          entityImgs: payment?.order?.items?.map(item => (item?.product?.images[0]?.url)),
          type: "ORDER_PLACED",
          fcmToken: payment?.order?.seller?.fcmToken,
          groupKeyId: null,
        }
      })

      //send notification to the buyer about order creation success
      await notificationQueue.add(jobs.notification, {
        allowPushNotification: true,
        payload: {
          title: `Purchase Successful`,
          message: `Your order **${payment?.order?.orderNumber}** has been placed successfully. Check your purchase order list for tracking & shipping details.`,
          actorId: payment?.order?.buyerId,
          receiverId: payment?.order?.buyerId,
          entityId: payment?.order?.buyer?.userName,
          entityType: "ORDER",
          entityImgs: payment?.order?.items?.map(item => (item?.product?.images[0]?.url)),
          type: "ORDER_PLACED",
          fcmToken: payment?.order?.buyer?.fcmToken,
          groupKeyId: null,
        }
      })
    }

    else if (isDonationPayment && payment?.donation) {

      if (payment?.donation?.donorId) {
        //generate badge for donor
        BadgeGenerateQueue.add(jobs.badgeGenerate, { type: "MONEY_DONOR", userId: payment?.donation?.donorId });
      }

      const amount = PaymentSession.amount_total ? PaymentSession.amount_total / 100 : 0;

      //create a wallet transaction for the charity with update balance
      await UpdatebalanceQueue.add(jobs.updateBalance, {
        userId: payment?.donation?.charityId,
        amount: amount,
        direction: "IN",
        refId: paymentId,
        type: "DONATION_RECEIVED",
        description: `Donation Received`
      },
        { jobId: `direct-donation-${payment?.donation?.id}` });

      //send notification to the charity about donation received
      await notificationQueue.add(jobs.notification, {
        allowPushNotification: true,
        payload: {
          title: `Donation Received`,
          message: `Congratulations! You have received a donation of **$${payment?.donation?.amount}**. Check your wallet for the updated balance.`,
          actorId: payment?.donation?.donorId,
          receiverId: payment?.donation?.charityId,
          entityId: payment?.donation?.donor?.userName || payment?.donation?.donorId,
          entityType: "DONATION",
          entityImgs: [],
          type: "DONATION_RECEIVED",
          fcmToken: payment?.donation?.charity?.fcmToken,
          groupKeyId: null,
        }
      })

    }

    return {
      url: payment?.paymentType === "DONATION" ? `${config.BASE_URL}${config.donation_success_url}` : `${config.BASE_URL}${config.cancel_url}`,
      message: "Payment completed successfully"
    };

  } catch (error: any) {

    const totalAmount = payment?.total_amount.toFixed(2) || 0;

    const notiMsg = isOrderpayment ? `Your purchase payment has been failed. **$${totalAmount}** has been refunded to your FASHI-ON wallet.` : `Your donation payment has been failed. **$${totalAmount}** has been refunded to your FASHI-ON wallet.`;

    const tranMsg = isOrderpayment ? `Purchase Payment Refund` : `Donation Payment Refund`;

    const amount = PaymentSession.amount_total ? PaymentSession.amount_total / 100 : 0;

    await RefundQueue.add(jobs.refund, {
      paymentId,
      reason: error?.message ?? "System error",
      notificationMsg: notiMsg,
      transactionMsg: tranMsg,
      userId: payment?.userId,
      markPaymentRefunded: true,
      amount: amount
    }, {
      jobId: `refund-${paymentId}`,
    });

    return { url: `${config.BASE_URL}${config.cancel_url}`, message: "Payment failed, please try again" };

  }

};

const getAllPayments = async (query: Record<string, unknown>, options: TPaginationOptions) => {

  const AndConditions: GeneratedPrisma.PaymentWhereInput[] = [];

  const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);
  const { searchTerm, startDate, endDate, status, paymentType } = query;

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
            userName: {
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

  if (startDate) {
    const start = moment(startDate as string).startOf('day').toDate();
    AndConditions.push({
      createdAt: {
        gte: start
      }
    });
  }

  if (endDate) {
    const end = moment(endDate as string).endOf('day').toDate();
    AndConditions.push({
      createdAt: {
        lte: end
      }
    });
  }

  if (status) {
    AndConditions.push({
      status: status as PaymentStatus
    });
  }

  if (paymentType) {
    AndConditions.push({
      paymentType: paymentType as PaymentType
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
      user: {
        select: {
          userName: true,
          picture: {
            select: {
              url: true
            }
          }
        }
      },
      refunds: true
    },
  });

  const total = await prisma.payment.count({
    where: whereConditions,
  });

  return {
    meta: paginationHelper.generatePaginationMeta({ page, limit, total }),
    data: payments,
  };

};

const paymentStats = async () => {
  const totalSuccessPaymentAmount = await prisma.payment.aggregate({
    where: {
      status: "SUCCESSED"
    },
    _sum: {
      paid_amount: true
    }
  });

  const canceledPaymentAmount = await prisma.payment.aggregate({
    where: {
      status: "CANCELLED"
    },
    _sum: {
      paid_amount: true
    }
  });

  const failedPaymentAmount = await prisma.payment.aggregate({
    where: {
      status: "FAILED"
    },
    _sum: {
      paid_amount: true
    }
  });

  return {
    totalSuccessPaymentAmount: totalSuccessPaymentAmount._sum.paid_amount || 0,
    canceledPaymentAmount: canceledPaymentAmount._sum.paid_amount || 0,
    failedPaymentAmount: failedPaymentAmount._sum.paid_amount || 0
  };

}

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

const sellEarnings = async (options: TPaginationOptions, sellerId: string) => {

  const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);

  const orders = await prisma.order.findMany({
    where: {
      sellerId: sellerId,
      payment: {
        status: {
          in: ["SUCCESSED", "REFUNDED"]
        }
      }
    },
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
    select: {
      id: true,
      orderNumber: true,
      payment: {
        select: {
          status: true,
          stripe_status: true,
          transactionId: true,
          createdAt: true,
        }
      },
      sellerTotal: true,
      createdAt: true,
      buyer: {
        select: {
          id: true,
          fname: true,
          lname: true,
          userName: true,
          picture: {
            select: {
              url: true
            }
          }
        }
      }
    },
  });

  const total = await prisma.order.count({
    where: {
      sellerId: sellerId,
      payment: {
        status: {
          in: ["SUCCESSED", "REFUNDED"]
        }
      }
    }
  })

  return {
    meta: paginationHelper.generatePaginationMeta({ page, limit, total }),
    data: orders,
  };

}

const donationRaisedFromSell = async (options: TPaginationOptions, charityId: string) => {

  const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);

  const donations = await prisma.sellDonation.findMany({
    where: {
      charityId: charityId,
      status: "PAID",
      total_amount: {
        gt: 0
      }
    },
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },

    include: {
      thanksMessage: true,
      orderItem: {
        select: {
          productId: true,
          product: {
            select: {
              title: true,
              images: {
                take: 1,
                orderBy: {
                  order: "asc"
                },
                select: {
                  url: true
                }
              },
              user: {
                select: {
                  picture: true
                }
              }
            }
          }
        }
      }
    }

  });

  const total = await prisma.sellDonation.count({
    where: {
      charityId: charityId,
      status: "PAID",
      total_amount: {
        gt: 0
      }
    }
  })

  return {
    meta: paginationHelper.generatePaginationMeta({ page, limit, total }),
    data: donations,
  };

}

const directDonationRaised = async (options: TPaginationOptions, charityId: string) => {

  const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);

  const donations = await prisma.directDonation.findMany({
    where: {
      charityId: charityId,
      payment: {
        status: "SUCCESSED"
      },
      amount: {
        gt: 0
      }
    },
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      thanksMsg: true,
      donor: {
        select: {
          userName: true,
          fname: true,
          lname: true,
          picture: {
            select: {
              url: true
            }
          }
        }
      }
    }

  });

  const total = await prisma.directDonation.count({
    where: {
      charityId: charityId,
      payment: {
        status: "SUCCESSED"
      },
      amount: {
        gt: 0
      }
    },
  })

  return {
    meta: paginationHelper.generatePaginationMeta({ page, limit, total }),
    data: donations,
  };

}

const platformEarnignStats = async () => {

  const assitedSellEarnings = await prisma.order.aggregate({
    where: {
      status: "COMPLETED",
      assistedSellCommission: { gt: 0 },
      payment: {
        status: {
          in: ["SUCCESSED", "REFUNDED"]
        }
      },
    },
    _sum: {
      assistedSellCommission: true
    },
  });

  const authenticationEarnings = await prisma.order.aggregate({
    where: {
      authStatus: "RESPONDED",
      authenticationFee: { gt: 0 },
      allowedAuthentication: true,
      payment: {
        status: {
          in: ["SUCCESSED", "REFUNDED"]
        }
      },
    },
    _sum: {
      authenticationFee: true
    },
  });

  const serviceFeeEarnings = await prisma.order.aggregate({
    where: {
      serviceFee: { gt: 0 },
      payment: {
        status: {
          in: ["SUCCESSED", "REFUNDED"]
        }
      },
    },
    _sum: {
      serviceFee: true
    },
  });

  return {
    assitedSellEarnings: assitedSellEarnings._sum.assistedSellCommission || 0,
    authenticationEarnings: authenticationEarnings._sum.authenticationFee || 0,
    serviceFeeEarnings: serviceFeeEarnings._sum.serviceFee || 0
  };

}

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

  sellEarnings,
  donationRaisedFromSell,
  directDonationRaised,
  platformEarnignStats,
  paymentStats
};
