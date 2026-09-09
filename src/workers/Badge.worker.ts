import { connectionInfo } from "../redis";
import { Job, UnrecoverableError, Worker } from "bullmq"
import prisma from "../shared/prisma";
import { BadgeRole, BadgeType } from "../../generated/prisma/client";
import { notificationQueue } from "../queues/notificaion.queue";
import { jobs } from "../queues/jobs.name"
import { BadgeGenerateQueue } from "../queues/badge.queue";

const badgeWorker = new Worker("badge", async (job: Job<{ type: BadgeType, userId: string, increment?: number }>) => {

    const { type, userId, increment = 1 } = job.data;

    const userAuth = await prisma.auth.findFirst({
        where: {
            userId: userId
        },
        select: {
            role: true,
            user: {
                select: {
                    fcmToken: true,
                    userName: true
                }
            }
        }
    });

    if (!userAuth) {
        throw new UnrecoverableError(`User with id ${userId} does not exist`);
    }

    const role = userAuth.role;

    const badge_role: BadgeRole = role == "CHARITY_SHOP" ? BadgeRole.CHARITY_SHOP : role == "CHARITABLE_ORGANIZATION" ? BadgeRole.CHARITABLE_ORGANIZATION : role == "ECO_FRIENDLY_STORE" ? BadgeRole.ECO_FRIENDLY : BadgeRole.GENERAL;

    const badge = await prisma.badge.findFirst({
        where: {
            role: badge_role,
            type: type
        }
    });

    if (!badge) {
        // this badge type is not applicable for this user role, so we can just return without doing anything
        return;
    }

    //check if the user already have the badge
    const userBadge = await prisma.userBadge.findFirst({
        where: {
            userId: userId,
            badgeId: badge.id
        }
    });

    const alreadyCompleted = userBadge ? userBadge.isCompleted : false;

    if (alreadyCompleted) {
        //user already completed the badge, no need to update
        return;
    }

    const progress = userBadge ? ((userBadge.progress + increment) >= badge?.target ? badge?.target : (userBadge.progress + increment)) : 1;

    const isCompleted = badge ? progress >= badge?.target : false;

    const newbadge = await prisma.userBadge.upsert({
        where: {
            userId_badgeId: {
                userId: userId,
                badgeId: badge.id,
            },
        },
        update: {
            isCompleted: isCompleted,
            progress: progress
        },
        create: {
            userId: userId,
            badgeId: badge.id,
            isCompleted: isCompleted,
            progress: progress
        },
        include: {
            badge: true
        }
    })

    if (isCompleted) {

        //send notification to user

        //send notification
        notificationQueue.add(jobs.notification, {
            allowPushNotification: true, payload: {
                title: `Congratulations! You have earned a new badge`,
                message: `Congratulations! You have earned **${newbadge?.badge?.name}** new badge. Check it out in your profile.`,
                actorId: userId,
                receiverId: userId,
                entityId: userAuth.user?.userName,
                entityType: "BADGE",
                entityImgs: [],
                type: "BADGE_EARNED",
                fcmToken: userAuth.user?.fcmToken,
                groupKeyId: null,
            }
        })

        //check & add new fashion activist badge for 10+ badges
        BadgeGenerateQueue.add(jobs.badgeGenerate, { type: "FASHION_ACTIVIST", userId, increment: 1 });
    }

}, { connection: connectionInfo });
