"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";

/* ─────────────────────────────────────────
   Supported currencies & languages
   ───────────────────────────────────────── */

export type CurrencyCode = "USD" | "NGN" | "GBP" | "EUR" | "CAD" | "GHS" | "ZAR";
export type LanguageCode = "en" | "fr" | "de" | "es" | "pt" | "yo" | "ig" | "ha";

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  flag: string;   // emoji flag
}

export interface LanguageConfig {
  code: LanguageCode;
  name: string;
  nativeName: string;
}

export interface CountryConfig {
  code: string;        // ISO 3166-1 alpha-2
  name: string;
  flag: string;
  defaultCurrency: CurrencyCode;
  defaultLanguage: LanguageCode;
  continent: string;
}

/* ── Static maps ────────────────────────── */

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: { code: "USD", symbol: "$",  name: "US Dollar",      flag: "🇺🇸" },
  NGN: { code: "NGN", symbol: "₦",  name: "Nigerian Naira", flag: "🇳🇬" },
  GBP: { code: "GBP", symbol: "£",  name: "British Pound",  flag: "🇬🇧" },
  EUR: { code: "EUR", symbol: "€",  name: "Euro",           flag: "🇪🇺" },
  CAD: { code: "CAD", symbol: "CA$",name: "Canadian Dollar", flag: "🇨🇦" },
  GHS: { code: "GHS", symbol: "₵",  name: "Ghanaian Cedi",  flag: "🇬🇭" },
  ZAR: { code: "ZAR", symbol: "R",  name: "South African Rand", flag: "🇿🇦" },
};

export const LANGUAGES: Record<LanguageCode, LanguageConfig> = {
  en: { code: "en", name: "English",    nativeName: "English"    },
  fr: { code: "fr", name: "French",     nativeName: "Français"   },
  de: { code: "de", name: "German",     nativeName: "Deutsch"    },
  es: { code: "es", name: "Spanish",    nativeName: "Español"    },
  pt: { code: "pt", name: "Portuguese", nativeName: "Português"  },
  yo: { code: "yo", name: "Yoruba",     nativeName: "Yorùbá"    },
  ig: { code: "ig", name: "Igbo",       nativeName: "Igbo"       },
  ha: { code: "ha", name: "Hausa",      nativeName: "Hausa"      },
};

export const COUNTRIES: CountryConfig[] = [
  { code: "NG", name: "Nigeria",         flag: "🇳🇬", defaultCurrency: "NGN", defaultLanguage: "en", continent: "Africa" },
  { code: "GH", name: "Ghana",           flag: "🇬🇭", defaultCurrency: "GHS", defaultLanguage: "en", continent: "Africa" },
  { code: "ZA", name: "South Africa",    flag: "🇿🇦", defaultCurrency: "ZAR", defaultLanguage: "en", continent: "Africa" },
  { code: "GB", name: "United Kingdom",  flag: "🇬🇧", defaultCurrency: "GBP", defaultLanguage: "en", continent: "Europe" },
  { code: "DE", name: "Germany",         flag: "🇩🇪", defaultCurrency: "EUR", defaultLanguage: "de", continent: "Europe" },
  { code: "FR", name: "France",          flag: "🇫🇷", defaultCurrency: "EUR", defaultLanguage: "fr", continent: "Europe" },
  { code: "ES", name: "Spain",           flag: "🇪🇸", defaultCurrency: "EUR", defaultLanguage: "es", continent: "Europe" },
  { code: "PT", name: "Portugal",        flag: "🇵🇹", defaultCurrency: "EUR", defaultLanguage: "pt", continent: "Europe" },
  { code: "CA", name: "Canada",          flag: "🇨🇦", defaultCurrency: "CAD", defaultLanguage: "en", continent: "Americas" },
  { code: "US", name: "United States",   flag: "🇺🇸", defaultCurrency: "USD", defaultLanguage: "en", continent: "Americas" },
];

/* ── Country code → config map ──────────── */
const COUNTRY_MAP = Object.fromEntries(COUNTRIES.map((c) => [c.code, c]));

/* ── Fallback / static conversion rates (base: USD) ─── */
const FALLBACK_RATES: Record<CurrencyCode, number> = {
  USD: 1,
  NGN: 1620,
  GBP: 0.79,
  EUR: 0.92,
  CAD: 1.37,
  GHS: 15.5,
  ZAR: 18.6,
};

/* ─────────────────────────────────────────
   Context types
   ───────────────────────────────────────── */

interface CurrencyContextType {
  currency: CurrencyCode;
  language: LanguageCode;
  country: CountryConfig;
  rates: Record<CurrencyCode, number>;
  ratesLoading: boolean;
  geoLoading: boolean;
  setCurrency: (c: CurrencyCode) => void;
  setLanguage: (l: LanguageCode) => void;
  setCountry: (c: CountryConfig) => void;
  formatPrice: (usdAmount: number) => string;
  convertPrice: (usdAmount: number) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

/* ─────────────────────────────────────────
   Provider
   ───────────────────────────────────────── */

const DEFAULT_COUNTRY = COUNTRY_MAP["US"];
const LS_KEY = "nat_locale";

function loadSaved(): { currency?: CurrencyCode; language?: LanguageCode; country?: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function savePref(currency: CurrencyCode, language: LanguageCode, country: string) {
  try { localStorage.setItem(LS_KEY, JSON.stringify({ currency, language, country })); } catch {}
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [country,  setCountryState]  = useState<CountryConfig>(DEFAULT_COUNTRY);
  const [currency, setCurrencyState] = useState<CurrencyCode>("USD");
  const [language, setLanguageState] = useState<LanguageCode>("en");
  const [rates,    setRates]         = useState<Record<CurrencyCode, number>>(FALLBACK_RATES);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [geoLoading,   setGeoLoading]   = useState(true);

  /* 1. On mount: try to restore saved preference, otherwise geo-detect */
  useEffect(() => {
    const saved = loadSaved();
    if (saved?.currency && saved?.language && saved?.country) {
      const countryConfig = COUNTRY_MAP[saved.country] || DEFAULT_COUNTRY;
      setCountryState(countryConfig);
      setCurrencyState(saved.currency as CurrencyCode);
      setLanguageState(saved.language as LanguageCode);
      setGeoLoading(false);
      return;
    }

    /* Geo-detect via ipapi.co */
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch("https://ipapi.co/json/", { signal: controller.signal, cache: "force-cache" });
        if (!res.ok) throw new Error("geo-fail");
        const data = await res.json();
        const detected = COUNTRY_MAP[data.country_code] || DEFAULT_COUNTRY;
        setCountryState(detected);
        setCurrencyState(detected.defaultCurrency);
        setLanguageState(detected.defaultLanguage);
        savePref(detected.defaultCurrency, detected.defaultLanguage, detected.code);
      } catch {
        /* silent: keep USD/US defaults */
      } finally {
        setGeoLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  /* 2. Fetch live exchange rates via our server-side proxy (avoids CORS) */
  useEffect(() => {
    setRatesLoading(true);
    (async () => {
      try {
        const res = await fetch("/api/rates");
        if (!res.ok) throw new Error("rates-fail");
        const data = await res.json();
        setRates({
          USD: 1,
          NGN: data.NGN ?? FALLBACK_RATES.NGN,
          GBP: data.GBP ?? FALLBACK_RATES.GBP,
          EUR: data.EUR ?? FALLBACK_RATES.EUR,
          CAD: data.CAD ?? FALLBACK_RATES.CAD,
          GHS: data.GHS ?? FALLBACK_RATES.GHS,
          ZAR: data.ZAR ?? FALLBACK_RATES.ZAR,
        });
      } catch {
        /* Retain fallback rates on network failure */
      } finally {
        setRatesLoading(false);
      }
    })();
  }, []);

  /* Public setters (also persist) */
  const setCurrency = useCallback((c: CurrencyCode) => {
    setCurrencyState(c);
    savePref(c, language, country.code);
  }, [language, country.code]);

  const setLanguage = useCallback((l: LanguageCode) => {
    setLanguageState(l);
    savePref(currency, l, country.code);
  }, [currency, country.code]);

  const setCountry = useCallback((c: CountryConfig) => {
    setCountryState(c);
    setCurrencyState(c.defaultCurrency);
    setLanguageState(c.defaultLanguage);
    savePref(c.defaultCurrency, c.defaultLanguage, c.code);
  }, []);

  /* Convert USD → selected currency */
  const convertPrice = useCallback(
    (usdAmount: number) => usdAmount * (rates[currency] ?? 1),
    [rates, currency]
  );

  /* Format price with local symbol */
  const formatPrice = useCallback(
    (usdAmount: number): string => {
      const converted = convertPrice(usdAmount);
      const cfg = CURRENCIES[currency];
      /* Use Intl for NGN/ZAR/GHS as they need large number formatting */
      if (["NGN", "GHS", "ZAR"].includes(currency)) {
        return `${cfg.symbol}${Math.round(converted).toLocaleString()}`;
      }
      return `${cfg.symbol}${converted.toFixed(2)}`;
    },
    [convertPrice, currency]
  );

  const value = useMemo<CurrencyContextType>(
    () => ({
      currency, language, country, rates, ratesLoading, geoLoading,
      setCurrency, setLanguage, setCountry, formatPrice, convertPrice,
    }),
    [currency, language, country, rates, ratesLoading, geoLoading,
     setCurrency, setLanguage, setCountry, formatPrice, convertPrice]
  );

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
