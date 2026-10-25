-- CreateTable
CREATE TABLE "charity_thumbnails" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "charity_thumbnails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "charity_thumbnails_userId_key" ON "charity_thumbnails"("userId");

-- AddForeignKey
ALTER TABLE "charity_thumbnails" ADD CONSTRAINT "charity_thumbnails_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
