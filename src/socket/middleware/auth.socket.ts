import { Socket } from "socket.io";
import config from "../../config";
import { JwtPayload } from "jsonwebtoken";
import jwt from "jsonwebtoken"
import prisma from "../../shared/prisma";
import { Role } from "../../../generated/prisma/enums";


export const socketAuthMiddleware = async (
  socket: Socket,
  next: (err?: Error) => void,
) => {
  try {

    const token =
      socket.handshake.auth?.token || socket.handshake.headers?.token;
    //----------------------check Token and return user details-------------------------//
    const decode = jwt.verify(
      token,
      config.jwt_access_secret as string,
    ) as JwtPayload;

    const user = await prisma.user.findFirst({
      where: { id: decode?.userId },
      include: {
        auth: true
      }
    })

    const admin = await prisma.user.findFirst({
      where : {auth : {role : Role.ADMIN}}
    })

    if (!user) return next(new Error('Authentication failed'));

    // Attach user to socket (use type assertion if needed)
    socket.data = {
      userId: user?.id,
      name: user?.fname,
      role: user?.auth?.role,
      adminId : admin?.id
    };

    next();
  } catch (err) {
    next(err as Error);
  }
};