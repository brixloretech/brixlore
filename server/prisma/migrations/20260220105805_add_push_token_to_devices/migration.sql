/*
  Warnings:

  - You are about to drop the column `expoPushToken` on the `Device` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Device_expoPushToken_idx";

-- AlterTable
ALTER TABLE "Device" DROP COLUMN "expoPushToken",
ADD COLUMN     "pushToken" TEXT;

-- CreateIndex
CREATE INDEX "Device_pushToken_idx" ON "Device"("pushToken");
