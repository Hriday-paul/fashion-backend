import { Prisma } from "../../../generated/prisma/client";
import { paginationHelper, TPaginationOptions } from "../../helper/pagination.helper";
import prisma from "../../shared/prisma";

type SearchSuggestion = {
  id: string;
  name: string;
  type: "brand" | "keyword";
  similarity: number;
  categoryId: string | null;
  categoryName: string | null;
  displayName: string;
};

const searchSuggestions = async (q: string) => {

  const query = q.toLowerCase().trim();

  const results = await prisma.$queryRaw<SearchSuggestion[]>(Prisma.sql`
  WITH RECURSIVE

  /* ----------------------------------
     1. Find ONLY top 2 brands
     ---------------------------------- */
  top_brands AS (
    SELECT
      b.id,
      b.name,
      similarity(
        LOWER(b.name),
        LOWER(${query})
      ) AS similarity

    FROM brands b

    WHERE similarity(
      LOWER(b.name),
      LOWER(${query})
    ) >= 0.05

    ORDER BY similarity DESC

    LIMIT 2
  ),

  /* ----------------------------------
     2. Get categories of ONLY those
        2 brands
     ---------------------------------- */
  brand_categories AS (
    SELECT
      tb.id AS "brandId",
      tb.name AS "brandName",
      tb.similarity,

      c.id AS "categoryId",
      c.name AS "categoryName",
      c."parentId"

    FROM top_brands tb

    INNER JOIN brand_by_category bbc
      ON bbc."brandId" = tb.id

    INNER JOIN categories c
      ON c.id = bbc."categoryId"
  ),

  /* ----------------------------------
     3. Walk category tree
     ---------------------------------- */
  category_tree AS (
    SELECT
      bc."brandId",
      bc."brandName",
      bc.similarity,

      bc."categoryId" AS "originalCategoryId",

      bc."categoryId" AS "currentCategoryId",
      bc."categoryName" AS "currentCategoryName",

      bc."parentId"

    FROM brand_categories bc

    UNION ALL

    SELECT
      ct."brandId",
      ct."brandName",
      ct.similarity,

      ct."originalCategoryId",

      parent.id,
      parent.name,
      parent."parentId"

    FROM category_tree ct

    INNER JOIN categories parent
      ON parent.id = ct."parentId"
  ),

  /* ----------------------------------
     4. Root/top parent category
     ---------------------------------- */
  root_categories AS (
    SELECT DISTINCT ON (
      "brandId",
      "originalCategoryId"
    )
      "brandId",
      "brandName",
      similarity,

      "currentCategoryId" AS "categoryId",
      "currentCategoryName" AS "categoryName"

    FROM category_tree

    WHERE "parentId" IS NULL

    ORDER BY
      "brandId",
      "originalCategoryId"
  ),

  /* ----------------------------------
     5. Brand results
     ---------------------------------- */
  brand_results AS (
    SELECT
      "brandId" AS id,
      "brandName" AS name,
      'brand'::text AS type,
      similarity,

      "categoryId",
      "categoryName",

      CASE
        WHEN "categoryName" IS NOT NULL
        THEN CONCAT(
          "brandName",
          ' in ',
          "categoryName"
        )
        ELSE "brandName"
      END AS "displayName"

    FROM root_categories
  ),

  /* ----------------------------------
     6. Keyword results
     ---------------------------------- */
  keyword_results AS (
    SELECT
      k.id,
      k.name,
      'keyword'::text AS type,

      similarity(
        LOWER(k.name),
        LOWER(${query})
      ) AS similarity,

      NULL::text AS "categoryId",
      NULL::text AS "categoryName",

      k.name AS "displayName"

    FROM keywords k

    WHERE similarity(
      LOWER(k.name),
      LOWER(${query})
    ) >= 0.05

    ORDER BY similarity DESC

    LIMIT 10
  ),

  /* ----------------------------------
     7. Number of brands
     ---------------------------------- */
  brand_count AS (
    SELECT COUNT(*)::int AS count
    FROM brand_results
  ),

  /* ----------------------------------
     8. Select keywords for remaining
        slots
     ---------------------------------- */
    selected_keywords AS (
    SELECT
      kr.*,

      ROW_NUMBER() OVER (
        ORDER BY kr.similarity DESC
      ) AS row_num

    FROM keyword_results kr
  ),

  final_results AS (
    SELECT
      id,
      name,
      type,
      similarity,
      "categoryId",
      "categoryName",
      "displayName"
    FROM brand_results

    UNION ALL

    SELECT
      sk.id,
      sk.name,
      sk.type,
      sk.similarity,
      sk."categoryId",
      sk."categoryName",
      sk."displayName"
    FROM selected_keywords sk

    CROSS JOIN brand_count bc

    WHERE sk.row_num <= 10 - bc.count
  )

  SELECT
    similarity,
    "displayName"

  FROM final_results

  ORDER BY
    CASE
      WHEN type = 'brand' THEN 0
      ELSE 1
    END,
    similarity DESC
`);

  return results;

}

const peopleSuggestions = async (q: string) => {

  const query = q.toLowerCase().trim();

  const results = await prisma.$queryRaw<SearchSuggestion[]>(Prisma.sql`
    WITH people AS (
      SELECT
        U."userName" AS "userName",
        PP."url" AS "profilePictureUrl",
        AU."role" AS "role",
        similarity(
          LOWER(U."userName"),
          LOWER(${query})
        ) AS similarity

      FROM users U

      LEFT JOIN profile_pictures PP
        ON U."id" = PP."userId"

      LEFT JOIN auths AU
        ON U."id" = AU."userId"

      WHERE
        AU."isverified" = true
        AND U."isDeleted" = false
    )

    SELECT
      "userName",
      "profilePictureUrl",
      "role",
      similarity
    FROM people

    WHERE similarity >= 0.05

    ORDER BY similarity DESC

    LIMIT 10
  `);

  return results;
};

const addNewKeyword = async (payload: { keyword: string }) => {
  const { keyword } = payload;
  const newKeyword = await prisma.keyword.create({
    data: {
      name: keyword,
    }
  });

  return newKeyword;
}

const allKeywords = async (query: Record<string, unknown>, options: TPaginationOptions) => {
  const AndConditions: Prisma.KeywordWhereInput[] = [];
  const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);

  const { searchTerm } = query;

  if (searchTerm) {
    AndConditions.push({
      OR: [
        {
          name: {
            contains: searchTerm as string,
            mode: "insensitive",
          }
        },

      ],
    });
  }

  const whereConditions: Prisma.KeywordWhereInput = AndConditions.length > 0 ? { AND: AndConditions } : {};

  const result = await prisma.keyword.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
  })

  const total = await prisma.keyword.count({
    where: whereConditions,
  });

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: result,
  };
}

const dltKeyword = async (keywordId: string) => {
  const deletedKeyword = await prisma.keyword.delete({
    where: {
      id: keywordId,
    }
  });

  return deletedKeyword;
}


export const keywordService = {
  searchSuggestions,
  peopleSuggestions,
  addNewKeyword,
  allKeywords,
  dltKeyword
};