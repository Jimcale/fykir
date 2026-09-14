"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleNotch, faGift } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { Header } from "@/components/Header";
import { useAuth } from "@/lib/auth-context";
import { useReceivedGifts } from "@/lib/gifts-hooks";
import { formatMoney, timeAgo } from "@/lib/catalog";
import { giftIcon } from "@/lib/icons";
import { COLOR_BG, COLOR_TEXT } from "@/lib/catalog";

export default function ReceivedGiftsPage() {
  const { page, pageLoading } = useAuth();
  const { gifts, loading } = useReceivedGifts(page?.id ?? null);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-10">
        <h1 className="mb-1 font-display text-2xl font-bold">Received Gifts</h1>
        <p className="mb-6 text-sm text-muted">Surprises people have sent you.</p>

        {pageLoading ? (
          <FontAwesomeIcon icon={faCircleNotch} className="h-5 w-5 animate-spin text-muted" />
        ) : !page ? (
          <EmptyState
            title="Create your page to receive gifts"
            subtitle="Once you have a Fykir page, every surprise sent your way shows up here."
            cta
          />
        ) : loading ? (
          <FontAwesomeIcon icon={faCircleNotch} className="h-5 w-5 animate-spin text-muted" />
        ) : gifts.length === 0 ? (
          <EmptyState
            title="No gifts yet"
            subtitle="Share your page to start receiving surprises!"
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {gifts.map((g) => (
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
                    {g.category_title} · {formatMoney(g.amount, g.currency)}
                  </span>
                  <span className="block truncate text-xs text-muted">
                    From {g.sender_anonymous ? g.sender_label : g.sender_label} ·{" "}
                    {g.created_at ? timeAgo(g.created_at.toDate()) : "just now"}
                  </span>
                </span>
                {g.status === "redeemed" ? (
                  <span className="flex-shrink-0 rounded-full bg-green-soft px-2.5 py-1 text-[11px] font-bold text-green">
                    Redeemed
                  </span>
                ) : (
                  <span className="flex-shrink-0 rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-bold text-brand">
                    Redeem →
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function EmptyState({ title, subtitle, cta }: { title: string; subtitle: string; cta?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-14 text-center">
      <FontAwesomeIcon icon={faGift} className="h-8 w-8 text-muted" />
      <p className="font-display text-lg font-semibold">{title}</p>
      <p className="max-w-xs text-sm text-muted">{subtitle}</p>
      {cta && (
        <Link
          href="/create"
          className="mt-2 rounded-full bg-brand px-5 py-2.5 font-display text-sm font-semibold text-white"
        >
          Create Your Page
        </Link>
      )}
    </div>
  );
}
