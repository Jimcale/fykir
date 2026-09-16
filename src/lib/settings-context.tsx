"use client";

import { onSnapshot } from "firebase/firestore";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { appSettingsRef } from "@/lib/firebase/collections";
import { detectVisitorCountry } from "@/lib/geo";
import type { Country } from "@/lib/types";

const FALLBACK_COUNTRIES: Country[] = [
  {
    code: "KE",
    name: "Kenya",
    flag: "🇰🇪",
    city: "Nairobi",
    currency: "KES",
    cash_payout_fee: 5,
    status: "active",
    payment_methods: [
      { id: "mpesa", label: "M-Pesa", status: "active" },
      { id: "card", label: "Card", status: "coming_soon" },
    ],
  },
];

const RECENT_COUNTRY_KEY = "fk_country";

interface SettingsContextValue {
  countries: Country[];
  country: Country;
  setCountryCode: (code: string) => void;
  loading: boolean;
  comingSoonMode: boolean;
  isSupportedCountry: boolean;
}

const SettingsContext = createContext<SettingsContextValue>({
  countries: FALLBACK_COUNTRIES,
  country: FALLBACK_COUNTRIES[0],
  setCountryCode: () => {},
  loading: true,
  comingSoonMode: false,
  isSupportedCountry: true,
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [countries, setCountries] = useState<Country[]>(FALLBACK_COUNTRIES);
  const [comingSoonMode, setComingSoonMode] = useState(false);
  const [code, setCode] = useState("KE");
  const [loading, setLoading] = useState(true);
  const [visitorCountryCode, setVisitorCountryCode] = useState<string | null>(null);
  const [visitorCountryKnown, setVisitorCountryKnown] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(RECENT_COUNTRY_KEY);
    if (stored) setCode(stored);
  }, []);

  useEffect(() => {
    let cancelled = false;
    detectVisitorCountry().then((detected) => {
      if (cancelled) return;
      setVisitorCountryCode(detected);
      setVisitorCountryKnown(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(
      appSettingsRef,
      (snap) => {
        const data = snap.data();
        if (data?.countries?.length) setCountries(data.countries);
        setComingSoonMode(data?.coming_soon_mode ?? false);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, []);

  const country = useMemo(
    () => countries.find((c) => c.code === code) ?? countries[0],
    [countries, code]
  );

  // Unknown location (still loading, or the lookup failed) is treated as
  // supported so we never wrongly block/hide things for a visitor we
  // couldn't place — only a confirmed, non-active country counts as
  // unsupported.
  const isSupportedCountry = useMemo(() => {
    if (!visitorCountryKnown || !visitorCountryCode) return true;
    return countries.some((c) => c.code === visitorCountryCode && c.status === "active");
  }, [visitorCountryKnown, visitorCountryCode, countries]);

  function setCountryCode(next: string) {
    setCode(next);
    window.localStorage.setItem(RECENT_COUNTRY_KEY, next);
  }

  return (
    <SettingsContext.Provider
      value={{ countries, country, setCountryCode, loading, comingSoonMode, isSupportedCountry }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
