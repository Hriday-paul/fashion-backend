
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from 'http-status'
import { folowService } from "./folow.service";

const folowToNewMemeber = catchAsync(async (req, res) => {

    const result = await folowService.folowToNewMemeber(req.body.memberId, req.user?.id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Member folowed successfully',
        data: result,
    });
})

const unfolowMemeber = catchAsync(async (req, res) => {

    const result = await folowService.unfolowMemeber(req.body.memberId, req.user?.id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Member unfolowed successfully',
        data: result,
    });
})

export const folowControler = {
    folowToNewMemeber,
    unfolowMemeber
}