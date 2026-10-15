import httpStatus from "http-status";
import AppError from "../../error/AppError";
import prisma from "../../shared/prisma";
import { redisKeys } from "../../redis/keys";
import { redisPub } from "../../redis";

const getAllSellCountries = async () => {
    //check on redis cache first, if not found then fetch from db and store in redis for future requests
    const cacheKey = await redisKeys.sellCountriesKey();
    const cachedData = await redisPub.get(cacheKey);
    if (cachedData) {
        return JSON.parse(cachedData);
    }

    const result = await prisma.sellCountries.findMany({
        orderBy: {
            name: 'asc'
        }
    });
    //set data on redis cache for future requests
    await redisPub.setEx(cacheKey, 3600, JSON.stringify(result)); // cache for 1 hour
    return result;
};

const addNewSellCountry = async (payload: { name: string; code: string }) => {
    const code = payload.code.trim().toUpperCase();
    const name = payload.name.trim();

    const existing = await getCountryByCode(code);

    if (existing) {
        throw new AppError(httpStatus.BAD_REQUEST, "Sell country with this code already exists");
    }

    const result = await prisma.sellCountries.create({
        data: {
            name,
            code
        }
    });

    //invalidate the cache
    await redisKeys.incrementSellCountriesVersion();

    return result;
};

const deleteSellCountry = async (id: string) => {
    const existing = await prisma.sellCountries.findUnique({
        where: { id }
    });

    if (!existing) {
        throw new AppError(httpStatus.NOT_FOUND, "Sell country not found");
    }

    const result = await prisma.sellCountries.delete({
        where: { id }
    });


    //invalidate the cache
    await redisKeys.incrementSellCountriesVersion();

    return result;
};

const getCountryByCode = async (code: string) => {
    const cacheKey = await redisKeys.sellCountryByCodeKey({ code });
    const cachedData = await redisPub.get(cacheKey);
    if (cachedData) {
        
        return JSON.parse(cachedData);
    }

    const result = await prisma.sellCountries.findUnique({
        where: { code }
    });

    if (result) {
        //set data on redis cache for future requests
        await redisPub.setEx(cacheKey, 3600, JSON.stringify(result)); // cache for 1 hour
    }

    return result;
};

export const sellCountriesService = {
    getAllSellCountries,
    addNewSellCountry,
    deleteSellCountry,
    getCountryByCode
};

