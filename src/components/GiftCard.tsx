"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faPaperPlane, faPlus } from "@fortawesome/free-solid-svg-icons";
import { giftIcon } from "@/lib/icons";
import { COLOR_BG, COLOR_TEXT, formatMoney } from "@/lib/catalog";
import type { GiftCategory } from "@/lib/types";

export function GiftCard({
  category,
  minAmount,
  currency = "KES",
  onSend,
  showAddToPage,
  added,
  onAddToPage,
}: {
  category: GiftCategory;
  minAmount?: number;
  currency?: string;
  onSend: () => void;
  showAddToPage?: boolean;
  added?: boolean;
  onAddToPage?: () => void;
}) {
  const floor = minAmount ?? category.min_amount;

  return (
    <div className="flex flex-col overflow-hidden rounded-[18px] border border-border bg-surface transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div
        className={`flex h-24 items-center justify-center ${COLOR_BG[category.color_key]}`}
      >
        <FontAwesomeIcon
          icon={giftIcon(category.icon)}
          className={`h-8 w-8 ${COLOR_TEXT[category.color_key]}`}
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="font-display text-[13px] font-semibold">{category.title}</p>
        <p className="text-sm font-extrabold">
          From <span className={COLOR_TEXT[category.color_key]}>{formatMoney(floor, currency)}</span>
        </p>
        <div className="mt-auto flex gap-1.5 pt-1">
          <button
            onClick={onSend}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-ink px-2 py-2 font-display text-[13px] font-semibold text-white transition-transform active:scale-95"
          >
            <FontAwesomeIcon icon={faPaperPlane} className="h-3 w-3" />
            Send
          </button>
          {showAddToPage && (
            <button
              onClick={onAddToPage}
              disabled={added}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-border px-2 py-2 font-display text-[13px] font-semibold transition-transform active:scale-95 disabled:opacity-60"
            >
              <FontAwesomeIcon icon={added ? faCheck : faPlus} className="h-3 w-3" />
              {added ? "Added" : "Add"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
