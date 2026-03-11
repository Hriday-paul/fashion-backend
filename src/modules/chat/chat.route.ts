import { Router } from 'express';
import { chatController } from './chat.controller';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constants';
import { createChatValidation } from './chat.validation';
import req_validator from '../../middleware/req_validation';
import { Role } from '../../../generated/prisma/enums';

const router = Router();

router.post(
  '/',
   auth(Role.ADMIN, Role.INDIVIDUAL_USER, Role.AMBASSADOR, Role.ASSISTED_SELLER, Role.CELEBRITY, Role.CHARITABLE_ORGANIZATION, Role.CHARITY_SHOP, Role.ECO_FRIENDLY_STORE, Role.PROFESSIONAL_SELLER),
  createChatValidation,
  req_validator(),
  chatController.createChat,
);

router.patch(
  '/:id',
   auth(Role.ADMIN, Role.INDIVIDUAL_USER, Role.AMBASSADOR, Role.ASSISTED_SELLER, Role.CELEBRITY, Role.CHARITABLE_ORGANIZATION, Role.CHARITY_SHOP, Role.ECO_FRIENDLY_STORE, Role.PROFESSIONAL_SELLER),
  createChatValidation,
  req_validator(),
  chatController.updateChat,
);

router.delete(
  '/:id',
   auth(Role.ADMIN, Role.INDIVIDUAL_USER, Role.AMBASSADOR, Role.ASSISTED_SELLER, Role.CELEBRITY, Role.CHARITABLE_ORGANIZATION, Role.CHARITY_SHOP, Role.ECO_FRIENDLY_STORE, Role.PROFESSIONAL_SELLER),
  chatController.deleteChat,
);

router.get(
  '/my-chat-list',
   auth(Role.ADMIN, Role.INDIVIDUAL_USER, Role.AMBASSADOR, Role.ASSISTED_SELLER, Role.CELEBRITY, Role.CHARITABLE_ORGANIZATION, Role.CHARITY_SHOP, Role.ECO_FRIENDLY_STORE, Role.PROFESSIONAL_SELLER),
  chatController.getMyChatList,
);

router.get(
  '/:id',
   auth(Role.ADMIN, Role.INDIVIDUAL_USER, Role.AMBASSADOR, Role.ASSISTED_SELLER, Role.CELEBRITY, Role.CHARITABLE_ORGANIZATION, Role.CHARITY_SHOP, Role.ECO_FRIENDLY_STORE, Role.PROFESSIONAL_SELLER),
  chatController.getChatById,
);

export const chatRoutes = router;
