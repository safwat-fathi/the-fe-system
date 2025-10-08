"use client";

import GlobalError from "@/components/GlobalError";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    /* eslint-disable no-console */
    console.error(error);
  }, [error]);

  return (
    <GlobalError message={error.message} stack={error.stack} onRetry={reset} />
  );
}
