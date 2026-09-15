"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faBoxOpen,
  faGaugeHigh,
  faGears,
  faGift,
  faIdCard,
  faStore,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { initials } from "@/lib/catalog";
import { sounds } from "@/lib/sounds";

export const ADMIN_TABS = [
  { id: "dashboard", label: "Dashboard", icon: faGaugeHigh },
  { id: "categories", label: "Gift Categories", icon: faGift },
  { id: "partners", label: "Partners", icon: faStore },
  { id: "users", label: "Users", icon: faUsers },
  { id: "pages", label: "User Pages", icon: faIdCard },
  { id: "gifts", label: "Gifts", icon: faBoxOpen },
  { id: "settings", label: "Settings", icon: faGears },
] as const;

export type AdminTabId = (typeof ADMIN_TABS)[number]["id"];

export function AdminShell({
  active,
  onChange,
  children,
}: {
  active: AdminTabId;
  onChange: (tab: AdminTabId) => void;
  children: ReactNode;
}) {
  const { page, isAdmin } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-surface px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            onClick={() => sounds.tap()}
            aria-label="Back to site"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border hover:bg-surface-2"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="h-3.5 w-3.5" />
          </Link>
          <div>
            <p className="font-display text-base font-bold leading-none">Fykir Admin</p>
            <p className="mt-1 text-[11px] text-muted">Manage the whole app from here</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
              isAdmin ? "bg-violet-soft text-violet" : "bg-teal-soft text-teal"
            }`}
          >
            {isAdmin ? "Admin" : "Staff"}
          </span>
          <span
            className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full font-display text-[11px] font-semibold text-white"
            style={{
              background: page?.avatar_url
                ? undefined
                : `linear-gradient(135deg, ${page?.cover_gradient?.[0] ?? "#7c5cff"}, ${page?.cover_gradient?.[1] ?? "#e8407a"})`,
            }}
          >
            {page?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={page.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              initials(page?.display_name ?? "A")
            )}
          </span>
        </div>
      </header>

      <div className="sticky top-16 z-10 overflow-x-auto border-b border-border bg-surface px-4 sm:px-6">
        <div className="flex gap-1 py-2">
          {ADMIN_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                sounds.tap();
                onChange(tab.id);
              }}
              className={`flex flex-shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors ${
                active === tab.id ? "bg-ink text-white" : "text-muted hover:bg-surface-2"
              }`}
            >
              <FontAwesomeIcon icon={tab.icon} className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
