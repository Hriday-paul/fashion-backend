import { Notification } from "../../../generated/prisma/client";
import { paginationHelper, TPaginationOptions } from "../../helper/pagination.helper";
import { redisPub } from "../../redis";
import { redisKeys } from "../../redis/keys";
import prisma from "../../shared/prisma";

const getNotificationFromDb = async (options: TPaginationOptions, userId: string) => {

  const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);

  const cacheQuery = {
    limit,
    skip,
    sortBy,
    sortOrder,
    page,
  };

  //check if the notifications are cached in redis
  const cacheKey = await redisKeys.notificationsKey({ userId, query: cacheQuery });
  const cachedNotifications = await redisPub.get(cacheKey);

  if (cachedNotifications) {
    return JSON.parse(cachedNotifications);
  }

  const result = await prisma.notification.findMany({
    where: { receiverId: userId },
    include: {
      actor: {
        select: {
          picture: true,
          userName: true,
        }
      }
    },
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
  })

  const total = await prisma.notification.count({
    where: { receiverId: userId },
  });

  const unReadCount = await prisma.notification.count({
    where: { receiverId: userId, isRead: false },
  });

  const res = {
    meta: paginationHelper.generatePaginationMeta({ total, page, limit }),
    unReadCount,
    data: result,
  };

  //cache the notifications in redis
  await redisPub.setEx(cacheKey, 3600, JSON.stringify(res)); // Cache for 1 hour

  return res;
};

const NotificationUnreadCount = async (userId: string) => {

  //check if the unread count is cached in redis
  const cacheKey = await redisKeys.notificationUnreadCountKey({ userId });
  const cachedUnreadCount = await redisPub.get(cacheKey);
  if (cachedUnreadCount) {
    return parseInt(cachedUnreadCount, 10);
  }

  const result = await prisma.notification.count({ where: { receiverId: userId, isRead: false } });

  //cache the unread count in redis
  await redisPub.setEx(cacheKey, 3600, result.toString()); // Cache for 1 hour

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
  });

  //increment redis notification version for cache invalidation
  await redisKeys.incrementNotificationVersion({ userId: user });
  return res;
};

const makeReadAll = async (user: string) => {
  const result = await prisma.notification.updateMany({
    where: { receiverId: user },
    data: { isRead: true }
  });

  //increment redis notification version for cache invalidation
  await redisKeys.incrementNotificationVersion({ userId: user });

  return result;
};

export const notificationServices = {
  getNotificationFromDb,
  updateNotification,
  makeMeRead,
  makeReadAll,
  NotificationUnreadCount
};
