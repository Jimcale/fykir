"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBoxOpen, faGift, faIdCard, faStore, faUsers, faWallet } from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  getAggregateFromServer,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  sum,
  count,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import Link from "next/link";
import { giftCategoriesCol, giftsCol, pagesCol, partnersCol, usersCol } from "@/lib/firebase/collections";
import { COLOR_BG, COLOR_TEXT, formatMoney, timeAgo } from "@/lib/catalog";
import { giftIcon } from "@/lib/icons";
import type { ColorKey, Gift, Page } from "@/lib/types";

interface Stats {
  totalGifts: number;
  totalVolume: number;
  totalPages: number;
  totalPartners: number;
  totalCategories: number;
  totalUsers: number;
  informed: number;
  opened: number;
  redemptionRequested: number;
  redeemed: number;
}

export function DashboardTab() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentGifts, setRecentGifts] = useState<Gift[]>([]);
  const [recentPages, setRecentPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [giftsAgg, pagesCount, partnersCount, categoriesCount, usersCount, giftsSnap, pagesSnap] =
        await Promise.all([
          getAggregateFromServer(giftsCol, { total: count(), volume: sum("amount") }),
          getCountFromServer(pagesCol),
          getCountFromServer(partnersCol),
          getCountFromServer(giftCategoriesCol),
          getCountFromServer(usersCol),
          getDocs(query(giftsCol, orderBy("created_at", "desc"), limit(8))),
          getDocs(query(pagesCol, orderBy("created_at", "desc"), limit(5))),
        ]);

      setRecentGifts(giftsSnap.docs.map((d) => d.data()));
      setRecentPages(pagesSnap.docs.map((d) => d.data()));

      const [informedAgg, openedAgg, redemptionRequestedAgg, redeemedAgg] = await Promise.all(
        (["informed", "opened", "redemption_requested", "redeemed"] as const).map((status) =>
          getCountFromServer(query(giftsCol, where("status", "==", status)))
        )
      );

      setStats({
        totalGifts: giftsAgg.data().total,
        totalVolume: giftsAgg.data().volume ?? 0,
        totalPages: pagesCount.data().count,
        totalPartners: partnersCount.data().count,
        totalCategories: categoriesCount.data().count,
        totalUsers: usersCount.data().count,
        informed: informedAgg.data().count,
        opened: openedAgg.data().count,
        redemptionRequested: redemptionRequestedAgg.data().count,
        redeemed: redeemedAgg.data().count,
      });
      setLoading(false);
    }
    load();
  }, []);

  if (loading || !stats) {
    return <p className="py-10 text-center text-sm text-muted">Loading dashboard…</p>;
  }

  const cards: { label: string; value: string; icon: IconDefinition; color: ColorKey }[] = [
    { label: "Total gifts sent", value: stats.totalGifts.toLocaleString(), icon: faGift, color: "brand" },
    { label: "Gift volume", value: formatMoney(stats.totalVolume), icon: faWallet, color: "green" },
    { label: "User pages", value: stats.totalPages.toLocaleString(), icon: faIdCard, color: "violet" },
    { label: "Partners", value: stats.totalPartners.toLocaleString(), icon: faStore, color: "teal" },
    { label: "Registered users", value: stats.totalUsers.toLocaleString(), icon: faUsers, color: "orange" },
    { label: "Categories", value: stats.totalCategories.toLocaleString(), icon: faBoxOpen, color: "pink" },
  ];

  return (
    <div>
      <div className="mb-2">
        <h1 className="font-display text-xl font-bold sm:text-2xl">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">A live snapshot of the whole app.</p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border bg-surface p-4">
            <span className={`mb-2 flex h-9 w-9 items-center justify-center rounded-xl ${COLOR_BG[c.color]}`}>
              <FontAwesomeIcon icon={c.icon} className={`h-4 w-4 ${COLOR_TEXT[c.color]}`} />
            </span>
            <p className="font-display text-lg font-bold">{c.value}</p>
            <p className="text-xs text-muted">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatusBar label="Informed" value={stats.informed} total={stats.totalGifts} color="--yellow" />
        <StatusBar label="Opened" value={stats.opened} total={stats.totalGifts} color="--teal" />
        <StatusBar
          label="Pending confirmation"
          value={stats.redemptionRequested}
          total={stats.totalGifts}
          color="--orange"
        />
        <StatusBar label="Redeemed" value={stats.redeemed} total={stats.totalGifts} color="--green" />
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 font-display text-base font-bold">Recent gifts</h2>
          <div className="flex flex-col gap-2">
            {recentGifts.length === 0 && <p className="text-sm text-muted">No gifts yet.</p>}
            {recentGifts.map((g) => (
              <div key={g.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
                <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${COLOR_BG[g.category_color]}`}>
                  <FontAwesomeIcon icon={giftIcon(g.category_icon)} className={`h-3.5 w-3.5 ${COLOR_TEXT[g.category_color]}`} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold">
                    {g.sender_label} → @{g.receiver_username}
                  </p>
                  <p className="text-[11px] text-muted">
                    {formatMoney(g.amount, g.currency)} · {g.created_at ? timeAgo(g.created_at.toDate()) : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-3 font-display text-base font-bold">New pages</h2>
          <div className="flex flex-col gap-2">
            {recentPages.length === 0 && <p className="text-sm text-muted">No pages yet.</p>}
            {recentPages.map((p) => (
              <Link
                key={p.id}
                href={`/p/${p.username}`}
                target="_blank"
                className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 hover:bg-surface-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold">{p.display_name}</p>
                  <p className="text-[11px] text-muted">
                    @{p.username} · {p.created_at ? timeAgo(p.created_at.toDate()) : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="rounded-2xl border border-border bg-surface p-3.5">
      <div className="mb-1.5 flex items-center justify-between text-xs font-bold">
        <span>{label}</span>
        <span className="text-muted">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: `var(${color})` }} />
      </div>
    </div>
  );
}
