"use client";

import { useMyList } from "@/contexts";
import { useAuth } from "@/contexts";
import { cn } from "@/lib/utils";

type AddToMyListButtonProps = {
  contentId: string;
  /** Position on the card: top-right by default */
  className?: string;
  /** Size: sm (default), md */
  size?: "sm" | "md";
};

export function AddToMyListButton({
  contentId,
  className,
  size = "sm",
}: AddToMyListButtonProps) {
  const { toggle, isInList } = useMyList();
  const { isAuthenticated, isSubscribed, isAdmin } = useAuth();
  const isFreeUser = isAuthenticated && !isSubscribed && !isAdmin;
  const inList = isInList(contentId);

  if (isFreeUser) {
    return null;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(contentId);
  };

  const sizeClasses = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white transition hover:bg-white/20 hover:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/50",
        sizeClasses,
        className,
      )}
      aria-label={inList ? "Remove from My List" : "Add to My List"}
    >
      {inList ? (
        <svg
          className={iconSize}
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
        </svg>
      ) : (
        <svg
          className={iconSize}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      )}
    </button>
  );
}
