import httpStatus from 'http-status';
import AppError from '../../error/AppError';
import jwt, { JwtPayload, Secret } from 'jsonwebtoken';
import moment from 'moment';
import config from '../../config';
import { generateOtp } from '../../utils/otpGenerator';
import prisma from '../../shared/prisma';
import fs from 'fs';
import path from 'path';
import { sendEmail } from '../../utils/mailSender';
import { notificationQueue } from '../../queues/notificaion.queue';
import { jobs } from '../../queues/jobs.name';
import { redisKeys } from '../../redis/keys';
import { redisPub } from '../../redis';
import { sendSMS } from '../../utils/smsSender';
import bcrypt from 'bcrypt'
import { emailQueue } from '../../queues/email.queue';

const verifyOtp = async (token: string, otp: string) => {

  if (!token) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized');
  }
  let decode;

  try {
    decode = jwt.verify(
      token,
      config.jwt_access_secret as Secret,
    ) as JwtPayload;
  } catch (err) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'Session has expired. Please try to submit OTP within 3 minute',
    );
  }

  const user = await prisma.user.findFirst({ where: { id: decode?.userId }, include: { auth: true } })

  if (!user || !user?.auth) {
    throw new AppError(httpStatus.BAD_REQUEST, 'User does not exist');
  }
  if (new Date() > user?.auth?.expiredAt) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'OTP has expired. Please resend it',
    );
  }

  if (user?.auth?.otp_status) {
    throw new AppError(httpStatus.BAD_REQUEST, 'You already verified, need to login');
  }

  if (!user?.auth?.otp) {
    throw new AppError(httpStatus.BAD_REQUEST, 'OTP has expired. Please resend it');
  }

  const otpMatched = await bcrypt.compare(otp, user?.auth?.otp);

  if (!otpMatched) {
    throw new AppError(httpStatus.BAD_REQUEST, 'OTP did not match');
  }


  const updateUser = await prisma.user.update(
    {
      where: { id: user?.id },
      data: {
        auth: {
          update: {
            data: {
              otp: "0",
              expiredAt: moment().add(3, 'minute').toDate(),
              otp_status: true,
              isverified: true
            }
          }
        }

      }
    },
  )

  //if previous user is not verified then guess the new user, send the notification to the user that he is verified and can now use the app
  // Send welcome notification to the user
  await notificationQueue.add(jobs.notification, {
    allowPushNotification: true,
    payload: {
      title: `Welcome to the Fashi-on`,
      message: user?.auth?.approval_status == "Approved" ? `Welcome ${user?.fname} to the **Fashi-on**. We are glad to have you on board!` : `Welcome ${user?.fname} to the **Fashi-on**. Your account is under review. We will notify you once it is approved.`,
      actorId: user?.id,
      receiverId: user?.id,
      entityId: user?.userName,
      entityType: "OTHER",
      entityImgs: [],
      type: "OTHER",
      fcmToken: user?.fcmToken,
      groupKeyId: null,
    }
  })

  const jwtPayload = {
    role: user?.auth?.role,
    userId: updateUser?.id,
  };

  const accessToken = jwt.sign(jwtPayload, config.jwt_access_secret as Secret, {
    expiresIn: '7d', //7 days
  });

  return { user: updateUser, accessToken: accessToken };
};

const resendOtp = async (email: string) => {
  const user = await prisma.user.findFirst({ where: { email }, include: { auth: true } })

  if (!user) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Account does not exist');
  }

  const otp = generateOtp();
  const expiresAt = moment().add(10, 'minute').toDate();

  const hashedOtp = await bcrypt.hash(otp, 10);

  const updateOtp = await prisma.user.update(
    {
      where: { id: user?.id },
      data: {
        auth: {
          update: {
            data: {
              otp: hashedOtp,
              expiredAt: expiresAt,
              otp_status: false,
            }
          }
        }
      }
    }
  );

  if (!updateOtp) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Failed to resend OTP. Please try again later',
    );
  }

  const jwtPayload = {
    userId: user?.id,
    role: user?.auth?.role
  };
  const token = jwt.sign(jwtPayload, config.jwt_access_secret as Secret, {
    expiresIn: '10m',
  });

  const otpEmailPath = path.join(
    process.cwd(),
    'public',
    'view',
    'otp_mail.html'
  );

  if (user) {
    await emailQueue.add(jobs.email, {
      to: user?.email,
      subject: 'FASH-ON - One Time OTP',
      html: fs
        .readFileSync(otpEmailPath, 'utf8')
        .replace('{{otp}}', otp)
        .replace('{{email}}', user?.email),
    });
  }

  return token;
};

const resendOtpIntoPhone = async (phone: string, userId: string) => {

  const otp = generateOtp();

  const redisKey = redisKeys.phoneOtpKey({ phone, userId });

  //dlete the previous otp if exists
  await redisPub.del(redisKey);

  const hashedOtp = await bcrypt.hash(otp, 10);

  await redisPub.setEx(redisKey, 600, hashedOtp); // Set OTP in Redis with a 10-minute expiration

  const jwtPayload = {
    userId: userId,
    phone: phone,
  };

  const token = jwt.sign(jwtPayload, config.jwt_access_secret as Secret, {
    expiresIn: '10m', // 10 minutes
  });

  await sendSMS(
    phone,
    `<#> ${otp} is your FASHI-ON verification code. This code will expire in 10 minutes. Reply STOP to opt-out.`,
  );

  return token;
};

const verifyPhoneOtp = async (token: string, otp: string) => {

  if (!token) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized');
  }
  let decode;

  try {
    decode = jwt.verify(
      token,
      config.jwt_access_secret as Secret,
    ) as JwtPayload;
  } catch (err) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'Session has expired. Please try to submit OTP within 10 minutes',
    );
  }

  if (!decode?.userId || !decode?.phone) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid Request, try again');
  }

  const user = await prisma.user.findFirst({ where: { id: decode?.userId }, include: { auth: true } })

  if (!user) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Account does not exist');
  }

  //check otp in redis
  const redisKey = redisKeys.phoneOtpKey({ phone: decode?.phone, userId: decode?.userId });
  const cachedOtp = await redisPub.get(redisKey);

  if (!cachedOtp) {
    throw new AppError(httpStatus.BAD_REQUEST, 'OTP has expired. Please resend it');
  }

  const otpMatched = await bcrypt.compare(otp.toString(), cachedOtp);

  if (!otpMatched) {
    throw new AppError(httpStatus.BAD_REQUEST, 'OTP did not match');
  }

  const updateUser = await prisma.user.update(
    {
      where: { id: user?.id },
      data: {
        auth: {
          update: {
            data: {
              isPhoneVerified: true
            }
          }
        },
        phone: decode?.phone
      }
    },
  )

  //if previous user is not verified then guess the new user, send the notification to the user that he is verified and can now use the app
  // Send welcome notification to the user
  await notificationQueue.add(jobs.notification, {
    allowPushNotification: true,
    payload: {
      title: `Welcome to the Fashi-on`,
      message: user?.auth?.approval_status == "Approved" ? `Welcome ${user?.fname} to the **Fashi-on**. We are glad to have you on board!` : `Welcome ${user?.fname} to the **Fashi-on**. Your account is under review. We will notify you once it is approved.`,
      actorId: user?.id,
      receiverId: user?.id,
      entityId: user?.userName,
      entityType: "OTHER",
      entityImgs: [],
      type: "OTHER",
      fcmToken: user?.fcmToken,
      groupKeyId: null,
    }
  })

  const jwtPayload = {
    role: user?.auth?.role,
    userId: updateUser?.id,
  };

  const accessToken = jwt.sign(jwtPayload, config.jwt_access_secret as Secret, {
    expiresIn: '7d', //7 days
  });

  return { user: updateUser, accessToken: accessToken };
};

export const otpServices = {
  verifyOtp,
  resendOtp,
  verifyPhoneOtp,
  resendOtpIntoPhone
};
