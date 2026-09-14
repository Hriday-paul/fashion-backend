import { Job, UnrecoverableError, Worker } from "bullmq";
import { connectionInfo } from "../redis";
import prisma from "../shared/prisma";


// ── Worker ──────────────────────────────────────────────────────────────────
export const stockUpdateWorker = new Worker(
    "stock-update",
    async (job: Job<{ orderId: string }>) => {

        const { orderId } = job.data;

        const order = await prisma.order.findFirst({
            where: { id: orderId },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                            }
                        }
                    }
                }
            }
        });

        if (!order) {
            throw new UnrecoverableError("Order does not exist");
        }

        const update = await prisma.product.updateMany({
            where: {
                id: {
                    in: order.items.map(item => item.productId),
                },
                stock: {
                    gt: 0
                }
            },
            data: {
                stock: {
                    decrement: 1
                }
            }
        });




    },
    {
        connection: connectionInfo
    }
);

stockUpdateWorker.on("failed", async (job, err) => {
    if (!job) return;

    //notification to admin about stock update failure

});

stockUpdateWorker.on("completed", async (job, result) => {



});

stockUpdateWorker.on("error", (err) => {
    console.error("stock update error:", err);
});