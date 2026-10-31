import { Router } from 'express';
import { chatController } from './chat.controller';
import auth from '../../middleware/auth';
import { createChatBuyValidation, createChatValidation } from './chat.validation';
import req_validator from '../../middleware/req_validation';
import { Role } from '../../../generated/prisma/enums';
import { allRoles } from '../user/user.rout';
import { rateLimiter } from '../../middleware/RateLimiter';

const router = Router();

router.post(
  '/',
  rateLimiter(),
  auth(...allRoles),
  createChatValidation,
  req_validator(),
  chatController.createChat,
);

router.post(
  '/buy',
  rateLimiter(),
  auth(...allRoles),
  createChatBuyValidation,
  req_validator(),
  chatController.createOfferByChatForBuy,
);

// router.patch(
//   '/:id',
//   rateLimiter(),
//   auth(...allRoles),
//   createChatValidation,
//   req_validator(),
//   chatController.updateChat,
// );

// router.delete(
//   '/:id',
//   rateLimiter(),
//   auth(...allRoles),
//   chatController.deleteChat,
// );

// router.get(
//   '/my-chat-list',
//   auth(...allRoles),
//   chatController.getMyChatList,
// );

router.get(
  '/:id',
  auth(...allRoles),
  chatController.getChatById,
);

export const chatRoutes = router;
