import type { AdminVideo } from "@/types";

const STORAGE_KEY = "mockAdminVideos";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

/** Read all admin videos from localStorage. */
export function getAdminVideos(): AdminVideo[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data.filter(
      (item): item is AdminVideo =>
        item &&
        typeof item === "object" &&
        "id" in item &&
        "title" in item &&
        "duration" in item &&
        "published" in item &&
        "createdAt" in item,
    );
  } catch {
    return [];
  }
}

/** Write admin videos to localStorage. */
export function setAdminVideos(videos: AdminVideo[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(videos));
}

/** Create a new admin video (metadata only). Returns the created video. */
export function createAdminVideo(metadata: {
  title: string;
  duration: string;
  description?: string;
  category?: string;
}): AdminVideo {
  const video: AdminVideo = {
    id: generateId(),
    title: metadata.title.trim(),
    duration: metadata.duration.trim(),
    description: metadata.description?.trim() || undefined,
    category: metadata.category?.trim() || undefined,
    published: false,
    createdAt: new Date().toISOString(),
  };
  const list = getAdminVideos();
  list.unshift(video);
  setAdminVideos(list);
  return video;
}

/** Update an admin video (e.g. publish/unpublish). */
export function updateAdminVideo(
  id: string,
  updates: Partial<
    Pick<
      AdminVideo,
      "published" | "title" | "duration" | "description" | "category"
    >
  >,
): AdminVideo | null {
  const list = getAdminVideos();
  const index = list.findIndex((v) => v.id === id);
  if (index === -1) return null;
  list[index] = { ...list[index], ...updates };
  setAdminVideos(list);
  return list[index];
}
