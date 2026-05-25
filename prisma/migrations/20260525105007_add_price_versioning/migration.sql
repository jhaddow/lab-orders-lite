/*
  Warnings:

  - You are about to drop the column `currency` on the `LabTest` table. All the data in the column will be lost.
  - You are about to drop the column `priceCents` on the `LabTest` table. All the data in the column will be lost.
  - You are about to drop the column `priceCentsAtOrder` on the `OrderItem` table. All the data in the column will be lost.
  - Added the required column `priceId` to the `OrderItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "LabTest" DROP COLUMN "currency",
DROP COLUMN "priceCents";

-- AlterTable
ALTER TABLE "OrderItem" DROP COLUMN "priceCentsAtOrder",
ADD COLUMN     "priceId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Price" (
    "id" TEXT NOT NULL,
    "labTestId" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Price_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Price_labTestId_createdAt_idx" ON "Price"("labTestId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "OrderItem_priceId_idx" ON "OrderItem"("priceId");

-- AddForeignKey
ALTER TABLE "Price" ADD CONSTRAINT "Price_labTestId_fkey" FOREIGN KEY ("labTestId") REFERENCES "LabTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_priceId_fkey" FOREIGN KEY ("priceId") REFERENCES "Price"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
