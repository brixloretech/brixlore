-- AlterTable
ALTER TABLE "Plan" ADD COLUMN     "yearlyPrice" DECIMAL(10,2),
ADD COLUMN     "yearlyStripePriceId" TEXT,
ALTER COLUMN "duration" SET DEFAULT 'MONTHLY';
