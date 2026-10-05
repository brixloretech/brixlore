"use client";

import { useMyList } from "@/contexts";

type FavoriteButtonProps = {
  contentId: string;
};

/** Favorite control for the movie cards, using the card's original styling. */
export function FavoriteButton({ contentId }: FavoriteButtonProps) {
  const { toggle, isInList } = useMyList();
  const inList = isInList(contentId);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    toggle(contentId);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={inList ? "Remove from My List" : "Add to My List"}
      aria-pressed={inList}
      className="flex items-center justify-center text-white bg-white/30 rounded-full w-[30px] h-[30px] transition-all duration-300 ease-in-out hover:bg-primary hover:text-white"
    >
      <i className={inList ? "ri-heart-fill" : "ri-heart-line"} />
    </button>
  );
}
