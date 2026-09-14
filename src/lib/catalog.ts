import type { ColorKey } from "./types";

export const COLOR_BG: Record<ColorKey, string> = {
  brand: "bg-brand-soft",
  yellow: "bg-yellow-soft",
  green: "bg-green-soft",
  violet: "bg-violet-soft",
  teal: "bg-teal-soft",
  orange: "bg-orange-soft",
  pink: "bg-pink-soft",
};

export const COLOR_TEXT: Record<ColorKey, string> = {
  brand: "text-brand",
  yellow: "text-[oklch(55%_0.14_85)]",
  green: "text-[oklch(50%_0.14_150)]",
  violet: "text-[oklch(55%_0.15_305)]",
  teal: "text-[oklch(50%_0.12_200)]",
  orange: "text-[oklch(50%_0.13_55)]",
  pink: "text-[oklch(55%_0.15_350)]",
};

export const COLOR_SOLID: Record<ColorKey, string> = {
  brand: "var(--brand)",
  yellow: "var(--yellow)",
  green: "var(--green)",
  violet: "var(--violet)",
  teal: "var(--teal)",
  orange: "var(--orange)",
  pink: "var(--pink)",
};

export const ACCENT_PRESETS = [
  "#e8407a",
  "#7c5cff",
  "#ff8a3d",
  "#17b3a3",
  "#2f9e44",
];

export const COVER_PRESETS: [string, string][] = [
  ["#e8407a", "#ff8a3d"],
  ["#7c5cff", "#e8407a"],
  ["#17b3a3", "#7c5cff"],
  ["#ff8a3d", "#2f9e44"],
  ["#2f9e44", "#17b3a3"],
];

export const ANON_ALIASES = [
  "Secret Admirer",
  "A Friend",
  "A Well-Wisher",
  "Someone Who Cares",
  "Anonymous Fan",
];

export const AMOUNT_STEP = 50;
export const AMOUNT_MAX_MULTIPLIER = 4;

export function roundToStep(value: number, step = AMOUNT_STEP) {
  return Math.round(value / step) * step;
}

export function formatMoney(amount: number, currency = "KES") {
  return `${currency} ${amount.toLocaleString("en-KE")}`;
}

export function amountChips(min: number, max: number) {
  const raw = [min, roundToStep(min * 1.5), min * 2, min * 3];
  const unique = Array.from(new Set(raw.map((v) => roundToStep(v))));
  return unique.filter((v) => v >= min && v <= max);
}

export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
