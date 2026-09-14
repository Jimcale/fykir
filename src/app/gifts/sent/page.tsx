"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faCircleNotch,
  faEye,
  faLink,
  faPaperPlane,
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { Header } from "@/components/Header";
import { useAuth } from "@/lib/auth-context";
import { useSentGifts } from "@/lib/gifts-hooks";
import { COLOR_BG, COLOR_TEXT, formatMoney, timeAgo } from "@/lib/catalog";
import { giftIcon } from "@/lib/icons";

const STATUS_LABEL: Record<string, { text: string; className: string; icon: typeof faLink }> = {
  informed: { text: "Not opened yet", className: "text-muted", icon: faLink },
  opened: { text: "Opened, not redeemed", className: "text-[oklch(55%_0.14_85)]", icon: faEye },
  redeemed: { text: "Redeemed", className: "text-green", icon: faCircleCheck },
};

export default function SentGiftsPage() {
  const { user } = useAuth();
  const { gifts, loading } = useSentGifts(user?.uid ?? null);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-10">
        <h1 className="mb-1 font-display text-2xl font-bold">Sent Gifts</h1>
        <p className="mb-6 text-sm text-muted">Surprises you&apos;ve sent, and their status.</p>

        {loading ? (
          <FontAwesomeIcon icon={faCircleNotch} className="h-5 w-5 animate-spin text-muted" />
        ) : gifts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-14 text-center">
            <FontAwesomeIcon icon={faPaperPlane} className="h-8 w-8 text-muted" />
            <p className="font-display text-lg font-semibold">You haven&apos;t sent any gifts yet.</p>
            <Link href="/" className="mt-2 rounded-full bg-brand px-5 py-2.5 font-display text-sm font-semibold text-white">
              Find someone to surprise
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {gifts.map((g) => {
              const status = STATUS_LABEL[g.status];
              return (
                <Link
                  key={g.id}
                  href={`/reveal/${g.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3.5 hover:bg-surface-2"
                >
                  <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${COLOR_BG[g.category_color]}`}>
                    <FontAwesomeIcon icon={giftIcon(g.category_icon)} className={`h-4 w-4 ${COLOR_TEXT[g.category_color]}`} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">
                      {g.category_title} · {formatMoney(g.amount, g.currency)} to {g.receiver_display_name}
                    </span>
                    <span className="block truncate text-xs text-muted">
                      {g.created_at ? timeAgo(g.created_at.toDate()) : "just now"}
                    </span>
                  </span>
                  <span className={`flex flex-shrink-0 items-center gap-1.5 text-xs font-bold ${status.className}`}>
                    <FontAwesomeIcon icon={status.icon} className="h-3.5 w-3.5" />
                    {status.text}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
