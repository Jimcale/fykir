"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { CountryDropdown } from "@/components/CountryDropdown";
import { AvatarMenu } from "@/components/AvatarMenu";
import { sounds } from "@/lib/sounds";

export function Header() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-surface px-3 sm:px-5">
        <div className="flex items-center gap-2">
          <button
            aria-label="Open menu"
            onClick={() => {
              sounds.tap();
              setSidebarOpen(true);
            }}
            className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-surface-2"
          >
            <FontAwesomeIcon icon={faBars} className="h-[18px] w-[18px]" />
          </button>
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icon.png"
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 flex-shrink-0 rounded-[10px] shadow-[0_2px_6px_oklch(70%_0.2_25_/_0.35)]"
            />
            <span className="font-display text-lg font-semibold sm:text-xl">Fykir</span>
          </Link>
        </div>
        <div className="flex items-center gap-2.5">
          <CountryDropdown />
          <AvatarMenu />
        </div>
      </header>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
  );
}
