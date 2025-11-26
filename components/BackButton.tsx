"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function NotFoundClient() {
  const router = useRouter();
  const [previousPath, setPreviousPath] = useState("/");

  useEffect(() => {
    if (typeof document === "undefined") return;

    const referrer = document.referrer;

    if (!referrer) return;

    try {
      const referrerUrl = new URL(referrer);

      if (referrerUrl.origin === window.location.origin) {
        const path = `${referrerUrl.pathname}${referrerUrl.search}${referrerUrl.hash}`;

        setPreviousPath(path || "/");
      }
    } catch {
      // ignore invalid referrer values
    }
  }, []);

  return (
    <button
      className="btn btn-secondary w-full sm:w-auto"
      type="button"
      onClick={() => router.replace(previousPath)}
    >
      رجوع
    </button>
  );
}
