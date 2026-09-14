import type { RecentSearchEntry, SenderProfile } from "./types";

const SENDER_KEY = "fk_sender_profile";
const RECENT_SEARCH_KEY = "fk_recent_searches";

export function loadSenderProfile(): SenderProfile {
  if (typeof window === "undefined") {
    return { name: "", whatsapp: "", email: "", anonymous: false, alias: null };
  }
  try {
    const raw = window.localStorage.getItem(SENDER_KEY);
    if (!raw) throw new Error("none");
    return JSON.parse(raw) as SenderProfile;
  } catch {
    return { name: "", whatsapp: "", email: "", anonymous: false, alias: null };
  }
}

export function saveSenderProfile(profile: SenderProfile) {
  window.localStorage.setItem(SENDER_KEY, JSON.stringify(profile));
}

export function loadRecentSearches(): RecentSearchEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_SEARCH_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RecentSearchEntry[];
  } catch {
    return [];
  }
}

export function pushRecentSearch(entry: RecentSearchEntry) {
  const existing = loadRecentSearches().filter(
    (e) => e.username !== entry.username
  );
  const next = [entry, ...existing].slice(0, 5);
  window.localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(next));
}
