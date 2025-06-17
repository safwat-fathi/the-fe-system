import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import clsx from "clsx";
import { Providers } from "./providers";
import { siteConfig } from "@/config/site";
// import { fontSans } from "@/config/fonts";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning lang="ar" dir="rtl">
      <head />
      <body
        className={clsx(
          "min-h-screen bg-background font-sans antialiased",
          // fontSans.variable,
        )}
      >
        <Providers themeProps={{ attribute: "class", defaultTheme: "light", enableSystem: false }}>

          <div className="relative flex flex-col min-h-screen">
            <Toaster position="top-center" />
            <div className="flex-grow">{children}</div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
