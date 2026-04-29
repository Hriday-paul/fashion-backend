import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { questionService } from "./question.service";

const addQuestionToProd = catchAsync(async (req: Request, res: Response) => {
    const result = await questionService.addQuestionToProd(req.body, req.user?.id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Question added successfully to Product',
        data: result,
    });
});


const answerToQues = catchAsync(async (req: Request, res: Response) => {
    const result = await questionService.answerToQues(req.body, req.user?.id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Answer added successfully to question',
        data: result,
    });
});

const questionsByProd = catchAsync(async (req: Request, res: Response) => {
    const result = await questionService.questionsByProd(req.params.id, req?.user?.id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Questions retrived successfully',
        data: result,
    });
});

export const questionControler = {
    addQuestionToProd,
    questionsByProd,
    answerToQues
}
