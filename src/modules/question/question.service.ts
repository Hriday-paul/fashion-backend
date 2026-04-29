import { Question } from "../../../generated/prisma/client";
import AppError from "../../error/AppError";
import prisma from "../../shared/prisma";
import httpStatus from "http-status"

const addQuestionToProd = async (payload: Question, userId: string) => {

    //check prod exist
    const exist = await prisma.product.findFirst({ where: { id: payload?.productId, isDeleted: false } });
    if (!exist) {
        throw new AppError(httpStatus.NOT_FOUND, "Product does not exist");
    }

    //check prod owner & ques owner is same
    if (exist?.userId == userId) {
        throw new AppError(httpStatus.BAD_REQUEST, "Acces denied for add question");
    }

    const question = await prisma.question.create({
        data: {
            productId: payload?.productId,
            question: payload?.question,
            questionerId: userId
        }
    });

    return question;
}

const questionsByProd = async (prodId: string, userId?: string) => {

    //check prod exist
    const exist = await prisma.product.findFirst({ where: { id: prodId, isDeleted: false } });
    if (!exist) {
        throw new AppError(httpStatus.NOT_FOUND, "Product does not exist");
    }

    const questions = await prisma.question.findMany({
        where: { productId: prodId },
        include: {
            questioner: {
                include: {
                    picture: true
                }
            }
        },
        orderBy: {
            createdAt: "desc"
        }
    });

    return { data: questions, isOwner: userId ? (exist?.userId == userId) : false };
}

const answerToQues = async (payload: { questionId: string, answer: string }, userId: string) => {

    //check question exist
    const exist = await prisma.question.findFirst({
        where: { id: payload?.questionId }, include: {
            product: true
        }
    });
    if (!exist) {
        throw new AppError(httpStatus.NOT_FOUND, "Question does not exist");
    }

    if (exist?.answer) {
        throw new AppError(httpStatus.CONFLICT, "Dublicate answer does not allow");
    }

    //check is owner for the question
    if (exist?.product?.userId != userId) {
        throw new AppError(httpStatus.BAD_REQUEST, "Access denied");
    }

    const question = await prisma.question.update({
        where: { id: payload?.questionId },
        data: {
            answer: payload?.answer,
            answeredAt: new Date()
        }
    });

    return question;
}

export const questionService = {
    addQuestionToProd,
    questionsByProd,
    answerToQues
}