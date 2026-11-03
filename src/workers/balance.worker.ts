import { Job, Worker } from "bullmq";
import { connectionInfo } from "../redis";
import { TransactionDirection, WalletTransactionType } from "../../generated/prisma/enums";
import prisma from "../shared/prisma";

// ── Worker ──────────────────────────────────────────────────────────────────
export const updateBalanceWorker = new Worker(
    "update-balance",
    async (job: Job<{ userId: string; amount: number, direction: TransactionDirection, refId ?: string, type: WalletTransactionType, description: string }>) => {

        const { userId, amount, direction, refId, type, description } = job.data;

        await prisma.$transaction(async (transactionClient) => {

            const wallet = await transactionClient.wallet.findFirst({
                where: { sellerId: userId }
            });

            const wallet_update = await transactionClient.wallet.upsert({
                where: { sellerId: userId },
                create: {
                    balance: direction === "IN" ? amount : -amount,
                    sellerId: userId
                },
                update: {
                    balance: {
                        increment: direction === "IN" ? amount : -amount
                    },
                }
            });

            const balanceBefore = Number(wallet?.balance ?? 0);
            const balanceAfter = Number(wallet_update?.balance ?? 0);

            //create a wallet transaction for the payment
            await transactionClient.walletTransaction.create({
                data: {
                    amount: amount,
                    direction: direction,
                    txType: type,
                    balanceBefore: balanceBefore,
                    balanceAfter: balanceAfter,
                    userId: userId,
                    refId: refId || null,
                    createdAt: new Date(),
                    walletId: wallet_update?.id,
                    description
                }
            });
        })

    }
);

updateBalanceWorker.on("failed", async (job, err) => {
    if (!job) return;

    //infromation about the failed job

    console.error("updateBalanceWorker failed:", err);

});

updateBalanceWorker.on("completed", async (job, result) => {
    if (!job) return;

    console.log("updateBalanceWorker completed:", job.id);
});

updateBalanceWorker.on("error", (err) => {
    console.error("updateBalanceWorker error:", err);
});