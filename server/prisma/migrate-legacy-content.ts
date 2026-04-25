import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type ContentType = 'MOVIE' | 'DOCUMENTARY' | 'SERIES' | 'ANIMATION' | 'TRAILER' | 'SHORT';

function resolveContentType(title: string, categoryName?: string | null): ContentType {
  const haystack = `${title} ${categoryName ?? ''}`.toLowerCase();
  if (haystack.includes('documentary') || haystack.includes('docu')) {
    return 'DOCUMENTARY';
  }
  return 'MOVIE';
}

async function main() {
  const db = prisma as any;
  const legacyVideos = await db.legacyVideo.findMany({
    include: { category: true },
  });

  for (const legacy of legacyVideos) {
    const exists = await db.content.findUnique({
      where: { id: legacy.id },
      select: { id: true },
    });
    if (exists) continue;

    if (!legacy.streamUrl) {
      console.warn(`Skipping legacy video ${legacy.id} (${legacy.title}) without streamUrl.`);
      continue;
    }

    const type = resolveContentType(legacy.title, legacy.category?.name);
    const releaseYear = legacy.createdAt.getUTCFullYear();
    const thumbnailUrl = legacy.thumbnailUrl ?? '';

    await db.$transaction(async (tx: any) => {
      const content = await tx.content.create({
        data: {
          id: legacy.id,
          title: legacy.title,
          description: legacy.description,
          type,
          thumbnailUrl,
          posterUrl: null,
          releaseYear,
          ageRating: 'NR',
          duration: legacy.duration,
          trailerId: null,
          categoryId: legacy.categoryId,
          isPublished: !!legacy.publishedAt,
        },
      });

      await tx.episode.create({
        data: {
          contentId: content.id,
          seasonId: null,
          episodeNumber: 1,
          title: legacy.title,
          description: legacy.description,
          duration: legacy.duration,
          videoUrl: legacy.streamUrl,
        },
      });
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
