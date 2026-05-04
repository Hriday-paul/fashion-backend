import AppError from "../../error/AppError";
import prisma from "../../shared/prisma"
import httpstatus from "http-status"

const folowToNewMemeber = async (folowing: string, myId: string) => {
    //stop own folow
    if(folowing == myId){
        throw new AppError(httpstatus.CONFLICT, "You can't folow to me")
    }
    
    const folow = await prisma.follow.create({ data: { followerId: myId, followingId: folowing } });
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