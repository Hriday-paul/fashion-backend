import httpStatus from 'http-status';
import jwt from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';
import catchAsync from '../utils/catchAsync';
import AppError from '../error/AppError';
import config from '../config/index';
import prisma from '../shared/prisma';
import { Role } from '../../generated/prisma/enums';

const auth = (...userRoles: Role[]) => {
    return catchAsync(async (req, res, next) => {
        const token = req?.headers?.authorization?.split(' ')[1];

        if (!token) {
            throw new AppError(httpStatus.UNAUTHORIZED, 'you are not authorized!');
        }
        let decode;
        try {
            decode = jwt.verify(
                token,
                config.jwt_access_secret as string,
            ) as JwtPayload;
        } catch (err) {
            throw new AppError(httpStatus.UNAUTHORIZED, 'unauthorized');
        }
        const { userId } = decode;

        const isUserExist = await prisma.user.findFirst({ where: { id: userId }, include: { auth: true } });

        if (!isUserExist) {
            throw new AppError(httpStatus.NOT_FOUND, 'User does not exist');
        }

        if (!isUserExist?.auth?.isverified) {
            throw new AppError(httpStatus.UNAUTHORIZED, 'You are not verifiend');
        }

        if (isUserExist?.auth?.isDeleted) {
            throw new AppError(httpStatus.FORBIDDEN, 'Your account is deleted');
        }

        if (!isUserExist?.auth?.status) {
            throw new AppError(httpStatus.FORBIDDEN, 'Your account is blocked');
        }

        if (userRoles && !userRoles.includes(isUserExist?.auth?.role)) {
            throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized');
        }

        const role = isUserExist?.auth?.role;

        req.user = { id: userId, role, userName: isUserExist?.userName };

        next();
    });
};
export default auth;

export const PublicAuth = () => {
    return catchAsync(async (req, res, next) => {
        const token = req?.headers?.authorization?.split(' ')[1];

        if (!token) return next();

        let decode: JwtPayload;

        try {
            decode = jwt.verify(
                token,
                config.jwt_access_secret as string,
            ) as JwtPayload;
        } catch (err) {
            return next();
        }

        const { role, userId } = decode;

        const isUserExist = await prisma.user.findFirst({
            where: { id: userId },
            include: { auth: true },
        });

        const auth = isUserExist?.auth;

        if (
            !isUserExist ||
            !auth?.isverified ||
            auth?.isDeleted ||
            !auth?.status
        ) {
            return next(); // invalid user, but still public — just skip setting req.user
        }

        req.user = { id: userId, role, userName: isUserExist?.userName };

        return next();
    });
};
