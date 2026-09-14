"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faUser } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";
import { recentOrRandomPages, searchPages } from "@/lib/search-pages";
import { loadRecentSearches, pushRecentSearch } from "@/lib/local";
import { initials } from "@/lib/catalog";
import type { Page } from "@/lib/types";

export function SearchResults({
  onSelect,
  autoFocus = true,
}: {
  onSelect: (page: Page) => void;
  autoFocus?: boolean;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Page[]>([]);
  const [heading, setHeading] = useState("Recently searched");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function run() {
      if (!q.trim()) {
        const recent = loadRecentSearches();
        if (recent.length > 0) {
          setHeading("Recently searched");
          const pages = await Promise.all(
            recent.map(async (r) => {
              const list = await searchPages(r.username);
              return list.find((p) => p.username === r.username) ?? null;
            })
          );
          if (!cancelled) setResults(pages.filter((p): p is Page => !!p));
        } else {
          setHeading("Discover people to surprise");
          const fallback = await recentOrRandomPages();
          if (!cancelled) setResults(fallback);
        }
      } else {
        setHeading("Results");
        const found = await searchPages(q);
        if (!cancelled) setResults(found);
      }
      if (!cancelled) setLoading(false);
    }

    const t = setTimeout(run, q ? 220 : 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q]);

  function select(page: Page) {
    pushRecentSearch({
      username: page.username,
      display_name: page.display_name,
      avatar_url: page.avatar_url,
      accent_color: page.accent_color,
    });
    onSelect(page);
  }

  return (
    <div>
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-bg px-3.5 py-2.5">
        <FontAwesomeIcon icon={faMagnifyingGlass} className="h-4 w-4 text-muted" />
        <input
          autoFocus={autoFocus}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by username or name"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
        />
      </div>

      <p className="mt-4 mb-2 px-0.5 text-xs font-bold uppercase tracking-wide text-muted">
        {heading}
      </p>

      <div className="flex flex-col gap-1">
        {loading && (
          <p className="px-1 py-6 text-center text-sm text-muted">Searching…</p>
        )}
        {!loading && results.length === 0 && (
          <p className="px-1 py-6 text-center text-sm text-muted">
            No one found. Check the spelling, or invite them to create a Fykir
            page.
          </p>
        )}
        {!loading &&
          results.map((page) => (
            <button
              key={page.id}
              onClick={() => select(page)}
              className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-surface-2"
            >
              <span
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full font-display text-[13px] font-semibold text-white"
                style={{
                  background: page.avatar_url
                    ? undefined
                    : `linear-gradient(135deg, ${page.cover_gradient?.[0] ?? page.accent_color}, ${page.cover_gradient?.[1] ?? page.accent_color})`,
                }}
              >
                {page.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={page.avatar_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials(page.display_name)
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-bold">
                  {page.display_name}
                </span>
                <span className="block truncate text-[11px] text-muted">
                  @{page.username}
                </span>
              </span>
              <FontAwesomeIcon icon={faUser} className="h-3.5 w-3.5 text-muted" />
            </button>
          ))}
      </div>
    </div>
  );
}
