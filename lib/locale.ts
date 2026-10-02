// Client-safe locale helpers and dictionaries. No server-only imports here,
// so this module is safe to import from client components.
import { en } from "./dictionaries/en";
import { hi } from "./dictionaries/hi";

export const LOCALES = ["en", "hi"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "NEXT_LOCALE";

export const LOCALE_LABELS: Record<Locale, { native: string; roman: string }> = {
  en: { native: "English", roman: "ENGLISH" },
  hi: { native: "हिन्दी", roman: "HINDI" },
};

export type Dict = typeof en;

const DICTS: Record<Locale, Dict> = { en, hi: hi as Dict };

export function dictFor(locale: Locale): Dict {
  return DICTS[locale] || DICTS[DEFAULT_LOCALE];
}

export function isLocale(v: string | undefined | null): v is Locale {
  return !!v && (LOCALES as readonly string[]).includes(v);
}

// Read the locale from document.cookie (client only). Falls back to default.
export function readLocaleFromCookie(): Locale {
  if (typeof document === "undefined") return DEFAULT_LOCALE;
  try {
    const m = document.cookie.match(/(?:^|; )NEXT_LOCALE=([^;]+)/);
    const v = m ? decodeURIComponent(m[1]) : null;
    return isLocale(v) ? v : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function setLocaleCookie(code: Locale) {
  try {
    document.cookie = `NEXT_LOCALE=${code}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  } catch {}
}
