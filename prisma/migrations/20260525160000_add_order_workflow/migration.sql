-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'IN_PROGRESS';
ALTER TYPE "OrderStatus" ADD VALUE 'COMPLETED';
ALTER TYPE "OrderStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "startedAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "completedAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "cancelledAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "cancellationReason" TEXT;

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");
