/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import httpStatus from "http-status";
import AppError from "../../error/AppError";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { notificationServices } from "./notification.service";
import pick from "../../shared/pick";
import { PaginateOptions } from "../../helper/pagination.helper";
import prisma from "../../shared/prisma";

const getAllNotification = catchAsync(async (req: Request, res: Response) => {
  const options = pick(req.query, PaginateOptions);
  const result = await notificationServices.getNotificationFromDb(options, req?.user?.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Notifications retrieved successfully",
    data: result,
  });
});

const makeRead = catchAsync(async (req: Request, res: Response) => {

  const id = req.params.id;

  const isNotification = await prisma.notification.findFirst({
    where : {id, receiverId : req.user?.id}
  })

  if (!isNotification) throw new AppError(httpStatus.NOT_FOUND, "Notification is not exist!");


  if (isNotification?.receiverId != req.user.id) {
    throw new AppError(httpStatus.FORBIDDEN, "You are not owner to this notification");
  }

  const result = await notificationServices.makeMeRead(id, req.user.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Notifications read successfully",
    data: result,
  });

})

const makeReadAll = catchAsync(async (req: Request, res: Response) => {

  const result = await notificationServices.makeReadAll(req.user.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "All Notifications read successfully",
    data: result,
  });

})

const NotificationUnreadCount = catchAsync(async (req: Request, res: Response) => {

  const result = await notificationServices.NotificationUnreadCount(req.user.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Notification unread count retrived successfully",
    data: result,
  });

})

export const notificationController = {
  getAllNotification,
  makeRead,
  makeReadAll,
  NotificationUnreadCount
};
