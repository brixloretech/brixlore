"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const MY_LIST_STORAGE_KEY = "brixlore-my-list";

function loadIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MY_LIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

function saveIds(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MY_LIST_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

type MyListContextValue = {
  /** Content IDs in the user's list */
  listIds: string[];
  /** Add content ID to list */
  add: (contentId: string) => void;
  /** Remove content ID from list */
  remove: (contentId: string) => void;
  /** Toggle content ID in list */
  toggle: (contentId: string) => void;
  /** Whether content ID is in list */
  isInList: (contentId: string) => boolean;
};

const MyListContext = createContext<MyListContextValue | null>(null);

export function MyListProvider({ children }: { children: ReactNode }) {
  const [listIds, setListIds] = useState<string[]>([]);

  useEffect(() => {
    setListIds(loadIds());
  }, []);

  const add = useCallback((contentId: string) => {
    const id = String(contentId).trim();
    if (!id) return;
    setListIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      saveIds(next);
      return next;
    });
  }, []);

  const remove = useCallback((contentId: string) => {
    const id = String(contentId).trim();
    setListIds((prev) => {
      const next = prev.filter((x) => x !== id);
      saveIds(next);
      return next;
    });
  }, []);

  const toggle = useCallback((contentId: string) => {
    const id = String(contentId).trim();
    setListIds((prev) => {
      const has = prev.includes(id);
      const next = has ? prev.filter((x) => x !== id) : [...prev, id];
      saveIds(next);
      return next;
    });
  }, []);

  const isInList = useCallback(
    (contentId: string) => listIds.includes(String(contentId).trim()),
    [listIds]
  );

  const value: MyListContextValue = {
    listIds,
    add,
    remove,
    toggle,
    isInList,
  };

  return (
    <MyListContext.Provider value={value}>{children}</MyListContext.Provider>
  );
}

export function useMyList(): MyListContextValue {
  const ctx = useContext(MyListContext);
  if (!ctx) {
    return {
      listIds: [],
      add: () => {},
      remove: () => {},
      toggle: () => {},
      isInList: () => false,
    };
  }
  return ctx;
}
