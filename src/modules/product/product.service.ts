import { Approval_Status, Prisma, Product, Role } from "../../../generated/prisma/client";
import AppError from "../../error/AppError";
import { paginationHelper, TPaginationOptions } from "../../helper/pagination.helper";
import prisma from "../../shared/prisma";
import { categoryService } from "../category/category.service";
import httpStatus from "http-status";

type ProductOtherPayload = {
    images: { key: string, url: string }[],
    charities: { isAnonymous: boolean, charityId: string, percent: number }[]
}

const addNewProduct = async (payload: Product & ProductOtherPayload, role: string) => {

    const { images, charities, createdAt, updatedAt, catagory_hierarchy, ...morePayload } = payload;

    const category = await categoryService.haveChildCategory(payload?.categoryId);
    //checking catalog is avaialable or not
    if (!category) {
        throw new AppError(httpStatus.NOT_FOUND, "Selected catalog doesn't exist")
    }
    //checking have child category
    if (category?.children && category?.children?.length > 0) {
        throw new AppError(httpStatus.CONFLICT, "Please, select next catalog")
    }

    //get category hierarchy list
    const categories = await categoryService.getParentChain(payload?.categoryId);
    const hierarchy = categories.map(cat => cat?.id);


    const charityRoles: string[] = [Role.ECO_FRIENDLY_STORE, Role.CHARITABLE_ORGANIZATION, Role.CHARITY_SHOP];
    const isAllowCharity = !charityRoles.includes(role);


    // check payload charities exact charity or not
    if (charities?.length > 0) {
        const CHARITY_ROLES = [
            Role.CHARITY_SHOP,
            Role.CHARITABLE_ORGANIZATION,
        ];
        const charityIds = charities?.map(c => c?.charityId);
        const validCharities = await prisma.auth.findMany({
            where: {
                userId: { in: charityIds },
                role: { in: CHARITY_ROLES },
                isDeleted: false,
                status: true,
                approval_status: Approval_Status.Approved
            },
            select: { userId: true, role: true },
        });

        const validIds = new Set(validCharities.map((a) => a.userId));
        const invalidIds = charityIds.filter((id) => !validIds.has(id));

        if (invalidIds.length > 0) {
            throw new Error(
                `The following IDs are not a Charity Shop or Charitable Organization: ${invalidIds.join(", ")}`
            );
        }
    }

    const res = await prisma.product.create({
        data: {
            images: { create: images },
            charities: { create: isAllowCharity ? charities : [] },
            ...morePayload,
            catagory_hierarchy: hierarchy
        }
    });

    return res;
}

const allProducts = async (query: Record<string, unknown>, options: TPaginationOptions) => {
    const AndConditions: Prisma.ProductWhereInput[] = [{ isDeleted: false }];

    const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);

    const { searchTerm, category, minPrice, maxPrice, conditions, brands, sizes, colors, meterials, ...moreFields } = query;

    if (searchTerm) {
        AndConditions.push({
            OR: [
                {
                    title: {
                        contains: searchTerm as string,
                        mode: "insensitive",
                    },
                },
                {
                    description: {
                        contains: searchTerm as string,
                        mode: "insensitive",
                    },
                },
                {
                    tags: {
                        has: searchTerm as string
                    }
                }
            ],
        });
    }

    if (category) {
        AndConditions.push({
            catagory_hierarchy: {
                has: category as string
            }
        });
    }

    if (brands) {
        const splitBrand = (brands as string).split(",")
        AndConditions.push({
            brandId: {
                in: splitBrand
            }
        });
    }
    if (sizes) {
        const splitSize = (sizes as string).split(",")
        AndConditions.push({
            sizeId: {
                in: splitSize
            }
        });
    }

    if (conditions) {
        const splitCondition = (conditions as string).split(",");
        AndConditions.push({
            condition: {
                in: splitCondition
            },
        });
    }
    if (colors) {
        const splitColors = (colors as string).split(",");
        AndConditions.push({
            color: {
                in: splitColors
            },
        });
    }
    if (meterials) {
        const splitMeterials = (meterials as string).split(",");
        AndConditions.push({
            meterials: {
                hasSome: splitMeterials
            },
        });
    }

    if (minPrice || maxPrice) {
        AndConditions.push({
            price: {
                gte: minPrice ? Number(minPrice) : undefined,
                lte: maxPrice ? Number(maxPrice) : undefined,
            },
        });
    }

    if (Object.keys(moreFields)?.length > 0) {
        Object.entries(moreFields).forEach(([field, value]) => {
            AndConditions.push({
                [field]: {
                    equals: value,
                },
            });
        });
    }

    const whereConditions: Prisma.ProductWhereInput = AndConditions.length > 0 ? { AND: AndConditions } : {};

    const result = await prisma.product.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: {
            [sortBy]: sortOrder,
        },
        include: {
            images: true,
            brand: true,
            size: true,
            category: true
        },
    })

    const total = await prisma.product.count({
        where: whereConditions,
    });

    return {
        meta: {
            total,
            totalPage: Math.ceil(total / limit),
            page,
            limit,
        },
        data: result,
    };

}

export const productService = {
    addNewProduct,

    allProducts
}