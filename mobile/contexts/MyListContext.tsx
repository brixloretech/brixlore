import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MY_LIST_STORAGE_KEY = 'brixlore-my-list';

async function loadIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(MY_LIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === 'string')
      : [];
  } catch {
    return [];
  }
}

async function saveIds(ids: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(MY_LIST_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

type MyListContextValue = {
  /** Content IDs in the user's list */
  listIds: string[];
  /** Add content ID to list */
  add: (contentId: string) => Promise<void>;
  /** Remove content ID from list */
  remove: (contentId: string) => Promise<void>;
  /** Toggle content ID in list */
  toggle: (contentId: string) => Promise<void>;
  /** Whether content ID is in list */
  isInList: (contentId: string) => boolean;
  /** Refresh list from storage */
  refresh: () => Promise<void>;
};

const MyListContext = createContext<MyListContextValue | null>(null);

export function MyListProvider({ children }: { children: ReactNode }) {
  const [listIds, setListIds] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const refresh = useCallback(async () => {
    const ids = await loadIds();
    setListIds(ids);
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = useCallback(async (contentId: string) => {
    const id = String(contentId).trim();
    if (!id) return;
    setListIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      saveIds(next);
      return next;
    });
  }, []);

  const remove = useCallback(async (contentId: string) => {
    const id = String(contentId).trim();
    setListIds((prev) => {
      const next = prev.filter((x) => x !== id);
      saveIds(next);
      return next;
    });
  }, []);

  const toggle = useCallback(async (contentId: string) => {
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
    refresh,
  };

  if (!isInitialized) {
    return null; // or a loading indicator
  }

  return (
    <MyListContext.Provider value={value}>{children}</MyListContext.Provider>
  );
}

export function useMyList(): MyListContextValue {
  const ctx = useContext(MyListContext);
  if (!ctx) {
    return {
      listIds: [],
      add: async () => {},
      remove: async () => {},
      toggle: async () => {},
      isInList: () => false,
      refresh: async () => {},
    };
  }
  return ctx;
}
