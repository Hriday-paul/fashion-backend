-- CreateIndex
CREATE INDEX "cart_items_groupId_productId_idx" ON "cart_items"("groupId", "productId");

-- CreateIndex
CREATE INDEX "cart_items_productId_groupId_idx" ON "cart_items"("productId", "groupId");
