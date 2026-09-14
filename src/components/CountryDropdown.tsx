"use client";

import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { useSettings } from "@/lib/settings-context";
import { sounds } from "@/lib/sounds";

export function CountryDropdown() {
  const { countries, country, setCountryCode } = useSettings();

  return (
    <Menu as="div" className="relative">
      <MenuButton className="flex items-center gap-1 rounded-full bg-surface-2 px-2 py-1.5 transition-colors hover:bg-border/60">
        <span className="text-sm">{country.flag}</span>
        <span className="text-xs font-bold">{country.code}</span>
        <FontAwesomeIcon icon={faChevronDown} className="h-2.5 w-2.5 text-muted" />
      </MenuButton>
      <MenuItems
        anchor={{ to: "bottom end", gap: 8 }}
        className="z-30 w-56 origin-top-right rounded-2xl border border-border bg-surface p-1.5 shadow-xl animate-pop-in"
      >
        {countries.map((c) => (
          <MenuItem key={c.code} disabled={c.status === "coming_soon"}>
            {({ focus }) => (
              <button
                onClick={() => {
                  if (c.status === "coming_soon") return;
                  sounds.tap();
                  setCountryCode(c.code);
                }}
                disabled={c.status === "coming_soon"}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold ${
                  c.code === country.code ? "bg-brand-soft text-brand" : focus ? "bg-surface-2" : ""
                } ${c.status === "coming_soon" ? "cursor-not-allowed opacity-50" : ""}`}
              >
                <span>{c.flag}</span>
                <span className="flex-1">{c.name}</span>
                {c.status === "coming_soon" ? (
                  <span className="rounded-full bg-yellow px-2 py-0.5 text-[10px] font-bold text-ink/70">
                    SOON
                  </span>
                ) : c.code === country.code ? (
                  <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />
                ) : null}
              </button>
            )}
          </MenuItem>
        ))}
      </MenuItems>
    </Menu>
  );
}
