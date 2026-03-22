import AppError from "../../error/AppError";
import prisma from "../../shared/prisma"
import httpStatus from "http-status";

const favouritesByUser = async (userId: string) => {
    const favourites = await prisma.favourite.findMany({
        where: { userId },
        include: {
            product: {
                include: {
                    images: true
                }
            }
        }
    });
    return favourites;
}

const addFavourite = async (productId: string, userId: string) => {

    //check favourite exist
    const exist = await prisma.favourite.findFirst({ where: { userId, productId } });
    if (exist) {
        throw new AppError(httpStatus.CONFLICT, "Product already exist in favourite");
    }

    const favourite = await prisma.favourite.create({
        data: {
            userId,
            productId
        }
    });

    return favourite;
}

const deleteFavourite = async (productId: string, userId: string) => {

    //check favourite exist
    const exist = await prisma.favourite.findFirst({ where: { userId, productId } });
    if (!exist) {
        throw new AppError(httpStatus.CONFLICT, "Favourite does not exist");
    }

    const favourite = await prisma.favourite.delete({
        where: { id: exist?.id }
    });

    return favourite;
}

export const favouriteService = {
    favouritesByUser,
    addFavourite,
    deleteFavourite
}