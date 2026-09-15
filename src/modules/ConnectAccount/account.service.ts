import AppError from "../../error/AppError";
import prisma from "../../shared/prisma";
import httpStatus from "http-status";
import { stripe } from "../payments/payments.utils";
import config from "../../config";
import { WithdrawQueue } from "../../queues/withdraw.queue";
import { jobs } from "../../queues/jobs.name";
import { paginationHelper, TPaginationOptions } from "../../helper/pagination.helper";

const accountBalance = async (userId: string) => {
    const balance = await prisma.wallet.findFirst({ where: { sellerId: userId } });

    if (!balance) {
        return {
            balance: "0.00"
        }
    }

    return {
        balance: balance?.balance.toFixed(2)
    };
}

const stripLinkAccount = async (userId: string) => {
    const user = await prisma.user.findFirst({ where: { id: userId }, });

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "Account does not exist!");
    }

    try {

        const accountId = user?.stripeAccountId ?? (await stripe.accounts.create({
            email: user.email ?? undefined,
            type: "express",
        })).id;

        await prisma.user.update({ where: { id: userId }, data: { stripeAccountId: accountId } })

        const return_url = `${config.SERVER_URL}/account/connect/return/${accountId}?userId=${user.id}`;
        const refresh_url = `${config.SERVER_URL}/account/connect/refresh/${accountId}?userId=${user.id}`;

        const accountLink = await stripe.accountLinks.create({
            account: accountId,
            return_url,
            refresh_url,
            type: "account_onboarding",
        });

        return { url: accountLink?.url };
    } catch (error: any) {
        console.error("Stripe error:", error); // Log full error for debugging
        throw new AppError(httpStatus.BAD_GATEWAY, error.message || "Stripe error");
    }
};

const refresh = async (query: Record<string, any>) => {
    const { userId } = query;
    if (!userId) {
        throw new AppError(httpStatus.BAD_REQUEST, "User ID is required for refresh.");
    }

    const user = await prisma.user.findFirst({ where: { id: userId, } });

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "Account does not exist!");
    }

    if (!user.stripeAccountId) {
        throw new AppError(httpStatus.BAD_REQUEST, "Stripe account not found");
    }

    try {

        const accountId = user?.stripeAccountId;

        const accountLink = await stripe.accountLinks.create({
            account: accountId,
            return_url: `${config?.SERVER_URL}/account/connect/return/${accountId}?userId=${user?.id}`,
            refresh_url: `${config?.SERVER_URL}/account/connect/refresh/${accountId}?userId=${user?.id}`,
            type: "account_onboarding",
        });
        return accountLink.url;
    } catch (error: any) {
        throw new AppError(httpStatus.BAD_GATEWAY, error.message);
    }
};

const returnUrl = async (
    stripeAccountId: string,
    query: Record<string, any>
) => {

    const { userId } = query;
    if (!userId) {
        throw new AppError(httpStatus.BAD_REQUEST, "User ID is required for refresh.");
    }

    const user = await prisma.user.findFirst({ where: { id: userId } })

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "Account does not exist!");
    }

    const result = await prisma.user.update({
        where: {
            id: userId,
        },
        data: {
            stripeAccountId: stripeAccountId,
        },
    });

    return {
        url: `${config.BASE_URL}/account-connected-success.html`,
    };
};

const getConnectedAccountData = async (userId: string) => {
    const user = await prisma.user.findFirst({ where: { id: userId } });

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "Account does not exist!");
    }

    if (!user?.stripeAccountId) {
        return null;
    }

    const banks = await stripe.accounts.listExternalAccounts(
        user.stripeAccountId,
        { object: "bank_account" }
    );

    if (banks.data.length <= 0) {
        return null;
    }

    const bank = banks?.data[0] as any

    const bankData = {
        // bank_name: bank?.bank_name,
        account_last_num: bank.last4,
        // country: bank.country,
        // currency: bank.currency,
        status: bank.status
    }

    return bankData;
}

const requestToWithdraw = async (userId: string, amount: number) => {

    const wallet = await prisma.wallet.findFirst({
        where: { sellerId: userId }, include: {
            seller: {
                select: {
                    stripeAccountId: true
                }
            }
        }
    });

    if (!wallet) {
        throw new AppError(httpStatus.NOT_FOUND, "Insufficient balance");
    }

    if (wallet.balance < amount) {
        throw new AppError(httpStatus.BAD_REQUEST, "Insufficient balance");
    }

    if (!wallet?.seller?.stripeAccountId) {
        throw new AppError(httpStatus.BAD_REQUEST, "Payout account not connected");
    }

    //check if there is already a pending withdraw request
    let withDrawRequest = await prisma.walletPayout.findFirst({
        where: {
            walletId: wallet.id,
            status: "PENDING",
            userId: userId,
            amount: amount
        }
    });

    //create a withdraw request
    withDrawRequest = await prisma.walletPayout.create({
        data: {
            amount: amount,
            connectAccountId: wallet?.seller?.stripeAccountId,
            walletId: wallet.id,
            userId: userId,
            status: "PENDING"
        }
    });

    //add job to withdraw queue
    await WithdrawQueue.add(jobs.withDrawBalance, {
        withdrawId: withDrawRequest.id,
        walletId: wallet.id,
        connectAccountId: wallet?.seller?.stripeAccountId,
    }, {
        jobId: `withdraw_${withDrawRequest.id}`,
    });

    return;

}

const payoutHistory = async (userId: string, options: TPaginationOptions) => {

    const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);

    const payouts = await prisma.walletPayout.findMany({
        where: {
            userId: userId
        },
        skip,
        take: limit,
        orderBy: {
            [sortBy]: sortOrder,
        },
    });

    const total = await prisma.walletPayout.count({
        where: {
            userId: userId
        }
    });

    return {
        meta: paginationHelper.generatePaginationMeta({ total, page, limit }),
        data: payouts,
    };

}

export const accountService = {
    accountBalance,
    stripLinkAccount,
    refresh,
    returnUrl,
    getConnectedAccountData,
    payoutHistory,
    requestToWithdraw
};