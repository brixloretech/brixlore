/*
  Warnings:

  - You are about to drop the column `streamVideoId` on the `Episode` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Episode_streamVideoId_key";

-- AlterTable
ALTER TABLE "Device" ADD COLUMN     "expoPushToken" TEXT;

-- AlterTable
ALTER TABLE "Episode" DROP COLUMN "streamVideoId";

-- CreateIndex
CREATE INDEX "Device_expoPushToken_idx" ON "Device"("expoPushToken");
