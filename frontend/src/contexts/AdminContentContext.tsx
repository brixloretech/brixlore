"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { AdminVideo } from "@/types";
import { adminService, type AdminContentItemDto } from "@/lib/services";
import { USE_MOCK_API } from "@/lib/services/config";
import { getAdminVideos, updateAdminVideo } from "@/lib/mock-admin-content";

type AdminContentContextValue = {
  items: AdminContentItemDto[];
  loading: boolean;
  error: string | null;
  updateContent: (
    id: string,
    updates: Partial<
      Pick<
        AdminContentItemDto,
        "title" | "description" | "duration" | "category" | "isPublished"
      >
    >,
  ) => Promise<void>;
  publishContent: (id: string, isPublished: boolean) => Promise<void>;
  refresh: () => Promise<void>;
};

const AdminContentContext = createContext<AdminContentContextValue | null>(
  null,
);

function mapMockVideoToContent(item: AdminVideo): AdminContentItemDto {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    type: "MOVIE",
    thumbnailUrl: "",
    releaseYear: new Date().getFullYear(),
    ageRating: "NR",
    duration: item.duration,
    category: item.category,
    isPublished: item.published,
    hlsStatus: "ready",
    hlsReadyCount: 1,
    hlsTotalCount: 1,
    createdAt: item.createdAt,
  };
}

export function AdminContentProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<AdminContentItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (USE_MOCK_API) {
      setItems(getAdminVideos().map(mapMockVideoToContent));
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await adminService.getContent();
      setItems(list.filter((item) => item.type !== "TRAILER"));
    } catch (err) {
      setItems([]);
      setError(err instanceof Error ? err.message : "Failed to load content");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const updateContent = useCallback(
    async (
      id: string,
      updates: Partial<
        Pick<
          AdminContentItemDto,
          "title" | "description" | "duration" | "category" | "isPublished"
        >
      >,
    ) => {
      if (USE_MOCK_API) {
        updateAdminVideo(id, {
          title: updates.title,
          description: updates.description,
          duration: updates.duration,
          category: updates.category,
          published: updates.isPublished,
        });
        await refresh();
        return;
      }

      const updated = await adminService.updateContent(id, updates);
      if (updated) {
        setItems((prev) =>
          prev.map((item) => (item.id === id ? updated : item)),
        );
        return;
      }
      await refresh();
    },
    [refresh],
  );

  const publishContent = useCallback(
    async (id: string, isPublished: boolean) => {
      if (USE_MOCK_API) {
        updateAdminVideo(id, { published: isPublished });
        await refresh();
        return;
      }
      const updated = await adminService.publishContent(id, { isPublished });
      if (updated) {
        setItems((prev) =>
          prev.map((item) => (item.id === id ? updated : item)),
        );
        return;
      }
      await refresh();
    },
    [refresh],
  );

  const value: AdminContentContextValue = {
    items,
    loading,
    error,
    updateContent,
    publishContent,
    refresh,
  };

  return (
    <AdminContentContext.Provider value={value}>
      {children}
    </AdminContentContext.Provider>
  );
}

export function useAdminContent(): AdminContentContextValue {
  const ctx = useContext(AdminContentContext);
  if (ctx === null) {
    throw new Error(
      "useAdminContent must be used within an AdminContentProvider",
    );
  }
  return ctx;
}
