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
}

const SettingsContext = createContext<SettingsContextValue>({
  countries: FALLBACK_COUNTRIES,
  country: FALLBACK_COUNTRIES[0],
  setCountryCode: () => {},
  loading: true,
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [countries, setCountries] = useState<Country[]>(FALLBACK_COUNTRIES);
  const [code, setCode] = useState("KE");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = window.localStorage.getItem(RECENT_COUNTRY_KEY);
    if (stored) setCode(stored);
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(
      appSettingsRef,
      (snap) => {
        const data = snap.data();
        if (data?.countries?.length) setCountries(data.countries);
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

  function setCountryCode(next: string) {
    setCode(next);
    window.localStorage.setItem(RECENT_COUNTRY_KEY, next);
  }

  return (
    <SettingsContext.Provider
      value={{ countries, country, setCountryCode, loading }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
