/*
  Warnings:

  - A unique constraint covering the columns `[shipmentId]` on the table `orders` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[authShipmentId]` on the table `orders` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "orders_shipmentId_key" ON "orders"("shipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "orders_authShipmentId_key" ON "orders"("authShipmentId");
