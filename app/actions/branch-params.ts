"use server";

import { cookies } from "next/headers";

export async function getBranchParams() {
  const cookieStore = await cookies();

  // Try to get from cookies, or use defaults
  const selectedBranch = cookieStore.get("selectedBranch")?.value || "1";
  const selectedYear =
    cookieStore.get("selectedYear")?.value ||
    new Date().getFullYear().toString();

  return {
    com: selectedBranch,
    year: selectedYear,
  };
}
