ALTER TABLE "Content" ADD COLUMN "isFreeCatalog" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX "Content_isPublished_isFreeCatalog_idx" ON "Content"("isPublished", "isFreeCatalog");
