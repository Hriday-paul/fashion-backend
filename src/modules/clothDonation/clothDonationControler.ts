import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import pick from "../../shared/pick";
import { PaginateOptions } from "../../helper/pagination.helper";
import { uploadManyToS3 } from "../../utils/s3";
import { clothDonationService } from "./clothDonation.service";
import AppError from "../../error/AppError";

const normalizeArray = (val: unknown): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val.map(String);
    if (typeof val === "string") {
        try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) return parsed.map(String);
        } catch {
            return val.split(",").map(s => s.trim()).filter(Boolean);
        }
    }
    return [String(val)];
};

const createClothDonation = catchAsync(async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[];

    if (files && files.length > 0) {
        const FileAry = files.map(image => ({
            file: image,
            path: `images/clothDonation`,
        }));
        const urls = await uploadManyToS3(FileAry);
        req.body.photos = urls.map(url => ({
            key: url.key,
            url: url.url,
        }));
    } else {
        throw new AppError(httpStatus.BAD_REQUEST, "At least one photo is required for cloth donation");
    }

    if (req.body.itemTypes) {
        req.body.itemTypes = normalizeArray(req.body.itemTypes);
    }
    if (req.body.personTypes) {
        req.body.personTypes = normalizeArray(req.body.personTypes);
    }
    if (req.body.brands) {
        req.body.brands = normalizeArray(req.body.brands);
    }

    const result = await clothDonationService.createClothDonation(req.body, req.user?.id);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Cloth donation submitted successfully",
        data: result,
    });
});

const getDonationsAsDonor = catchAsync(async (req: Request, res: Response) => {
    const query = pick(req.query, ["donationType", "type", "status", "searchTerm"]);
    const options = pick(req.query, PaginateOptions);

    const result = await clothDonationService.getDonationsAsDonor(req.user?.id, query, options);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Donor cloth donations fetched successfully",
        data: result,
    });
});

const getDonationsAsCharity = catchAsync(async (req: Request, res: Response) => {
    const query = pick(req.query, ["donationType", "type", "status", "searchTerm"]);
    const options = pick(req.query, PaginateOptions);

    const result = await clothDonationService.getDonationsAsCharity(req.user?.id, query, options);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Charity cloth donations fetched successfully",
        data: result,
    });
});

const updateStatusAsCharity = catchAsync(async (req: Request, res: Response) => {
    const donationId = req.params.id;
    const status = req.body.status;

    const result = await clothDonationService.updateStatusAsCharity(
        donationId,
        req.user?.id,
        req.user?.role,
        status
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Cloth donation status updated successfully",
        data: result,
    });
});

export const clothDonationControler = {
    createClothDonation,
    getDonationsAsDonor,
    getDonationsAsCharity,
    updateStatusAsCharity,
};

