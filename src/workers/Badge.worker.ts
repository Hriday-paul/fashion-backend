import { connectionInfo } from "../redis";
import { Job, Worker } from "bullmq"
import prisma from "../shared/prisma";
import { BadgeRole, BadgeType, Notification, Role } from "../../generated/prisma/client";
import { pushNotificationQueue } from "../queues/notificaion.queue";
import { jobs } from "../queues/jobs.name";
import { sendPushNotification } from "../modules/notification/notification.utils";

const badgeWorker = new Worker("badge", async (job: Job<{ role : Role, type : BadgeType, userId : string }>) => {

    const { role, type, userId } = job.data;

    const badge_role : BadgeRole = role == "CHARITY_SHOP" ? BadgeRole.CHARITY_SHOP : role == "CHARITABLE_ORGANIZATION" ? BadgeRole.CHARITABLE_ORGANIZATION : role == "ECO_FRIENDLY_STORE" ? BadgeRole.ECO_FRIENDLY : BadgeRole.GENERAL;

    const badge = await prisma.badge.findFirst({
        where: {
            role: badge_role,
            type: type
        }
    });

    if(!badge) {
        throw new Error(`Badge does not exist for role ${badge_role} and type ${type}`);
    }

    //check if the user already has the badge
    const userBadge = await prisma.userBadge.findFirst({
        where: {
            userId: userId,
            badgeId: badge.id
        }
    });

    const progress = userBadge ?( userBadge.progress + 1) : 1;

    const isCompleted = badge ? progress >= badge?.target : false;

    if(userBadge && userBadge?.isCompleted) {
        return;
    }else if(userBadge) {
        //update the user badge
        await prisma.userBadge.update({
            where: {
                id: userBadge.id
            },
            data: {
                isCompleted: isCompleted,
                progress: progress
            }
        });
    }else {
        //create a new user badge
        await prisma.userBadge.create({
            data: {
                userId: userId,
                badgeId: badge.id,
                isCompleted: isCompleted,
                progress: progress
            }
        });
    }

}, { connection: connectionInfo });
