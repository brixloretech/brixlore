"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

type SearchAndFilterProps = {
  categories: string[];
  selectedCategory: string | null;
};

export function SearchAndFilter({
  categories,
  selectedCategory,
}: SearchAndFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isFocusedRef = useRef(false);
  const cursorPositionRef = useRef<number | null>(null);

  // Track focus state
  const handleFocus = useCallback(() => {
    isFocusedRef.current = true;
  }, []);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    // Only lose focus if user clicked outside (not programmatic blur)
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    // If blur is caused by clicking the clear button, don't lose focus
    if (relatedTarget?.closest('button[aria-label="Clear search"]')) {
      e.preventDefault();
      inputRef.current?.focus();
      return;
    }
    isFocusedRef.current = false;
    cursorPositionRef.current = null;
  }, []);

  // Update URL using history API and router.replace with focus preservation
  const updateUrl = useCallback((query: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (query.trim()) {
      params.set("q", query.trim());
    } else {
      params.delete("q");
    }
    // Preserve category if selected
    if (selectedCategory && selectedCategory.toLowerCase() !== "all") {
      params.set("category", selectedCategory);
    } else {
      params.delete("category");
    }
    
    const newUrl = `/browse?${params.toString()}`;
    const wasFocused = isFocusedRef.current && document.activeElement === inputRef.current;
    const cursorPos = cursorPositionRef.current ?? (inputRef.current?.selectionStart ?? searchQuery.length);
    
    // Update URL and trigger refresh
    startTransition(() => {
      router.replace(newUrl, { scroll: false });
      
      // Aggressively restore focus after navigation
      if (wasFocused && inputRef.current) {
        // Multiple attempts to ensure focus is restored
        const restoreFocus = () => {
          if (inputRef.current && document.activeElement !== inputRef.current) {
            inputRef.current.focus();
            if (inputRef.current.setSelectionRange) {
              inputRef.current.setSelectionRange(cursorPos, cursorPos);
            }
          }
        };
        
        // Try immediately
        restoreFocus();
        // Try after a frame
        requestAnimationFrame(restoreFocus);
        // Try after a short delay
        setTimeout(restoreFocus, 0);
        setTimeout(restoreFocus, 10);
        setTimeout(restoreFocus, 50);
      }
    });
  }, [selectedCategory, router, searchParams, searchQuery]);

  // Debounced URL update
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Get initial query from URL on mount
    const urlQuery = searchParams.get("q") || "";
    if (searchQuery === urlQuery) {
      return; // No change needed
    }

    debounceTimerRef.current = setTimeout(() => {
      updateUrl(searchQuery);
    }, 400);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery, updateUrl, searchParams]);

  // Aggressively restore focus after any render if input was focused
  // Use useLayoutEffect for synchronous execution before paint
  useLayoutEffect(() => {
    if (isFocusedRef.current && inputRef.current) {
      const cursorPos = cursorPositionRef.current ?? inputRef.current.value.length;
      if (document.activeElement !== inputRef.current) {
        inputRef.current.focus();
        // Restore cursor position
        if (inputRef.current.setSelectionRange) {
          inputRef.current.setSelectionRange(cursorPos, cursorPos);
        }
      }
    }
  });

  // Also use useEffect as backup
  useEffect(() => {
    if (isFocusedRef.current && inputRef.current && document.activeElement !== inputRef.current) {
      const cursorPos = cursorPositionRef.current ?? inputRef.current.value.length;
      const restore = () => {
        if (inputRef.current && isFocusedRef.current) {
          inputRef.current.focus();
          if (inputRef.current.setSelectionRange) {
            inputRef.current.setSelectionRange(cursorPos, cursorPos);
          }
        }
      };
      restore();
      requestAnimationFrame(restore);
      setTimeout(restore, 0);
    }
  });

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart ?? value.length;
    
    setSearchQuery(value);
    cursorPositionRef.current = cursorPos;
    isFocusedRef.current = true;
    
    // Immediately restore focus and cursor position
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        if (inputRef.current.setSelectionRange) {
          inputRef.current.setSelectionRange(cursorPos, cursorPos);
        }
      }
    });
  }, []);

  const handleSearchClear = useCallback(() => {
    setSearchQuery("");
    cursorPositionRef.current = 0;
    isFocusedRef.current = true;
    // Focus input after clearing
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      if (inputRef.current?.setSelectionRange) {
        inputRef.current.setSelectionRange(0, 0);
      }
    });
  }, []);

  const handleCategoryChange = (category: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (category.toLowerCase() === "all") {
      params.delete("category");
    } else {
      params.set("category", category);
    }
    // Preserve search query if present
    const q = searchParams.get("q");
    if (q) {
      params.set("q", q);
    }
    startTransition(() => {
      router.push(`/browse?${params.toString()}`);
    });
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
      {/* Search Bar */}
      <div className="relative flex-1">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search content..."
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={cn(
              "w-full rounded-lg border border-white/10 bg-white/5 px-10 py-2.5 text-sm text-white placeholder:text-white/40",
              "transition-colors focus:border-white/30 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
            disabled={isPending}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleSearchClear}
              onMouseDown={(e) => {
                // Prevent input blur when clicking clear button
                e.preventDefault();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
              aria-label="Clear search"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Category Dropdown */}
      <div className="relative">
        <select
          value={selectedCategory || "all"}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className={cn(
            "w-full min-w-[140px] rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 pr-10 text-sm text-white",
            "transition-colors focus:border-white/30 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            selectedCategory && selectedCategory.toLowerCase() !== "all"
              ? "border-white/30 bg-white/10 text-white"
              : "",
            "appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23f5f7fb%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.5em_1.5em] bg-[right_0.75rem_center] bg-no-repeat"
          )}
          disabled={isPending}
        >
          {categories.map((category) => {
            const isSelected = 
              (category.toLowerCase() === "all" && (!selectedCategory || selectedCategory.toLowerCase() === "all")) ||
              (selectedCategory && category.toLowerCase() === selectedCategory.toLowerCase());
            return (
              <option
                key={category}
                value={category.toLowerCase() === "all" ? "all" : category}
                className={cn(
                  "bg-[#0b0b0e]",
                  isSelected ? "text-white font-medium" : "text-white/80"
                )}
              >
                {category}
              </option>
            );
          })}
        </select>
      </div>
    </div>
  );
}
