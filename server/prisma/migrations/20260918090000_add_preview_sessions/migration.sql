CREATE TABLE "PreviewViewer" (
    "id" TEXT NOT NULL,
    "identityHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PreviewViewer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PreviewSession" (
    "id" TEXT NOT NULL,
    "viewerId" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "previewNumber" INTEGER NOT NULL,
    "watchedSeconds" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PreviewSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PreviewAllowance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalSeconds" INTEGER NOT NULL DEFAULT 1200,
    "consumedSeconds" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PreviewAllowance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PreviewViewer_identityHash_key" ON "PreviewViewer"("identityHash");
CREATE INDEX "PreviewViewer_createdAt_idx" ON "PreviewViewer"("createdAt");
CREATE INDEX "PreviewSession_viewerId_createdAt_idx" ON "PreviewSession"("viewerId", "createdAt");
CREATE INDEX "PreviewSession_episodeId_idx" ON "PreviewSession"("episodeId");
CREATE UNIQUE INDEX "PreviewAllowance_userId_key" ON "PreviewAllowance"("userId");

ALTER TABLE "PreviewSession" ADD CONSTRAINT "PreviewSession_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "PreviewViewer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PreviewSession" ADD CONSTRAINT "PreviewSession_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PreviewAllowance" ADD CONSTRAINT "PreviewAllowance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
