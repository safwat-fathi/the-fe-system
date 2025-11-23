import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { Locale, locales } from "@/i18n/config";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleSegmentLayout({
  children,
  params,
}: LayoutProps) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  setRequestLocale(locale as Locale);

  return children;
}
