import AppError from "../../error/AppError"
import httpStatus from 'http-status'
import bcrypt from 'bcrypt'
import { createToken, verifyToken } from "./auth.utils"
import config from "../../config"
import jwt, { JwtPayload, Secret } from 'jsonwebtoken';
import { generateOtp } from "../../utils/otpGenerator"
import moment from "moment"
import prisma from "../../shared/prisma"
import { AccountDocument, Role, User } from "../../../generated/prisma/client"
import fs from 'fs';
import path from "path"
import { sendEmail } from "../../utils/mailSender"
import { firebaseAdmin } from "../notification/notification.utils"
import generateRandomString from "../../utils/generateRandomString"

type TUserMore = {
    password: string
    account_documents: AccountDocument[],
    role: Role
}

const createUser = async (payload: User & TUserMore) => {
    const { phone, password, fname, lname, email, userName, role } = payload

    let isExist = await prisma.user.findFirst({ where: { email }, include: { auth: true } });

    //check user is exist or not
    if (isExist && isExist?.auth?.isverified) {
        throw new AppError(
            httpStatus.CONFLICT,
            'Account already exists with this email address',
        );
    }

    // creat encrypted password
    // const hashedPassword = await bcrypt.hash(password, 15);
    const PEPPER = config.password_pepper;
    const hashedPassword = await bcrypt.hash(password + PEPPER, 15);

    const body = {
        phone, fname, lname, email, userName
    }

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            ...body,
            auth: {
                upsert: {
                    update: { password: hashedPassword, role, approval_status: role === Role.INDIVIDUAL_USER ? "Approved" : "Pending" },
                    create: { password: hashedPassword, email, role, approval_status: role === Role.INDIVIDUAL_USER ? "Approved" : "Pending" }
                }
            }
        },
        create: {
            ...body,
            auth: {
                create: {
                    email,
                    password: hashedPassword,
                    role,
                    approval_status: role === Role.INDIVIDUAL_USER ? "Approved" : "Pending"
                }
            }
        },
        include: { auth: true }
    });

    if (!user) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Account creation failed');
    }

    return user;
};

// Login
const loginUser = async (payload: { email: string, password: string, fcmToken?: string }) => {

    const user = await prisma.user.findFirst({
        where: {
            email: payload?.email,
            isDeleted: false,
            auth: { role: { not: Role.ADMIN } }
        },
        include: { auth: true }
    });

    if (!user) {
        // If user not found, throw error
        throw new AppError(httpStatus.NOT_FOUND, 'Account does not exist');
    }

    else {
        if (!user?.auth?.status) {
            throw new AppError(httpStatus.FORBIDDEN, 'Your account is blocked', 603);
        }

        if (user?.auth?.isDeleted) {
            throw new AppError(httpStatus.FORBIDDEN, 'Your account is deleted', 606);
        }

        if (!user?.auth?.isverified) {
            throw new AppError(httpStatus.BAD_REQUEST, 'Account verification is not completed. Please sign up again to complete the verification process');
        }

        //check account is account is connected by social login or not
        if (user && user?.auth?.isSocialLogin) {
            throw new AppError(
                httpStatus.METHOD_NOT_ALLOWED,
                'This account is connected by social login. Please use social login to access your account.',
            );
        }

        if (user?.auth?.approval_status === "Pending") {
            throw new AppError(httpStatus.FORBIDDEN, 'Your account is under review. We will notify you once it is approved', 604);
        }
        if (user?.auth?.approval_status === "Rejected") {
            throw new AppError(httpStatus.FORBIDDEN, 'Your account is rejected. Please contact support for further assistance', 605);
        }


        // Handle verify password
        // const passwordMatched = await bcrypt.compare(payload?.password, user?.auth?.password);
        const passwordMatched = await bcrypt.compare(payload?.password + config.password_pepper, user?.auth?.password);

        if (!passwordMatched) {
            throw new AppError(httpStatus.BAD_REQUEST, 'Please check your credentials and try again');
        }


        // Update FCM token if provided
        let updatedUser = user as User;
        if (payload?.fcmToken) {
            updatedUser = await prisma.user.update({
                where: { email: payload?.email },
                data: { fcmToken: payload.fcmToken },
            })
        }

        // Send notification if FCM token exists and user notification is unabled

        // Choose the most up-to-date FCM token to use
        // const tokenToUse = updatedUser?.fcmToken;

        // sendNotification(tokenToUse ? [tokenToUse] : [], {
        //     title: `Login successfully`,
        //     message: `New user login to your account`,
        //     receiverId: updatedUser.id,
        //     senderId: updatedUser.id,
        // }, updatedUser?.notification);


    }

    //update last login time
    await prisma.auth.update({
        where: { userId: user?.id },
        data: { last_loginAt: new Date() },
    })

    const jwtPayload: { userId: string; role: Role } = {
        userId: user?.id,
        role: user?.auth?.role
    };

    const role = user?.auth?.role

    const userDoc = (user as any);
    delete userDoc.auth;

    const accessToken = createToken(
        jwtPayload,
        config.jwt_access_secret as string,
        60 * 60 * 24 * 7, //7 days
    );

    const refreshToken = createToken(
        jwtPayload,
        config.jwt_refresh_secret as string,
        60 * 60 * 24 * 30, // 30 days
    );

    return {
        user: { ...userDoc, auth: { role } },
        accessToken,
        refreshToken,
    };
};

//admin login
const adminLogin = async (payload: { phone: string, password: string }) => {

    const user = await prisma.user.findFirst({ where: { phone: payload?.phone, isDeleted: false, auth: { role: Role.ADMIN } }, include: { auth: true } });

    if (!user) {
        // If user not found, throw error
        throw new AppError(httpStatus.NOT_FOUND, 'admin not found');
    } else {

        if (!user?.auth?.isverified) {
            throw new AppError(httpStatus.FORBIDDEN, 'Your account is not verified');
        }

        // Handle verify password
        const passwordMatched = await bcrypt.compare(payload?.password + config.password_pepper, user?.auth?.password);

        if (!passwordMatched) {
            throw new AppError(httpStatus.BAD_REQUEST, 'Please check your credentials and try again');
        }
    }

    await prisma.auth.update({
        where: { userId: user?.id },
        data: { last_loginAt: new Date() },
    })

    const userDoc = (user as any);
    delete userDoc.auth;


    const jwtPayload: { userId: string; role: Role } = {
        userId: user?.id,
        role: user?.auth?.role,
    };

    const accessToken = createToken(
        jwtPayload,
        config.jwt_access_secret as string,
        60 * 60 * 24 * 7, //7 days
    );

    const refreshToken = createToken(
        jwtPayload,
        config.jwt_refresh_secret as string,
        60 * 60 * 24 * 30, //  30 days
    );

    return {
        user: userDoc,
        accessToken,
        refreshToken,
    };
};

const socialSignUp = async (payload: {
    idToken: string;
    fname: string;
    userName: string;
    role: Role;
}) => {
    const { fname, userName, role, idToken } = payload;

    const {
        email,
        picture,
        phone_number,
    } = await firebaseAdmin.auth().verifyIdToken(idToken);

    if (!email) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Authentication failed"
        );
    }

    const isExist = await prisma.user.findFirst({
        where: { email },
        include: { auth: true },
    });

    if (isExist?.auth?.isverified) {
        throw new AppError(
            httpStatus.CONFLICT,
            "Account already exists with this email address"
        );
    }

    const body = {
        fname,
        email,
        userName,
        phone: phone_number || null,
    };

    const PEPPER = config.password_pepper;

    const hashedPassword = await bcrypt.hash(
        generateRandomString(10) + PEPPER,
        15
    );

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            ...body,

            ...(picture
                ? {
                    picture: {
                        upsert: {
                            update: {
                                url: picture,
                                key: generateRandomString(8),
                            },
                            create: {
                                url: picture,
                                key: generateRandomString(8),
                            },
                        },
                    },
                }
                : {}),

            auth: {
                upsert: {
                    update: {
                        password: hashedPassword,
                        role,
                        isSocialLogin: true,
                        isverified: true,
                        approval_status: role === Role.INDIVIDUAL_USER ? "Approved" : "Pending"
                    },
                    create: {
                        password: hashedPassword,
                        email,
                        role,
                        isSocialLogin: true,
                        isverified: true,
                        approval_status: role === Role.INDIVIDUAL_USER ? "Approved" : "Pending"
                    },
                },
            },
        },

        create: {
            ...body,

            ...(picture
                ? {
                    picture: {
                        create: {
                            url: picture,
                            key: generateRandomString(8),
                        },
                    },
                }
                : {}),

            auth: {
                create: {
                    email,
                    password: hashedPassword,
                    role,
                    isSocialLogin: true,
                    isverified: true,
                    approval_status: role === Role.INDIVIDUAL_USER ? "Approved" : "Pending"
                },
            },
        },

        include: {
            auth: true,
        },
    });

    const { auth, ...userDoc } = user;

    const userRole = user.auth?.role;

    const jwtPayload: { userId: string; role: Role } = {
        userId: user.id,
        role: userRole!,
    };

    const accessToken = createToken(
        jwtPayload,
        config.jwt_access_secret as string,
        60 * 30
    );

    const refreshToken = createToken(
        jwtPayload,
        config.jwt_refresh_secret as string,
        60 * 60 * 24 * 7
    );

    return {
        user: { ...userDoc, auth: { role } },
        accessToken,
        refreshToken,
    };
};

const socialLogin = async (payload: { idToken: string, fcmToken?: string }) => {

    const { idToken } = payload;

    const {
        email,
    } = await firebaseAdmin.auth().verifyIdToken(idToken);

    if (!email) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Login failed"
        );
    }

    const user = await prisma.user.findFirst({
        where: {
            email: email,
            isDeleted: false,
            auth: { role: { not: Role.ADMIN } }
        },
        include: { auth: true }
    });

    if (!user) {
        // If user not found, throw error
        throw new AppError(httpStatus.NOT_FOUND, 'Account does not exist. Please sign up first');
    }

    else {
        if (!user?.auth?.status) {
            throw new AppError(httpStatus.FORBIDDEN, 'Your account is blocked', 603);
        }

        if (user?.auth?.isDeleted) {
            throw new AppError(httpStatus.FORBIDDEN, 'Your account is deleted', 606);
        }

        if (!user?.auth?.isverified) {
            throw new AppError(httpStatus.BAD_REQUEST, 'Account verification is not completed. Please sign up again to complete the verification process');
        }

        if (user?.auth?.approval_status === "Pending") {
            throw new AppError(httpStatus.FORBIDDEN, 'Your account is under review. We will notify you once it is approved', 604);
        }
        if (user?.auth?.approval_status === "Rejected") {
            throw new AppError(httpStatus.FORBIDDEN, 'Your account is rejected. Please contact support for further assistance', 605);
        }

        // Update FCM token if provided
        let updatedUser = user as User;
        if (payload?.fcmToken) {
            updatedUser = await prisma.user.update({
                where: { email: email },
                data: { fcmToken: payload.fcmToken },
            })
        }

        // Send notification if FCM token exists and user notification is unabled

        // Choose the most up-to-date FCM token to use
        // const tokenToUse = updatedUser?.fcmToken;

        // sendNotification(tokenToUse ? [tokenToUse] : [], {
        //     title: `Login successfully`,
        //     message: `New user login to your account`,
        //     receiverId: updatedUser.id,
        //     senderId: updatedUser.id,
        // }, updatedUser?.notification);


    }

    //update last login time
    await prisma.auth.update({
        where: { userId: user?.id },
        data: { last_loginAt: new Date() },
    })

    const jwtPayload: { userId: string; role: Role } = {
        userId: user?.id,
        role: user?.auth?.role
    };

    const role = user?.auth?.role

    const userDoc = (user as any);
    delete userDoc.auth;

    const accessToken = createToken(
        jwtPayload,
        config.jwt_access_secret as string,
        60 * 60 * 24 * 7, //7 days
    );

    const refreshToken = createToken(
        jwtPayload,
        config.jwt_refresh_secret as string,
        60 * 60 * 24 * 30, // 30 days
    );

    return {
        user: { ...userDoc, auth: { role } },
        accessToken,
        refreshToken,
    };
};

// Change password
const changePassword = async (id: string, payload: { oldPassword: string, newPassword: string, confirmPassword: string }) => {

    const user = await prisma.user.findFirst({ where: { id }, include: { auth: true } });

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'User not found');
    }

    const passwordMatched = await bcrypt.compare(payload?.oldPassword + config.password_pepper, user?.auth?.password!);

    if (!passwordMatched) {
        throw new AppError(httpStatus.FORBIDDEN, 'Old password does not match');
    }
    if (payload?.newPassword !== payload?.confirmPassword) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            'New password and confirm password do not match',
        );
    }

    const PEPPER = config.password_pepper;
    const hashedPassword = await bcrypt.hash(payload?.newPassword + PEPPER, Number(config.bcrypt_salt_rounds));

    const result = await prisma.user.update({
        where: { id },
        data: {
            auth: {
                update: {
                    data: {
                        password: hashedPassword,
                        passwordChangedAt: new Date(),
                    }
                }
            }
        }
    }
    );

    return result;
};


// Forgot password
const forgotPassword = async (email: string) => {
    const user = await prisma.user.findFirst({ where: { email }, include: { auth: true } });

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'User not found');
    }

    const jwtPayload = {
        userId: user?.id,
        role: user?.auth?.role
    };

    const token = jwt.sign(jwtPayload, config.jwt_access_secret as Secret, {
        expiresIn: '3m',
    });

    const currentTime = new Date();
    const otp = generateOtp();
    const expiresAt = moment(currentTime).add(3, 'minute').toDate();

    await prisma.user.update({
        where: { id: user?.id },
        data: {
            auth: {
                update: {
                    otp,
                    expiredAt: expiresAt,
                    otp_status: false
                }
            }
        }
    });


    // ----------send sms code---------

    const otpEmailPath = path.join(
        process.cwd(),
        'public',
        'view',
        'forgot_pass_mail.html'
    );

    await sendEmail(
        user?.email,
        'Your reset password OTP is',
        fs
            .readFileSync(otpEmailPath, 'utf8')
            .replace('{{otp}}', otp)
            .replace('{{email}}', user?.email),
    );

    return { email, token };
};


// Reset password
const resetPassword = async (token: string, payload: { newPassword: string, confirmPassword: string }) => {
    let decode;
    try {
        decode = jwt.verify(
            token,
            config.jwt_access_secret as string,
        ) as JwtPayload;
    } catch (err) {
        throw new AppError(
            httpStatus.UNAUTHORIZED,
            'Session has expired. Please try again',
        );
    }

    const user = await prisma.user.findUnique({
        where: { id: decode?.userId }, select: {
            auth: true
        }
    })

    if (!user || !user?.auth) {
        throw new AppError(httpStatus.NOT_FOUND, 'User not found');
    }
    if (new Date() > user?.auth?.expiredAt) {
        throw new AppError(httpStatus.FORBIDDEN, 'Session has expired');
    }
    if (!user?.auth?.status) {
        throw new AppError(httpStatus.FORBIDDEN, 'OTP is not verified yet');
    }
    if (payload?.newPassword !== payload?.confirmPassword) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            'New password and confirm password do not match',
        );
    }

    const PEPPER = config.password_pepper;
    const hashedPassword = await bcrypt.hash(payload?.newPassword + PEPPER, Number(config.bcrypt_salt_rounds));

    const result = await prisma.user.update({
        where: { id: decode?.userId },
        data: {
            auth: {
                update: {
                    password: hashedPassword,
                    otp: "0",
                    otp_status: true,
                }
            }
        }
    });

    return result;
};


// Refresh token
const refreshToken = async (token: string) => {
    // Checking if the given token is valid
    const decoded = verifyToken(token, config.jwt_refresh_secret as string);
    const { userId } = decoded;

    const user = await prisma.user.findFirst({ where: { id: userId }, include: { auth: true } });

    if (!user || !user?.auth) {
        throw new AppError(httpStatus.NOT_FOUND, 'User not found');
    }
    const isDeleted = user?.auth?.isDeleted;

    if (isDeleted) {
        throw new AppError(httpStatus.FORBIDDEN, 'This user is deleted');
    }

    const jwtPayload = {
        userId: user?.id,
        role: user.auth?.role,
    };

    const accessToken = createToken(
        jwtPayload,
        config.jwt_access_secret as string,
        60 * 60 * 24 * 7, //7 days
    );

    const refreshToken = createToken(
        jwtPayload,
        config.jwt_refresh_secret as string,
        60 * 60 * 24 * 30, //30 days
    );

    const role = user?.auth?.role

    const userDoc = (user as any);
    delete userDoc.auth;

    return {
        user: { ...userDoc, auth: { role } },
        accessToken,
        refreshToken
    };
};

const usernameChacker = async (username: string) => {
    const user = await prisma.user.findFirst({ where: { userName: username } });
    if (user) {
        throw new AppError(httpStatus.CONFLICT, 'Username already exists');
    }

    return { message: 'Username is available' };
}


export const authService = {
    createUser,
    loginUser,
    socialSignUp,
    forgotPassword,
    changePassword,
    resetPassword,
    refreshToken,
    adminLogin,
    socialLogin,
    usernameChacker
}