import { Brand, Category, Size } from "../../../generated/prisma/client";
import { redisPub } from "../../redis";
import { redisKeys } from "../../redis/keys";
import prisma from "../../shared/prisma";

const addNewCategory = async (payload: Category) => {
    const res = await prisma.category.create({ data: payload });

    //delete the cache for categories
    const allCatsCacheKey = await redisKeys.categoriesKey();
    await redisPub.del(allCatsCacheKey);

    //increment category version for cache invalidation
    await redisKeys.incrementCategoriesVersion();

    return res;
}

const deleteCategory = async (categoryId: string) => {
    const res = await prisma.category.delete({ where: { id: categoryId } });

    //delete the cache for categories
    const allCatsCacheKey = await redisKeys.categoriesKey();
    await redisPub.del(allCatsCacheKey);

    //increment category version for cache invalidation
    await redisKeys.incrementCategoriesVersion();

    return res;
}

interface CategoryC {
    id: string;
    name: string;
    parentId: string | null;
    children?: CategoryC[];
}

const buildCategoryTree = (categories: CategoryC[]) => {
    const map = new Map<string, CategoryC>();
    const roots: CategoryC[] = [];

    // create map
    categories.forEach(cat => {
        map.set(cat.id, { ...cat, children: [] });
    });

    // build tree
    categories.forEach(cat => {
        const node = map.get(cat.id)!;

        if (cat.parentId) {
            const parent = map.get(cat.parentId);
            parent?.children?.push(node);
        } else {
            roots.push(node);
        }
    });

    return roots;
};

const getCategories = async () => {

    //check on redis cache first
    const cacheKey = await redisKeys.categoriesKey();
    const cachedCategories = await redisPub.get(cacheKey);

    if (cachedCategories) {
        return JSON.parse(cachedCategories);
    }

    const categories = await prisma.$queryRaw<{ id: string; name: string; parentId: string | null }[]>`
  WITH RECURSIVE category_tree AS (
      SELECT id, name, "parentId"
      FROM "categories"
      WHERE "parentId" IS NULL

      UNION ALL

      SELECT c.id, c.name, c."parentId"
      FROM "categories" c
      INNER JOIN category_tree ct ON c."parentId" = ct.id
  )
  SELECT * FROM category_tree;
  `;

    const res = buildCategoryTree(categories);

    //cache the categories in redis for 1 hour
    await redisPub.setEx(cacheKey, 3600, JSON.stringify(res));

    return res;
}

const getParentChain = async (query: Record<string, unknown>): Promise<Category[]> => {

    const { categoryId } = query;

    if (!categoryId) {
        return []
    }

    //check on cache first
    const cacheKey = await redisKeys.categoryParentsKey({ categoryId: categoryId as string });
    const cachedParentChain = await redisPub.get(cacheKey);

    if (cachedParentChain) {
        return JSON.parse(cachedParentChain);
    }

    const result = await prisma.$queryRaw<Category[]>`
        WITH RECURSIVE parent_chain AS (
            SELECT *, 1 AS level
            FROM "categories"
            WHERE id = ${categoryId}

            UNION ALL

            SELECT c.*, pc.level + 1
            FROM "categories" c
            JOIN parent_chain pc ON c.id = pc."parentId"
        )
        SELECT id, name, "parentId", "sizeGuide", "createdAt", "updatedAt" 
        FROM parent_chain
        ORDER BY level DESC;
    `;

    //cache the parent chain in redis for 1 hour
    await redisPub.setEx(cacheKey, 3600, JSON.stringify(result));

    return result;
};

const buildChildCategoryTree = (categories: CategoryC[]) => {
    const map = new Map<string, CategoryC>();
    const roots: CategoryC[] = [];

    categories.forEach(cat => {
        map.set(cat.id, { ...cat, children: [] });
    });

    categories.forEach(cat => {
        const node = map.get(cat.id)!;

        if (cat.parentId && map.has(cat.parentId)) {
            // parent exists in current result set
            map.get(cat.parentId)!.children!.push(node);
        } else {
            // no parent OR parent not in result set → treat as root
            roots.push(node);
        }
    });

    return roots;
};

const getChildChain = async (categoryId: string): Promise<{ id: string; name: string; parentId: string | null }[]> => {
    //check on cache first
    const cacheKey = await redisKeys.categoryChildrensKey({ categoryId });
    const cachedChildChain = await redisPub.get(cacheKey);
    if (cachedChildChain) {
        return JSON.parse(cachedChildChain);
    }

    //if not in cache, query the database
    const categories = await prisma.$queryRaw<{ id: string; name: string; parentId: string | null }[]>`
  WITH RECURSIVE category_tree AS (
      SELECT id, name, "parentId"
      FROM "categories"
      WHERE "parentId" = ${categoryId}

      UNION ALL

      SELECT c.id, c.name, c."parentId"
      FROM "categories" c
      INNER JOIN category_tree ct ON c."parentId" = ct.id
  )
  SELECT * FROM category_tree;
  `;

    //cache the child chain in redis for 1 hour
    await redisPub.setEx(cacheKey, 3600, JSON.stringify(categories));

    return categories
}

const haveChildCategory = async (categoryId: string) => {
    const res = await prisma.category.findFirst({
        where: { id: categoryId },
        include: { children: true }
    })
    return res;
}

const filteredAttributes = async (query: Record<string, unknown>) => {
    const { categoryId, brands, sizes } = query;

    const category = categoryId ? await prisma.category.findFirst({
        where: {
            id: categoryId as string
        },
        select: {
            name: true,
            id: true,
        }
    }) : null;

    const sizeList = sizes ? await prisma.size.findMany({
        where: {
            id: {
                in: (sizes as string).split(",")
            }
        },
        select: {
            title: true,
            id: true,
        }
    }) : [];

    const brandList = brands ? await prisma.brand.findMany({
        where: {
            id: {
                in: (brands as string).split(",")
            }
        },
        select: {
            name: true,
            id: true,
        }
    }) : [];

    return {
        category,
        sizeList,
        brandList
    }

}

export const categoryService = {
    deleteCategory,
    addNewCategory,
    getCategories,
    getParentChain,
    getChildChain,
    haveChildCategory,

    buildChildCategoryTree,

    filteredAttributes,

    // assingedSizeByCategory,
    // addSizeToCategory,
    // deleteSizeFromCategory
}