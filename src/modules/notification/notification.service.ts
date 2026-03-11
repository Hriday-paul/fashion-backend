import { Notification } from "../../../generated/prisma/client";
import { paginationHelper, TPaginationOptions } from "../../helper/pagination.helper";
import prisma from "../../shared/prisma";

const getNotificationFromDb = async (options: TPaginationOptions, userId: string) => {

  const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);

  const result = await prisma.notification.findMany({
    where: { receiverId: userId },
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
  })

  const total = await prisma.notification.count({
    where: { receiverId: userId },
  });

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: result,
  };
};

const NotificationUnreadCount = async (userId: string) => {

  const result = await prisma.notification.count({where: { receiverId: userId, isRead : false }})

  return result
};

const updateNotification = async (
  id: string,
  payload: Partial<Notification>
) => {
  const result = await prisma.notification.update({
    where: { id },
    data: payload
  })
  return result;
};

const makeMeRead = async (id: string, user: string) => {
  const res = await prisma.notification.update({
    where: { id, receiverId: user },
    data: {
      isRead: true
    }
  })
  return res;
};

const makeReadAll = async (user: string) => {
  const result = await prisma.notification.updateMany({
    where: { receiverId: user },
    data: { isRead: true }
  })
  return result;
};

export const notificationServices = {
  getNotificationFromDb,
  updateNotification,
  makeMeRead,
  makeReadAll,
  NotificationUnreadCount
};
