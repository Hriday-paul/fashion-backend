import httpStatus from "http-status";
import prisma from "../../shared/prisma";
import AppError from "../../error/AppError";
import { redisPub } from "../../redis";
import { redisKeys } from "../../redis/keys";
import { categoryService } from "../category/category.service";

type Formats = { UK: string; US: string; EU: string; FR: string; IT: string };

const FORMAT_KEYS = ["UK", "US", "EU", "FR", "IT"] as const;

// title is never collected, it always mirrors the US value
const toSizeData = (f: Formats) => ({
    title: f.US,
    UK: f.UK,
    US: f.US,
    EU: f.EU,
    FR: f.FR,
    IT: f.IT,
});

// letter sizes take a single value that fills every format
const letterData = (value: string) => toSizeData({ UK: value, US: value, EU: value, FR: value, IT: value });

const sizeOrder = { sizes: { orderBy: { order: "asc" as const } } };

// ---------- size groups ----------

const allSizeGroups = async () => {
    return prisma.sizeGroup.findMany({
        orderBy: { createdAt: "asc" },
        include: { ...sizeOrder, _count: { select: { sizeCategories: true } } },
    });
};

const createSizeGroupImpl = async (payload: { groupName: string; sizes: Formats[] }) => {
    return prisma.sizeGroup.create({
        data: {
            groupName: payload.groupName,
            sizes: { create: payload.sizes.map(toSizeData) },
        },
        include: sizeOrder,
    });
};

const updateSizeGroupImpl = async (id: string, payload: { groupName: string }) => {
    const group = await prisma.sizeGroup.findUnique({ where: { id } });
    if (!group) throw new AppError(httpStatus.NOT_FOUND, "Size group not found");
    return prisma.sizeGroup.update({ where: { id }, data: { groupName: payload.groupName }, include: sizeOrder });
};

const deleteSizeGroupImpl = async (id: string) => {
    const group = await prisma.sizeGroup.findUnique({ where: { id } });
    if (!group) throw new AppError(httpStatus.NOT_FOUND, "Size group not found");

    const used = await prisma.product.count({ where: { size: { groupId: id } } });
    if (used > 0) throw new AppError(httpStatus.CONFLICT, "Cannot delete: a size in this group is used by products");

    // sizes cascade, category assignments are set to null
    return prisma.sizeGroup.delete({ where: { id } });
};

const addSizeToGroupImpl = async (groupId: string, payload: Formats) => {
    const group = await prisma.sizeGroup.findUnique({ where: { id: groupId } });
    if (!group) throw new AppError(httpStatus.NOT_FOUND, "Size group not found");
    return prisma.size.create({ data: { ...toSizeData(payload), groupId } });
};

// ---------- letter size group (single row) ----------

const getLetterSizeGroup = async () => {
    return prisma.letterSizeGroup.findFirst({ include: sizeOrder });
};

const createLetterSizeGroupImpl = async (payload: { groupName: string; sizes: { value: string }[] }) => {
    const existing = await prisma.letterSizeGroup.count();
    if (existing > 0) throw new AppError(httpStatus.CONFLICT, "Letter size group already exists");

    return prisma.letterSizeGroup.create({
        data: {
            groupName: payload.groupName,
            sizes: { create: payload.sizes.map((s) => letterData(s.value)) },
        },
        include: sizeOrder,
    });
};

const updateLetterSizeGroupImpl = async (payload: { groupName: string }) => {
    const group = await prisma.letterSizeGroup.findFirst();
    if (!group) throw new AppError(httpStatus.NOT_FOUND, "Letter size group not found");
    return prisma.letterSizeGroup.update({ where: { id: group.id }, data: { groupName: payload.groupName }, include: sizeOrder });
};

const addLetterSizeImpl = async (payload: { value: string }) => {
    const group = await prisma.letterSizeGroup.findFirst();
    if (!group) throw new AppError(httpStatus.NOT_FOUND, "Letter size group not found");
    return prisma.size.create({ data: { ...letterData(payload.value), letterGroupId: group.id } });
};

// ---------- single size ----------

const updateSizeImpl = async (sizeId: string, payload: Partial<Formats> & { value?: string }) => {
    const size = await prisma.size.findUnique({ where: { id: sizeId } });
    if (!size) throw new AppError(httpStatus.NOT_FOUND, "Size not found");

    if (size.letterGroupId) {
        if (!payload.value) throw new AppError(httpStatus.BAD_REQUEST, "value is required for a letter size");
        return prisma.size.update({ where: { id: sizeId }, data: letterData(payload.value) });
    }

    const missing = FORMAT_KEYS.filter((key) => !payload[key]);
    if (missing.length) throw new AppError(httpStatus.BAD_REQUEST, `${missing.join(", ")} size is required`);
    return prisma.size.update({ where: { id: sizeId }, data: toSizeData(payload as Formats) });
};

const dltSizeImpl = async (sizeId: string) => {
    const size = await prisma.size.findUnique({ where: { id: sizeId } });
    if (!size) throw new AppError(httpStatus.NOT_FOUND, "Size not found");

    const used = await prisma.product.count({ where: { sizeId } });
    if (used > 0) throw new AppError(httpStatus.CONFLICT, "Cannot delete: this size is used by products");

    return prisma.size.delete({ where: { id: sizeId } });
};

// ---------- category assignment (1:1) ----------

const getCategoryAssignment = async (categoryId: string) => {
    return prisma.sizeCategoryGroup.findUnique({
        where: { categoryId },
        include: {
            sizeGroup: { include: sizeOrder },
            letterSizeGroup: { include: sizeOrder },
        },
    });
};

const assignToCategoryImpl = async (payload: { categoryId: string; sizeGroupId?: string; letterSizeGroupId?: string }) => {
    const { categoryId, sizeGroupId, letterSizeGroupId } = payload;

    if (!sizeGroupId && !letterSizeGroupId) {
        throw new AppError(httpStatus.BAD_REQUEST, "sizeGroupId or letterSizeGroupId is required");
    }

    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) throw new AppError(httpStatus.NOT_FOUND, "Category not found");

    const children = await prisma.category.count({ where: { parentId: categoryId } });
    if (children > 0) throw new AppError(httpStatus.BAD_REQUEST, "Size groups can only be assigned to the last category");

    if (sizeGroupId && !(await prisma.sizeGroup.findUnique({ where: { id: sizeGroupId } }))) {
        throw new AppError(httpStatus.NOT_FOUND, "Size group not found");
    }
    if (letterSizeGroupId && !(await prisma.letterSizeGroup.findUnique({ where: { id: letterSizeGroupId } }))) {
        throw new AppError(httpStatus.NOT_FOUND, "Letter size group not found");
    }

    // only touch the fields that were sent, so the other group stays assigned
    const data = {
        ...(sizeGroupId ? { sizeGroupId } : {}),
        ...(letterSizeGroupId ? { letterSizeGroupId } : {}),
    };

    return prisma.sizeCategoryGroup.upsert({
        where: { categoryId },
        create: { categoryId, ...data },
        update: data,
    });
};

const removeFromCategoryImpl = async (categoryId: string, type: "size" | "letter") => {
    const row = await prisma.sizeCategoryGroup.findUnique({ where: { categoryId } });
    if (!row) throw new AppError(httpStatus.NOT_FOUND, "No size group assigned to this category");

    const next = {
        sizeGroupId: type === "size" ? null : row.sizeGroupId,
        letterSizeGroupId: type === "letter" ? null : row.letterSizeGroupId,
    };

    // drop the row when nothing is assigned any more
    if (!next.sizeGroupId && !next.letterSizeGroupId) {
        return prisma.sizeCategoryGroup.delete({ where: { categoryId } });
    }
    return prisma.sizeCategoryGroup.update({ where: { categoryId }, data: next });
};

// every write invalidates the cached storefront sizes
const createSizeGroup = async (...args: Parameters<typeof createSizeGroupImpl>) => {
    const result = await createSizeGroupImpl(...args);
    await redisKeys.incrementSizesVersion();
    return result;
};

const updateSizeGroup = async (...args: Parameters<typeof updateSizeGroupImpl>) => {
    const result = await updateSizeGroupImpl(...args);
    await redisKeys.incrementSizesVersion();
    return result;
};

const deleteSizeGroup = async (...args: Parameters<typeof deleteSizeGroupImpl>) => {
    const result = await deleteSizeGroupImpl(...args);
    await redisKeys.incrementSizesVersion();
    return result;
};

const addSizeToGroup = async (...args: Parameters<typeof addSizeToGroupImpl>) => {
    const result = await addSizeToGroupImpl(...args);
    await redisKeys.incrementSizesVersion();
    return result;
};

const createLetterSizeGroup = async (...args: Parameters<typeof createLetterSizeGroupImpl>) => {
    const result = await createLetterSizeGroupImpl(...args);
    await redisKeys.incrementSizesVersion();
    return result;
};

const updateLetterSizeGroup = async (...args: Parameters<typeof updateLetterSizeGroupImpl>) => {
    const result = await updateLetterSizeGroupImpl(...args);
    await redisKeys.incrementSizesVersion();
    return result;
};

const addLetterSize = async (...args: Parameters<typeof addLetterSizeImpl>) => {
    const result = await addLetterSizeImpl(...args);
    await redisKeys.incrementSizesVersion();
    return result;
};

const updateSize = async (...args: Parameters<typeof updateSizeImpl>) => {
    const result = await updateSizeImpl(...args);
    await redisKeys.incrementSizesVersion();
    return result;
};

const dltSize = async (...args: Parameters<typeof dltSizeImpl>) => {
    const result = await dltSizeImpl(...args);
    await redisKeys.incrementSizesVersion();
    return result;
};

const assignToCategory = async (...args: Parameters<typeof assignToCategoryImpl>) => {
    const result = await assignToCategoryImpl(...args);
    await redisKeys.incrementSizesVersion();
    return result;
};

const removeFromCategory = async (...args: Parameters<typeof removeFromCategoryImpl>) => {
    const result = await removeFromCategoryImpl(...args);
    await redisKeys.incrementSizesVersion();
    return result;
};

// ---------- storefront (public) ----------

const sizeSelect = { sizes: { orderBy: { order: "asc" as const }, select: { id: true, title: true, UK: true, US: true, EU: true, FR: true, IT: true, order: true } } };

type SizeListItem = { id: string; groupName: string; isLetter: boolean; sizes: unknown[] };

const getSizes = async (categoryId?: string): Promise<SizeListItem[]> => {
    const cacheKey = await redisKeys.sizesKey({ categoryId });
    const cached = await redisPub.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const toItem = (group: { id: string; groupName: string; sizes: unknown[] }, isLetter: boolean) => ({ id: group.id, groupName: group.groupName, isLetter, sizes: group.sizes });

    let result: SizeListItem[] = [];

    if (!categoryId) {
        const [letter, groups] = await Promise.all([
            prisma.letterSizeGroup.findFirst({ include: sizeSelect }),
            prisma.sizeGroup.findMany({ orderBy: { createdAt: "asc" }, include: sizeSelect }),
        ]);
        result = [...(letter ? [toItem(letter, true)] : []), ...groups.map((group) => toItem(group, false))];
    } else {
        // last (leaf) categories under the category, or the category itself when it is a leaf
        const descendants = await categoryService.getChildChain(categoryId);
        const parentIds = new Set(descendants.map((category) => category.parentId));
        const leafIds = descendants.length ? descendants.filter((category) => !parentIds.has(category.id)).map((category) => category.id) : [categoryId];

        const rows = await prisma.sizeCategoryGroup.findMany({
            where: { categoryId: { in: leafIds } },
            include: { sizeGroup: { include: sizeSelect } },
        });

        const groups = new Map<string, SizeListItem>();
        rows.forEach((row) => { if (row.sizeGroup) groups.set(row.sizeGroup.id, toItem(row.sizeGroup, false)); });

        // a letter group on any leaf goes on top (queried once)
        const letterId = rows.find((row) => row.letterSizeGroupId)?.letterSizeGroupId;
        const letter = letterId ? await prisma.letterSizeGroup.findUnique({ where: { id: letterId }, include: sizeSelect }) : null;

        result = [...(letter ? [toItem(letter, true)] : []), ...groups.values()];
    }

    await redisPub.setEx(cacheKey, 3600, JSON.stringify(result));
    return result;
};

export const sizeService = {
    getSizes,
    allSizeGroups,
    createSizeGroup,
    updateSizeGroup,
    deleteSizeGroup,
    addSizeToGroup,
    getLetterSizeGroup,
    createLetterSizeGroup,
    updateLetterSizeGroup,
    addLetterSize,
    updateSize,
    dltSize,
    getCategoryAssignment,
    assignToCategory,
    removeFromCategory,
};
