import { cookies } from "next/headers";
import { LOCALE_COOKIE, DEFAULT_LOCALE, dictFor, isLocale, type Locale, type Dict } from "./locale";

export * from "./locale";

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
