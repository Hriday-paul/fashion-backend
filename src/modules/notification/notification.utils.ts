import httpStatus from "http-status";
import AppError from "../../error/AppError";
import admin from "firebase-admin";
import config from "../../config";

export interface CreateNotificationPayload {
  title: string;
  message: string;
}

// Initialize Firebase Admin SDK only if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert("./firebase.json"),
  });
}

export const firebaseAdmin = admin;

export const sendPushNotification = async (
  fcmToken: string[],
  payload: CreateNotificationPayload
): Promise<unknown> => {

  const title_without_stars = payload.title.replace(/\*\*/g, "");
  const msg_without_stars = payload.message.replace(/\*\*/g, "");

  const response = await admin.messaging().sendEachForMulticast({
    tokens: fcmToken,
    notification: {
      title: title_without_stars,
      body: msg_without_stars,
    },
    android: {
      notification: {
        icon: `${config?.BASE_URL}/logo.png`,
        imageUrl: `${config?.BASE_URL}/logo.png`,
        clickAction: 'notification'
      }
    },
    apns: {
      headers: {
        "apns-push-type": "alert",
      },
      fcmOptions: {
        imageUrl: `${config?.BASE_URL}/logo.png`
      },
      payload: {
        aps: {
          badge: 1,
          sound: "default",
        },
      },
    },
    webpush: {
      headers: {
        image: `${config?.BASE_URL}/logo.png`
      }
    },
  });

  if (response?.failureCount > 0) {
    response.responses.forEach((res, index) => {
      if (!res.success) {
        console.error(
          `FCM error for token at index ${index}: ${JSON.stringify(
            res.error
          )}`
        );
      }
    });
  }

  if (response?.successCount < 1) {
    throw new AppError(
      httpStatus.NOT_IMPLEMENTED,
      "Failed to send push notification"
    );
  }

  return;

};