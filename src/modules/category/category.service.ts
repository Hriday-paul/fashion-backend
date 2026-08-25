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

    return buildCategoryTree(categories);
}

const getParentChain = async (query: Record<string, unknown>): Promise<Category[]> => {
    
    const { categoryId } = query;

    if (!categoryId) {
        return []
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

    return categories
}

const haveChildCategory = async (categoryId: string) => {
    const res = await prisma.category.findFirst({
        where: { id: categoryId },
        include: { children: true }
    })
    return res;
}

const assignBrandToCategory = async (payload: { categoryId: string, brandId: string }) => {

    const res = await prisma.brandByCategory.create({ data: { categoryId: payload?.categoryId, brandId: payload?.brandId } });
    return res;
}

const deletBrandToCategory = async (brandId: string) => {

    const res = await prisma.brand.delete({ where: { id: brandId } });
    return res;
}

const allBrandsByCategory = async (categoryId: string) => {

    const res = await prisma.brandByCategory.findMany({
        where: {
            categoryId: categoryId
        }
    });

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


// const assingedSizeByCategory = async (categoryId: string) => {

//     const res = await prisma.sizeByCategory.findMany({
//         where: {
//             categoryId: categoryId
//         }
//     });

//     return res;
// }

// const addSizeToCategory = async (payload: { categoryId: string, sizeId: string }) => {

//     const res = await prisma.sizeByCategory.create({ data: { categoryId: payload?.categoryId, sizeId: payload?.sizeId } });
//     return res;
// }

// const deleteSizeFromCategory = async (payload: { categoryId: string, sizeId: string }) => {

//     const res = await prisma.sizeByCategory.delete({ where: { categoryId_sizeId: { categoryId: payload?.categoryId, sizeId: payload?.sizeId } } });
//     return res;
// }

export const categoryService = {
    deleteCategory,
    addNewCategory,
    getCategories,
    getParentChain,
    getChildChain,
    haveChildCategory,

    buildChildCategoryTree,

    assignBrandToCategory,
    deletBrandToCategory,
    allBrandsByCategory,

    filteredAttributes,

    // assingedSizeByCategory,
    // addSizeToCategory,
    // deleteSizeFromCategory
}