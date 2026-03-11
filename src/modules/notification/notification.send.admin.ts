/* eslint-disable @typescript-eslint/no-explicit-any */
import { ObjectId } from "mongoose";
import { sendNotification } from "./notification.utils";
import prisma from "../../shared/prisma";
import { NotificationType, Role } from "../../../generated/prisma/enums";

export interface IAdminSendNotificationPayload {
  title: string,
  message: string
}

export const sendAdminNotifications = async (
  payload: IAdminSendNotificationPayload
) => {

  const admin = await prisma.user.findFirst({
    where: {
      auth: { role: Role.ADMIN },
      isDeleted: false
    }
  })

  if (!admin) {
    return;
  }

  // const fcmToken = admin?.fcmToken ? [admin?.fcmToken] : []

  sendNotification([], {
    receiverId: admin?.id,
    title: payload.title,
    message: payload.message,
    type: NotificationType.Text,
  }, admin?.notification);

};
