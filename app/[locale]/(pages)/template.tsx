import { Suspense } from "react";

import AppLoading from "@/components/AppLoading";

export default function Template({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<AppLoading />}>{children}</Suspense>;
}
