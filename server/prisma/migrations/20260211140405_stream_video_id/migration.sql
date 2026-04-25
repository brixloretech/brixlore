/*
  Warnings:

  - A unique constraint covering the columns `[streamVideoId]` on the table `Episode` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Episode" ADD COLUMN     "streamVideoId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Episode_streamVideoId_key" ON "Episode"("streamVideoId");
