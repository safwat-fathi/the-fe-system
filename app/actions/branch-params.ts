"use server";

import { cookies } from "next/headers";

export async function getBranchParams() {
  const cookieStore = await cookies();

  // Try to get from cookies, or use defaults
  const companyId = cookieStore.get("company_id")?.value || "1";
  const selectedYear =
    cookieStore.get("selectedYear")?.value ||
    new Date().getFullYear().toString();

  const com = companyId || "1";
  const year = selectedYear || new Date().getFullYear();

  return {
    com,
    year,
  };
}
