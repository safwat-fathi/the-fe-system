"use client";

import { useRouter } from "next/navigation";

export default function NotFoundClient() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="btn btn-secondary w-full sm:w-auto"
    >
			رجوع
    </button>
  );
}
