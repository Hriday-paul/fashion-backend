import { Router } from 'express';
import { messagesController } from './messages.controller';
import { sendMessageValidator } from './messages.validation';
import parseData from '../../middleware/parseData';
import auth from '../../middleware/auth';
import req_validator from '../../middleware/req_validation';
import { Role } from '../../../generated/prisma/enums';

const router = Router();
// const storage = memoryStorage();
// const upload = multer({ storage });

// router.post(
//   '/send-messages',
//   auth(USER_ROLE.user, USER_Role.ADMIN),
//   upload.single('image'),
//   parseData(),
//   sendMessageValidator,
//   req_validator(),
//   messagesController.createMessages,
// );

// router.patch(
//   '/seen/:chatId',
//   auth(USER_ROLE.user, USER_Role.ADMIN),
//   messagesController.seenMessage,
// );

// router.patch(
//   '/update/:id',
//   auth(USER_ROLE.user, USER_Role.ADMIN),
//   upload.single('image'),
//   parseData(),
//   validateRequest(messagesValidation.updateMessageValidation),
//   messagesController.updateMessages,
// );

// router.get('/my-messages/:chatId', messagesController.getMessagesByChatId);

// router.delete(
//   '/:id',
//   auth(USER_ROLE.user, USER_Role.ADMIN),
//   messagesController.deleteMessages,
// );

// router.get(
//   '/unread-count',
//   auth(USER_ROLE.company, USER_ROLE.patient, USER_ROLE.staf, USER_Role.ADMIN),
//   messagesController.unreadMessageCount,
// );

// router.get(
//   '/:id',
//   auth(USER_ROLE.user, USER_Role.ADMIN),
//   messagesController.getMessagesById,
// );

router.get(
  '/pre-messages/:id',
   auth(Role.ADMIN, Role.INDIVIDUAL_USER, Role.AMBASSADOR, Role.ASSISTED_SELLER, Role.CELEBRITY, Role.CHARITABLE_ORGANIZATION, Role.CHARITY_SHOP, Role.ECO_FRIENDLY_STORE, Role.PROFESSIONAL_SELLER),
  messagesController.getAllPreMessages,
);

export const messagesRoutes = router;
