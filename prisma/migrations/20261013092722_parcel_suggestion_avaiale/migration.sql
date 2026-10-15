-- CreateTable
CREATE TABLE "parcel_suggestions" (
    "id" TEXT NOT NULL,
    "weight_kg" DOUBLE PRECISION NOT NULL,
    "height_cm" DOUBLE PRECISION NOT NULL,
    "width_cm" DOUBLE PRECISION NOT NULL,
    "length_cm" DOUBLE PRECISION NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parcel_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "parcel_suggestions_categoryId_key" ON "parcel_suggestions"("categoryId");

-- CreateIndex
CREATE INDEX "parcel_suggestions_categoryId_idx" ON "parcel_suggestions"("categoryId");

-- AddForeignKey
ALTER TABLE "parcel_suggestions" ADD CONSTRAINT "parcel_suggestions_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
