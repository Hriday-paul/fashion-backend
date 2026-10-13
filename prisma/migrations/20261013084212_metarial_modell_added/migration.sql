-- CreateTable
CREATE TABLE "material_by_category" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "material_by_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materials" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_materials" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_materials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "material_by_category_categoryId_materialId_idx" ON "material_by_category"("categoryId", "materialId");

-- CreateIndex
CREATE INDEX "material_by_category_materialId_categoryId_idx" ON "material_by_category"("materialId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "material_by_category_categoryId_materialId_key" ON "material_by_category"("categoryId", "materialId");

-- CreateIndex
CREATE INDEX "product_materials_productId_materialId_idx" ON "product_materials"("productId", "materialId");

-- CreateIndex
CREATE INDEX "product_materials_materialId_productId_idx" ON "product_materials"("materialId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "product_materials_productId_materialId_key" ON "product_materials"("productId", "materialId");

-- AddForeignKey
ALTER TABLE "material_by_category" ADD CONSTRAINT "material_by_category_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_by_category" ADD CONSTRAINT "material_by_category_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_materials" ADD CONSTRAINT "product_materials_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_materials" ADD CONSTRAINT "product_materials_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;
