"use client";

import { createContext, useContext } from "react";
import { DEFAULT_LOCALE, dictFor, type Dict, type Locale } from "../../lib/locale";

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

export function useDict(): { locale: Locale; t: Dict } {
  const locale = useContext(LocaleContext);
  return { locale, t: dictFor(locale) };
}
