"use server";

import { revalidateTableData, revalidatePagePath } from "@/app/actions/revalidate.action";

/**
 * Revalidate cost centers cache and page
 * Call this after creating, updating, or deleting a cost center
 */
export async function revalidateCostCenters() {
  try {
    await revalidateTableData("cost_centers_list");
    await revalidatePagePath("/basic/cost-centers");
    
    return { success: true };
  } catch (error) {
    console.error("Error revalidating cost centers:", error);
    
    return { success: false, error };
  }
}

