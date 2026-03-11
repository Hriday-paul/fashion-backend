import { Brand, Category, Size } from "../../../generated/prisma/client";
import prisma from "../../shared/prisma";

const addNewCategory = async (payload: Category) => {
    const res = await prisma.category.create({ data: payload });
    return res;
}

const deleteCategory = async (categoryId: string) => {
    const res = await prisma.category.delete({ where: { id: categoryId } });
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
    const categories = await prisma.$queryRaw<
        { id: string; name: string; parentId: string | null }[]
    >`
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

    return buildCategoryTree(categories);
}

const getParentChain = async (categoryId: string): Promise<Category[]> => {
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

    return result;
};

const haveChildCategory = async (categoryId: string) => {
    const res = await prisma.category.findFirst({
        where: { id: categoryId },
        include: { children: true }
    })
    return res;
}

const addNewBrand = async (payload: Brand & { categoryId: string }) => {

    const res = await prisma.brand.create({ data: { name: payload?.name, categoryId: payload?.categoryId } });
    return res;
}

const deletBrand = async (brandId: string) => {

    const res = await prisma.brand.delete({ where: { id: brandId } });
    return res;
}

const allBrands = async (categoryId: string) => {

    const category = await prisma.category.findUnique({
        where: { id: categoryId }
    });

    const filterArray = [{ categoryId }];

    if (category?.parentId) {
        filterArray.push({ categoryId: category?.parentId });
    }

    const res = await prisma.brand.findMany({
        where: { OR: filterArray }
    });

    return res;
}


const allSizes = async (categoryId: string) => {

    const category = await prisma.category.findUnique({
        where: { id: categoryId }
    });

    const filterArray = [{ categoryId }];

    if (category?.parentId) {
        filterArray.push({ categoryId: category?.parentId });
    }

    const res = await prisma.size.findMany({
        where: { OR: filterArray }
    });

    return res;
}

const addSize = async (payload: Size) => {

    const res = await prisma.size.create({ data: payload });
    return res;
}

const deleteSize = async (sizeId: string) => {

    const res = await prisma.size.delete({ where: { id: sizeId } });
    return res;
}

export const categoryService = {
    deleteCategory,
    addNewCategory,
    getCategories,
    getParentChain,
    haveChildCategory,

    addNewBrand,
    deletBrand,
    allBrands,

    allSizes,
    addSize,
    deleteSize
}