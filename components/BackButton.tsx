"use client";

import { useRouter } from "next/navigation";

export default function NotFoundClient() {
  const router = useRouter();

  return (
    <button
      className="btn btn-secondary w-full sm:w-auto"
      type="button"
      onClick={() => router.back()}
    >
      رجوع
    </button>
  );
}
