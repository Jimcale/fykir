"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowUpFromBracket,
  faCircleNotch,
  faPenToSquare,
} from "@fortawesome/free-solid-svg-icons";
import { getDoc } from "firebase/firestore";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { GiftCard } from "@/components/GiftCard";
import { SharePopup } from "@/components/SharePopup";
import { useAuth } from "@/lib/auth-context";
import { useGiftCategories } from "@/lib/data-hooks";
import { pageRef } from "@/lib/firebase/collections";
import { useSendFlow } from "@/lib/send-flow-context";
import { useSettings } from "@/lib/settings-context";
import { initials } from "@/lib/catalog";
import { sounds } from "@/lib/sounds";
import type { Page } from "@/lib/types";

export default function PublicPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const [page, setPage] = useState<Page | null | undefined>(undefined);
  const [shareOpen, setShareOpen] = useState(false);
  const { categories } = useGiftCategories();
  const { open } = useSendFlow();
  const { user } = useAuth();
  const { countries } = useSettings();

  useEffect(() => {
    getDoc(pageRef(username)).then((snap) => setPage(snap.exists() ? snap.data() : null));
  }, [username]);

  const isOwner = !!user && !!page && user.uid === page.owner_uid;

  if (page === undefined) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <FontAwesomeIcon icon={faCircleNotch} className="h-6 w-6 animate-spin text-muted" />
        </div>
      </div>
    );
  }

  if (page === null) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-5 text-center">
          <p className="font-display text-xl font-bold">Page not found</p>
          <p className="text-sm text-muted">@{username} doesn&apos;t have a Fykir page yet.</p>
        </div>
      </div>
    );
  }

  const featuredCategories = page.featured
    .map((f) => ({ f, category: categories.find((c) => c.id === f.category_id) }))
    .filter((x): x is { f: typeof page.featured[number]; category: NonNullable<typeof x.category> } => !!x.category);

  const pageCurrency =
    countries.find((c) => c.code === page.country_code)?.currency ?? countries[0]?.currency;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div
          className="relative h-40 w-full sm:h-52"
          style={{
            background: page.cover_url
              ? undefined
              : `linear-gradient(135deg, ${page.cover_gradient?.[0] ?? page.accent_color}, ${page.cover_gradient?.[1] ?? page.accent_color})`,
          }}
        >
          {page.cover_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={page.cover_url} alt="" className="h-full w-full object-cover" />
          )}
        </div>

        <div className="relative mx-auto max-w-2xl px-5">
          <div
            className="absolute -top-10 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-bg font-display text-2xl font-semibold text-white"
            style={{
              background: page.avatar_url
                ? undefined
                : `linear-gradient(135deg, ${page.cover_gradient?.[0] ?? page.accent_color}, ${page.cover_gradient?.[1] ?? page.accent_color})`,
            }}
          >
            {page.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={page.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              initials(page.display_name)
            )}
          </div>

          <div className="pt-14 pb-8">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="truncate font-display text-2xl font-bold">{page.display_name}</h1>
                <p className="truncate text-sm text-muted">@{page.username}</p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-2">
                <button
                  onClick={() => {
                    sounds.tap();
                    setShareOpen(true);
                  }}
                  className="flex h-9 items-center gap-1.5 rounded-full border border-border px-3.5 text-xs font-bold hover:bg-surface-2"
                >
                  <FontAwesomeIcon icon={faArrowUpFromBracket} className="h-3 w-3" />
                  Share
                </button>
                {isOwner && (
                  <Link
                    href={`/p/${page.username}/edit`}
                    onClick={() => sounds.tap()}
                    className="flex h-9 items-center gap-1.5 rounded-full border border-border px-3.5 text-xs font-bold hover:bg-surface-2"
                  >
                    <FontAwesomeIcon icon={faPenToSquare} className="h-3 w-3" />
                    Edit
                  </Link>
                )}
              </div>
            </div>
            {page.bio && <p className="mt-3 max-w-md text-sm">{page.bio}</p>}
          </div>

          {featuredCategories.length === 0 ? (
            <p className="pb-14 text-sm text-muted">
              {page.display_name.split(" ")[0]} hasn&apos;t featured any surprises yet — send from
              the full catalog on the homepage instead.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 pb-14 sm:grid-cols-3">
              {featuredCategories.map(({ f, category }) => (
                <GiftCard
                  key={category.id}
                  category={category}
                  minAmount={f.min_amount}
                  currency={pageCurrency}
                  onSend={() => open({ category, recipient: page })}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <SharePopup
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        url={typeof window !== "undefined" ? `${window.location.origin}/p/${page.username}` : ""}
        text={`Check out ${page.display_name}'s Fykir page — send them a surprise! 🎁`}
      />
    </div>
  );
}
