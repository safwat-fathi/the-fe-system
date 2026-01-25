"use server";

import { revalidateTag, revalidatePath } from "next/cache";
import { cookies } from "next/headers";

/**
 * Revalidate cached data for a specific table
 * @param tableName - Name of the table to revalidate (e.g., 'accounts_list', 'cost_centers_list')
 */
export async function revalidateTableData(tableName: string) {
  try {
    // Revalidate the specific table cache
    revalidateTag(tableName);

    // Also revalidate branch-specific cache
    const cookieStore = await cookies();
    const selectedBranch = cookieStore.get("selectedBranch")?.value || "1";

    revalidateTag(`branch-${selectedBranch}`);

    return { success: true };
  } catch (error) {
    console.error("Error revalidating cache:", error);

    return { success: false, error };
  }
}

/**
 * Revalidate a specific page path
 * @param path - Path to revalidate (e.g., '/basic/accounts')
 */
export async function revalidatePagePath(path: string) {
  try {
    revalidatePath(path);

    return { success: true };
  } catch (error) {
    console.error("Error revalidating path:", error);

    return { success: false, error };
  }
}

/**
 * Revalidate all basic data tables
 * Useful after operations that affect multiple tables
 */
export async function revalidateAllBasicData() {
  try {
    const tables = [
      "accounts_list",
      "cost_centers_list",
      "user_companies",
      "user_cost_centers",
      "boxes_list",
      "currencies_list",
      "customers_list",
      "items_list",
      "categories_list",
      "cust_type_list",
      "units_list",
    ];

    tables.forEach((table) => revalidateTag(table));

    // Revalidate branch cache
    const cookieStore = await cookies();
    const selectedBranch = cookieStore.get("selectedBranch")?.value || "1";

    revalidateTag(`branch-${selectedBranch}`);

    return { success: true };
  } catch (error) {
    console.error("Error revalidating all basic data:", error);

    return { success: false, error };
  }
}

/**
 * Revalidate dashboard data
 */
export async function revalidateDashboard() {
  try {
    revalidatePath("/");
    revalidateTag("dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error revalidating dashboard:", error);

    return { success: false, error };
  }
}

/**
 * Revalidate boxes data
 */
export async function revalidateBoxes() {
  try {
    revalidateTag("boxes");
    revalidateTag("boxes_list");

    return { success: true };
  } catch (error) {
    console.error("Error revalidating boxes:", error);

    return { success: false, error };
  }
}
