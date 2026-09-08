-- CreateEnum
CREATE TYPE "BadgeRole" AS ENUM ('GENERAL', 'ECO_FRIENDLY', 'CHARITABLE_ORGANIZATION', 'CHARITY_SHOP');

-- CreateEnum
CREATE TYPE "BadgeType" AS ENUM ('FASHION_PHILANTHROPIST', 'STYLE_STARTER', 'FIRST_PURCHASE', 'MONEY_DONOR', 'ECO_HERO', 'FIRST_SALE', 'TREE_PLANTER', 'CLOTHING_DONOR', 'FREQUENT_SELLER', 'TOP_BUYER', 'SPEEDY_SHIPPER', 'FASHION_ACTIVIST', 'TRUSTED_SELLER', 'CHARITY_SUPPORTER', 'SUSTAINABLE_MATERIALS', 'FAST_SHIPPER', 'TOP_ECO_SELLER', 'BUYERS_FAVOURITE', 'CHARITY_CHAMPION', 'TOP_CHARITY_FUNDRAISER', 'VINTAGE_COLLECTION');

-- CreateTable
CREATE TABLE "Badge" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "type" "BadgeType" NOT NULL,
    "target" INTEGER NOT NULL,
    "role" "BadgeRole" NOT NULL DEFAULT 'GENERAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBadge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "earnedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Badge_role_idx" ON "Badge"("role");

-- CreateIndex
CREATE INDEX "Badge_type_idx" ON "Badge"("type");

-- CreateIndex
CREATE INDEX "Badge_role_type_idx" ON "Badge"("role", "type");

-- CreateIndex
CREATE INDEX "UserBadge_userId_isCompleted_idx" ON "UserBadge"("userId", "isCompleted");

-- CreateIndex
CREATE INDEX "UserBadge_badgeId_idx" ON "UserBadge"("badgeId");

-- CreateIndex
CREATE UNIQUE INDEX "UserBadge_userId_badgeId_key" ON "UserBadge"("userId", "badgeId");

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "Badge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
