import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import clsx from "clsx";
import { Toaster } from "react-hot-toast";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";

import { Providers } from "./providers";

import { Locale, defaultLocale, getLocaleDir, locales } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common");

  const siteName = t("siteName");

  return {
    title: {
      default: siteName,
      template: `%s - ${siteName}`,
    },
    description: "",
    icons: {
      icon: "/favicon.ico",
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const requestLocale = (await getLocale()) as Locale;
  const locale = locales.includes(requestLocale)
    ? requestLocale
    : defaultLocale;
  const dir = getLocaleDir(locale);
  const messages = await getMessages(locale);

  return (
    <html suppressHydrationWarning dir={dir} lang={locale}>
      <head />
      <body
        className={clsx("min-h-screen bg-background font-sans antialiased")}
      >
        <NextIntlClientProvider locale={locale} messages={messages as any}>
          <Providers
            themeProps={{
              attribute: "class",
              defaultTheme: "light",
              enableSystem: false,
            }}
          >
            <div className="relative flex flex-col min-h-screen">
              <Toaster position="top-center" />
              <div className="flex-grow">{children}</div>
            </div>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
