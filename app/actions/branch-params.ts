"use server";

import { cookies } from "next/headers";

import { STORAGE_KEYS } from "@/constants";


export async function getBranchParams() {
  const cookieStore = await cookies();

  // Try to get from cookies, or use defaults
  const companyId = cookieStore.get(STORAGE_KEYS.COMPANY_ID)?.value || "1";
  const selectedYear =
    cookieStore.get(STORAGE_KEYS.FIN_YEAR)?.value ||
    new Date().getFullYear().toString();

  const com = companyId || "1";
  const year = selectedYear || new Date().getFullYear();

  return {
    com,
    year,
  };
}
