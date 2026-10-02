import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Archivo, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import { LOCALES, DEFAULT_LOCALE, type Locale } from "../lib/i18n";
import { LocaleProvider } from "./_components/LocaleProvider";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-archivo",
  display: "swap",
});

const notoDeva = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-noto-deva",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Prastav",
  description:
    "An AI workbench for the development sector. Evidence-grade proposals, built on 24 years of practice, multiplied by AI.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const store = await cookies();
  const cookieLocale = store.get("NEXT_LOCALE")?.value as Locale | undefined;
  const lang: Locale = cookieLocale && LOCALES.includes(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;

  return (
    <html lang={lang} className={`${archivo.variable} ${notoDeva.variable}`}>
      <body>
        <LocaleProvider locale={lang}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
