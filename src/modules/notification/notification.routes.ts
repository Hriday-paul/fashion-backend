import { Router } from "express";
import { notificationController } from "./notification.controller";
import auth from "../../middleware/auth";
import { allRoles } from "../user/user.rout";
import { rateLimiter } from "../../middleware/RateLimiter";

const router = Router();

router.get(
  "/",
   auth(...allRoles),
  notificationController.getAllNotification
);
router.get(
  "/unread-count",
  auth(...allRoles),
  notificationController.NotificationUnreadCount
);

router.put(
  "/make-read/:id",
   rateLimiter(),
   auth(...allRoles),
  notificationController.makeRead
);

router.put(
  "/make-read-all",
   rateLimiter(),
   auth(...allRoles),
  notificationController.makeReadAll
);

export const notificationRoutes = router;
