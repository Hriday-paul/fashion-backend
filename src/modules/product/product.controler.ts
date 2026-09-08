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
        req.body.images = urls.map(url => {
            return {
                key: url.key,
                url: url.url,
            };
        });
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


const myProducts = catchAsync(async (req: Request, res: Response) => {

    const query = pick(req.query, ["searchTerm", "category", "minPrice", "maxPrice", "conditions", "brands", "sizes", "colors", "meterials"])
    const options = pick(req.query, PaginateOptions);

    const result = await productService.myProducts(query, options, req.user.id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'My sell items successfully',
        data: result,
    });
});

const productsByUserName = catchAsync(async (req: Request, res: Response) => {

    const query = pick(req.query, ["searchTerm", "category", "minPrice", "maxPrice", "conditions", "brands", "sizes", "colors", "meterials", "showItemInCart"])
    const options = pick(req.query, PaginateOptions);

    const result = await productService.productsByUserName(query, options, req.params.username, req.user?.id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Products retrived successfully',
        data: result,
    });
});

const similarProductsFromSeller = catchAsync(async (req: Request, res: Response) => {

    const result = await productService.similarProductsFromSeller(req.params.productId, req.user?.id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Seller more items retrived successfully',
        data: result,
    });
});

const sameCategoryProducts = catchAsync(async (req: Request, res: Response) => {

    const result = await productService.sameCategoryProducts(req.params.productId, req.user?.id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Same category products retrieved successfully',
        data: result,
    });
});

const sameColorProducts = catchAsync(async (req: Request, res: Response) => {

    const result = await productService.sameColorProducts(req.params.productId, req.user?.id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Same color products retrieved successfully',
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

const productStats = catchAsync(async (req: Request, res: Response) => {
    const result = await productService.productStats(req.params.productId, req.user?.id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Products details retrived successfully',
        data: result,
    });
});

const donationSupportByProduct = catchAsync(async (req: Request, res: Response) => {
    const result = await productService.donationSupportByProduct(req.params.productId);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Donation support information retrieved successfully',
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

const dropPriceForAProduct = catchAsync(async (req: Request, res: Response) => {

    const result = await productService.dropPriceForAProduct(req.body, req?.user);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Product price dropped successfully',
        data: result,
    });
});

const makeAnOfferAsBuyer = catchAsync(async (req: Request, res: Response) => {
    const result = await productService.makeAnOfferAsBuyer(req.body, req?.user);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Offer sent to seller successfully',
        data: result,
    });
});
const acceptOfferAsSeller = catchAsync(async (req: Request, res: Response) => {
    const result = await productService.acceptOfferAsSeller(req.body.offerId, req?.user);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Offer accepted successfully',
        data: result,
    });
});
const declineCounterOfferAsSeller = catchAsync(async (req: Request, res: Response) => {
    const result = await productService.declineCounterOfferAsSeller(req.body, req?.user);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Offer declined successfully',
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
    myProducts,

    recentViewProducts,
    trendingProducts,
    topSellingProducts,
    recomendedProducts,
    similarProductsFromSeller,
    donationSupportByProduct,
    sameCategoryProducts,
    sameColorProducts,
    productStats,
    dropPriceForAProduct,

    makeAnOfferAsBuyer,
    acceptOfferAsSeller,
    declineCounterOfferAsSeller
}