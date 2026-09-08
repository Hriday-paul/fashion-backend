/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import { messagesService } from './messages.service';
import sendResponse from '../../utils/sendResponse';
import pick from '../../shared/pick';
import { PaginateOptions } from '../../helper/pagination.helper';
import { uploadManyToS3 } from '../../utils/s3';

const createMessages = catchAsync(async (req: Request, res: Response) => {

  const files = req.files as Express.Multer.File[];

  const FileAry = files?.map(image => {
    return {
      file: image,
      path: `images/chat/images`,
    };
  });

  const urls = await uploadManyToS3(FileAry);
  req.body.files = urls.map(url => {
    return {
      key: url.key,
      url: url.url,
      title: url.title,
      type: url?.isImage ? "IMAGE" : "DOCUMENT"
    };
  });

  req.body.senderId = req.user.id;

  const result = await messagesService.createMessages(req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Message sent successfully',
    data: result,
  });
});

// Get all messages by chatId
const getAllPreMessages = catchAsync(async (req: Request, res: Response) => {
  const options = pick(req.query, PaginateOptions);

  const result = await messagesService.getAllPreMessages(req?.params?.friendUserName, req?.user?.id, options);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Pre Messages retrieved successfully',
    data: result,
  });
});

// Get messages by chat ID
const getMessagesByChatId = catchAsync(async (req: Request, res: Response) => {
  const result = await messagesService.getMessagesByChatId(req.params.chatId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Messages retrieved successfully',
    data: result,
  });
});

// Get message by ID
const getMessagesById = catchAsync(async (req: Request, res: Response) => {
  const result = await messagesService.getMessagesById(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Message retrieved successfully',
    data: result,
  });
});

// Update message
const updateMessages = catchAsync(async (req: Request, res: Response) => {

  const result = await messagesService.updateMessages(req.params.id, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Message updated successfully',
    data: result,
  });
});

//seen messages
const seenMessage = catchAsync(async (req: Request, res: Response) => {

  const result = await messagesService.seenMessage(
    req.user.id,
    req.params.chatId,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Message seen successfully',
    data: result,
  });
});

// Delete message
const deleteMessages = catchAsync(async (req: Request, res: Response) => {
  const result = await messagesService.deleteMessages(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Message deleted successfully',
    data: result,
  });
});

const unreadMessageCount = catchAsync(async (req: Request, res: Response) => {
  const result = await messagesService.unreadMessageCount(req?.user?.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Unread message count retrived successfully',
    data: result,
  });
});

export const messagesController = {
  createMessages,
  getAllPreMessages,
  getMessagesByChatId,
  getMessagesById,
  updateMessages,
  deleteMessages,
  seenMessage,
  unreadMessageCount
};
