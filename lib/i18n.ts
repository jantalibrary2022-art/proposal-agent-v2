import { cookies } from "next/headers";
import { en } from "./dictionaries/en";
import { hi } from "./dictionaries/hi";

export const LOCALES = ["en", "hi"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "NEXT_LOCALE";

// Native + roman labels for the language picker and switcher.
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

// Server-side: the locale chosen by the visitor, or null if they have not chosen yet.
export async function getChosenLocale(): Promise<Locale | null> {
  const store = await cookies();
  const v = store.get(LOCALE_COOKIE)?.value;
  return isLocale(v) ? v : null;
}

// Server-side: the locale to render in (falls back to default).
export async function getLocale(): Promise<Locale> {
  return (await getChosenLocale()) || DEFAULT_LOCALE;
}

export async function getDict(): Promise<{ locale: Locale; t: Dict }> {
  const locale = await getLocale();
  return { locale, t: dictFor(locale) };
}
