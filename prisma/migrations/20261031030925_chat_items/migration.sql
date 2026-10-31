-- CreateTable
CREATE TABLE "chat_items" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chat_items_chatId_productId_idx" ON "chat_items"("chatId", "productId");

-- CreateIndex
CREATE INDEX "chat_items_productId_chatId_idx" ON "chat_items"("productId", "chatId");

-- AddForeignKey
ALTER TABLE "chat_items" ADD CONSTRAINT "chat_items_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "chatGroups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_items" ADD CONSTRAINT "chat_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
