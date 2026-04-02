import { connectionInfo } from "../redis";
import { Worker } from "bullmq"
import prisma from "../shared/prisma";
import AppError from "../error/AppError";
import httpStatus from "http-status"

new Worker("distribute-payment", async job => {


    const { orderId } = job.data;

    try {

        const order = await prisma.order.findFirst({ where: { id: orderId } });

        if(!order){
            throw new AppError(httpStatus.NOT_FOUND, "Order not found")
        }
        if(order?.status !== "COMPLETED"){
            throw new AppError(httpStatus.BAD_REQUEST, "Invalid Request")
        }

        


    } catch (err: any) {
        console.log("------payment distribute failed ❌------");

    }

}, { connection: connectionInfo });