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

    const result = await productService.addNewProduct(req.body, req.user.role, req.user
        ?.id);
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

    const result = await productService.allProducts(query, options, req.user?.id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Products retrived successfully',
        data: result,
    });
});


const productsByUserName = catchAsync(async (req: Request, res: Response) => {

    const query = pick(req.query, ["searchTerm", "category", "minPrice", "maxPrice", "conditions", "brands", "sizes", "colors", "meterials"])
    const options = pick(req.query, PaginateOptions);

    const result = await productService.productsByUserName(query, options, req.params.username, req.user?.id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Products retrived successfully',
        data: result,
    });
});

const productsByType = catchAsync(async (req: Request, res: Response) => {

    const type = req.query.type;
    req.query.limit = "8";
    const options = pick(req.query, PaginateOptions);

    let result: any[] = []

    if (type == "trending") {
        result = await productService.trendingProducts(req.user?.id);
    }
    else if (type == "topSelling") {
        result = await productService.topSellingProducts(req.user?.id);
    }
    else if (type == "recomended") {
        const { userkey } = await productService.getViewKey(req)
        result = await productService.recomendedProducts(userkey, req.user?.id);
    } else {
        const { data } = await productService.allProducts({}, options, req.user?.id);
        result = data;
    }

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Products retrived successfully',
        data: result,
    });
});

const newArrivalProducts = catchAsync(async (req: Request, res: Response) => {
    const result = await productService.newArrivalProducts();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Products retrived successfully',
        data: result,
    });
});

const productDetails = catchAsync(async (req: Request, res: Response) => {
    const result = await productService.productDetails(req.params.id, req, req.user?.id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Products details retrived successfully',
        data: result,
    });
});

const recentViewProducts = catchAsync(async (req: Request, res: Response) => {
    const { userkey } = await productService.getViewKey(req)
    const result = await productService.recentViewProducts(userkey);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Recent View Products Retrived Successfully',
        data: result,
    });
});

const trendingProducts = catchAsync(async (req: Request, res: Response) => {
    const result = await productService.trendingProducts(req?.user?.id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Trending Products Retrived Successfully',
        data: result,
    });
});

const topSellingProducts = catchAsync(async (req: Request, res: Response) => {
    const result = await productService.topSellingProducts(req?.user?.id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Top Selling Products Retrived Successfully',
        data: result,
    });
});


const recomendedProducts = catchAsync(async (req: Request, res: Response) => {
    const { userkey } = await productService.getViewKey(req)
    const result = await productService.recomendedProducts(userkey, req?.user?.id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Recomended Products Retrived Successfully',
        data: result,
    });
});

export const productControler = {
    addNewProduct,
    allProducts,
    newArrivalProducts,
    productsByType,
    productDetails,

    productsByUserName,

    recentViewProducts,
    trendingProducts,
    topSellingProducts,
    recomendedProducts
}