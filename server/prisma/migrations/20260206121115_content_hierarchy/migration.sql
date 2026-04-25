/*
  Warnings:

  - You are about to drop the column `videoId` on the `Download` table. All the data in the column will be lost.
  - You are about to drop the column `videoId` on the `ViewHistory` table. All the data in the column will be lost.
  - Added the required column `episodeId` to the `Download` table without a default value. This is not possible if the table is not empty.
  - Added the required column `episodeId` to the `ViewHistory` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('MOVIE', 'DOCUMENTARY', 'SERIES', 'ANIMATION', 'TRAILER', 'SHORT');

-- DropForeignKey
ALTER TABLE "Download" DROP CONSTRAINT "Download_videoId_fkey";

-- DropForeignKey
ALTER TABLE "ViewHistory" DROP CONSTRAINT "ViewHistory_videoId_fkey";

-- DropIndex
DROP INDEX "Download_videoId_idx";

-- DropIndex
DROP INDEX "ViewHistory_userId_videoId_idx";

-- DropIndex
DROP INDEX "ViewHistory_videoId_idx";

-- AlterTable
ALTER TABLE "Download" DROP COLUMN "videoId",
ADD COLUMN     "episodeId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ViewHistory" DROP COLUMN "videoId",
ADD COLUMN     "episodeId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Content" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "ContentType" NOT NULL,
    "thumbnailUrl" TEXT NOT NULL,
    "posterUrl" TEXT,
    "releaseYear" INTEGER NOT NULL,
    "ageRating" TEXT NOT NULL,
    "duration" INTEGER,
    "trailerId" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Season" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "seasonNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Episode" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "seasonId" TEXT,
    "episodeNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "duration" INTEGER NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Episode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Content_categoryId_idx" ON "Content"("categoryId");

-- CreateIndex
CREATE INDEX "Content_type_idx" ON "Content"("type");

-- CreateIndex
CREATE INDEX "Season_contentId_idx" ON "Season"("contentId");

-- CreateIndex
CREATE UNIQUE INDEX "Season_contentId_seasonNumber_key" ON "Season"("contentId", "seasonNumber");

-- CreateIndex
CREATE INDEX "Episode_contentId_idx" ON "Episode"("contentId");

-- CreateIndex
CREATE INDEX "Episode_seasonId_idx" ON "Episode"("seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "Episode_contentId_seasonId_episodeNumber_key" ON "Episode"("contentId", "seasonId", "episodeNumber");

-- CreateIndex
CREATE INDEX "Download_episodeId_idx" ON "Download"("episodeId");

-- CreateIndex
CREATE INDEX "ViewHistory_episodeId_idx" ON "ViewHistory"("episodeId");

-- CreateIndex
CREATE INDEX "ViewHistory_userId_episodeId_idx" ON "ViewHistory"("userId", "episodeId");

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_trailerId_fkey" FOREIGN KEY ("trailerId") REFERENCES "Content"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Season" ADD CONSTRAINT "Season_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Episode" ADD CONSTRAINT "Episode_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Episode" ADD CONSTRAINT "Episode_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Download" ADD CONSTRAINT "Download_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViewHistory" ADD CONSTRAINT "ViewHistory_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
