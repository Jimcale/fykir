"use client";

import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRightFromBracket,
  faGift,
  faInbox,
  faPaperPlane,
  faShieldHalved,
  faUser,
  faUserShield,
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { useState } from "react";
import { ProtectPagePopup } from "@/components/ProtectPagePopup";
import { useAuth } from "@/lib/auth-context";
import { signOutUser } from "@/lib/firebase/auth";
import { useReceivedGifts, useSentGifts } from "@/lib/gifts-hooks";
import { useSendFlow } from "@/lib/send-flow-context";
import { useSettings } from "@/lib/settings-context";
import { initials } from "@/lib/catalog";
import { sounds } from "@/lib/sounds";

export function AvatarMenu() {
  const { user, page, pageLoading, isStaff } = useAuth();
  const { isSupportedCountry } = useSettings();
  const { open: openSendFlow } = useSendFlow();
  const { gifts: receivedGifts } = useReceivedGifts(page?.id ?? null);
  const { gifts: sentGifts } = useSentGifts(user?.uid ?? null);
  const unopened = receivedGifts.filter((g) => g.status === "informed").length;
  const unseenThanks = sentGifts.filter((g) => g.thank_you && !g.thank_you.seen).length;
  const totalBadge = unopened + unseenThanks;
  const [protectOpen, setProtectOpen] = useState(false);
  const showProtect = !!page && !!user?.isAnonymous;
  const showLogout = !!user && !user.isAnonymous;

  function handleLogout() {
    sounds.tap();
    signOutUser().catch(() => {});
  }

  if (!pageLoading && !page && !isStaff) {
    if (!isSupportedCountry) {
      return (
        <button
          onClick={() => {
            sounds.tap();
            openSendFlow();
          }}
          className="rounded-full bg-brand px-4 py-2 font-display text-sm font-semibold text-white shadow-[0_6px_16px_-6px_var(--brand)]"
        >
          Send A Gift
        </button>
      );
    }
    return (
      <Link
        href="/create"
        onClick={() => sounds.tap()}
        className="rounded-full bg-brand px-4 py-2 font-display text-sm font-semibold text-white shadow-[0_6px_16px_-6px_var(--brand)]"
      >
        Create Your Page
      </Link>
    );
  }

  return (
    <Menu as="div" className="relative">
      <MenuButton aria-label="Account menu" className="relative flex items-center">
        <span
          className="flex h-[34px] w-[34px] items-center justify-center overflow-hidden rounded-full border-2 border-surface font-display text-[13px] font-semibold text-white shadow-[0_0_0_1.5px_var(--border)]"
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
            initials(page?.display_name ?? "You")
          )}
        </span>
        {totalBadge > 0 && (
          <span className="animate-badge-pulse absolute -right-1 -top-1 flex h-[15px] min-w-[15px] items-center justify-center rounded-full border-2 border-surface bg-red px-[3px] text-[9px] font-extrabold text-white">
            {totalBadge}
          </span>
        )}
      </MenuButton>
      <MenuItems
        anchor={{ to: "bottom end", gap: 8 }}
        className="z-30 w-64 origin-top-right rounded-2xl border border-border bg-surface p-1.5 shadow-xl animate-pop-in"
      >
        <div className="flex items-center gap-3 border-b border-border px-3 py-3">
          <span
            className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full font-display text-[13px] font-semibold text-white"
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
              initials(page?.display_name ?? "You")
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{page?.display_name ?? "Fykir staff"}</p>
            <p className="truncate text-xs text-muted">{page ? `@${page.username}` : user?.email}</p>
          </div>
        </div>
        {page && (
          <div className="py-1.5">
            <MenuItemLink href="/gifts/received" icon={faInbox} label="Received Gifts" badge={unopened} />
            <MenuItemLink href="/gifts/sent" icon={faPaperPlane} label="Sent Gifts" badge={unseenThanks} />
            <MenuItemLink href={`/p/${page.username}`} icon={faUser} label="Your Page" />
          </div>
        )}
        {isStaff && (
          <div className="border-t border-border py-1.5">
            <MenuItemLink href="/admin" icon={faUserShield} label="Admin Panel" />
          </div>
        )}
        {(showProtect || showLogout) && (
          <div className="border-t border-border py-1.5">
            {showProtect && (
              <MenuItem>
                {({ focus }) => (
                  <button
                    onClick={() => {
                      sounds.tap();
                      setProtectOpen(true);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold ${
                      focus ? "bg-surface-2" : ""
                    }`}
                  >
                    <FontAwesomeIcon icon={faShieldHalved} className="h-4 w-4 text-muted" />
                    <span className="flex-1">Protect Your Page</span>
                  </button>
                )}
              </MenuItem>
            )}
            {showLogout && (
              <MenuItem>
                {({ focus }) => (
                  <button
                    onClick={handleLogout}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-brand ${
                      focus ? "bg-brand-soft" : ""
                    }`}
                  >
                    <FontAwesomeIcon icon={faArrowRightFromBracket} className="h-4 w-4" />
                    <span className="flex-1">Log Out</span>
                  </button>
                )}
              </MenuItem>
            )}
          </div>
        )}
      </MenuItems>
      <ProtectPagePopup open={protectOpen} onClose={() => setProtectOpen(false)} />
    </Menu>
  );
}

function MenuItemLink({
  href,
  icon,
  label,
  badge,
}: {
  href: string;
  icon: typeof faGift;
  label: string;
  badge?: number;
}) {
  return (
    <MenuItem>
      {({ focus }) => (
        <Link
          href={href}
          onClick={() => sounds.tap()}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${
            focus ? "bg-surface-2" : ""
          }`}
        >
          <FontAwesomeIcon icon={icon} className="h-4 w-4 text-muted" />
          <span className="flex-1">{label}</span>
          {!!badge && (
            <span className="rounded-full bg-brand-soft px-1.5 py-0.5 text-[10px] font-bold text-brand">
              {badge}
            </span>
          )}
        </Link>
      )}
    </MenuItem>
  );
}
