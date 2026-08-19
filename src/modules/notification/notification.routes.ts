import { Router } from "express";
import { notificationController } from "./notification.controller";
import auth from "../../middleware/auth";
import { allRoles } from "../user/user.rout";

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
   auth(...allRoles),
  notificationController.makeRead
);

router.put(
  "/make-read-all",
   auth(...allRoles),
  notificationController.makeReadAll
);

export const notificationRoutes = router;
