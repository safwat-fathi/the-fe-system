"use client";

import { HeroUIProvider } from "@heroui/system";
import { useRouter } from "next/navigation";
import {
  type ThemeProviderProps,
  ThemeProvider as NextThemesProvider,
} from "next-themes";
import { Toaster } from "react-hot-toast";
import { useEffect, useState } from "react";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

export function Providers({ children, themeProps }: ProvidersProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <HeroUIProvider navigate={router.push}>
      <NextThemesProvider
        {...themeProps}
        enableSystem={false}
        disableTransitionOnChange
      >
        <div className="relative min-h-screen" suppressHydrationWarning>
          {mounted && <Toaster position="top-center" />}
          {children}
        </div>
      </NextThemesProvider>
    </HeroUIProvider>
  );
}
