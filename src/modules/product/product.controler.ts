import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import { productService } from "./product.service";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status"
import { uploadManyToS3 } from "../../utils/s3";
import AppError from "../../error/AppError";
import pick from "../../shared/pick";
import { PaginateOptions } from "../../helper/pagination.helper";

const addNewProduct = catchAsync(async (req: Request, res: Response) => {

    const files = req.files as Express.Multer.File[];

    if (files) {

        if (files.length <= 0) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                'Minimum 1 image is required',
            );
        }

        const FileAry = files?.map(image => {
            return {
                file: image,
                path: `images/products/images`,
            };
        });

        const urls = await uploadManyToS3(FileAry);
        req.body.images = urls
    }

    const result = await productService.addNewProduct(req.body, req.user.role);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'New Product added successfully',
        data: result,
    });
});


const allProducts = catchAsync(async (req: Request, res: Response) => {

    const query = pick(req.query, ["searchTerm", "category", "minPrice", "maxPrice", "conditions", "brands", "sizes", "colors", "meterials"])
    const options = pick(req.query, PaginateOptions);

    const result = await productService.allProducts(query, options);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Products retrived successfully',
        data: result,
    });
});

export const productControler = {
    addNewProduct,
    allProducts
}