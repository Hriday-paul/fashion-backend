import AppError from "../../error/AppError";
import { jobs } from "../../queues/jobs.name";
import { notificationQueue } from "../../queues/notificaion.queue";
import prisma from "../../shared/prisma"
import httpstatus from "http-status"

const folowToNewMemeber = async (folowing: string, currentUser: { id: string, userName: string }) => {
    const { id: myId, userName: currentUserName } = currentUser;
    //stop own folow
    if (folowing == myId) {
        throw new AppError(httpstatus.CONFLICT, "You can't folow to me")
    }

    //checking folowing is available or not
    const member = await prisma.user.findFirst({
        where: { id: folowing, isDeleted: false }, select: {
            userName: true,
            id: true,
            fcmToken: true,
        }
    });

    if (!member) {
        throw new AppError(httpstatus.NOT_FOUND, "Member does not exist")
    }

    const folow = await prisma.follow.create({ data: { followerId: myId, followingId: folowing } });

    //send notification
    notificationQueue.add(jobs.notification, {
        allowPushNotification: true, payload: {
            title: `**${currentUserName}** folowed you`,
            message: `**${currentUserName}** started folowing you`,
            actorId: myId,
            receiverId: member?.id,
            entityId: currentUserName,
            entityType: "USER",
            entityImgs: [],
            type: "FOLLOWED",
            fcmToken: member?.fcmToken,
            groupKeyId: null,
        }
    })

    return folow
}

const unfolowMemeber = async (memberId: string, myId: string) => {

    const folow = await prisma.follow.findFirst({ where: { followerId: myId, followingId: memberId } });

    if (!folow) {
        throw new AppError(httpstatus.NOT_FOUND, "You are not folower this member")
    }

    await prisma.follow.delete({ where: { id: folow?.id } });
    return folow
}

export const folowService = {
    folowToNewMemeber,
    unfolowMemeber
}