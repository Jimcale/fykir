"use client";

import { useEffect, useRef, useState } from "react";

export function CityAutosuggest({
  value,
  onChange,
  suggestions,
  placeholder = "e.g. Nairobi",
}: {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = value.trim()
    ? suggestions.filter((c) => c.toLowerCase().includes(value.trim().toLowerCase()))
    : suggestions;

  return (
    <div ref={containerRef} className="relative">
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        className="fk-input"
      />
      {open && filtered.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-10 mt-1.5 max-h-48 overflow-y-auto rounded-xl border border-border bg-surface p-1.5 shadow-lg">
          {filtered.slice(0, 8).map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => {
                onChange(city);
                setOpen(false);
              }}
              className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-semibold hover:bg-surface-2"
            >
              {city}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
