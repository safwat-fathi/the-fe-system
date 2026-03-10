"use server";

import { revalidateTag, revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import {
  assertAnyAuthorized,
  assertAuthorized,
} from "@/utilities/auth/authorization-server";

const TABLE_REVALIDATION_SUBJECT: Record<string, string> = {
  accounts_list: "basic.accounts",
  cost_centers_list: "basic.cost-centers",
  boxes_list: "basic.boxes",
  currencies_list: "basic.currencies",
  customers_list: "basic.customers",
  items_list: "basic.items",
  categories_list: "basic.categories",
  cust_type_list: "basic.cust_type",
  units_list: "basic.units",
  user_companies: "settings.user-assignments",
  user_cost_centers: "settings.user-assignments",
};

const PATH_REVALIDATION_SUBJECT: Array<{ prefix: string; subject: string }> = [
  { prefix: "/basic/accounts", subject: "basic.accounts" },
  { prefix: "/basic/cost-centers", subject: "basic.cost-centers" },
  { prefix: "/basic/boxes", subject: "basic.boxes" },
  { prefix: "/basic/currencies", subject: "basic.currencies" },
  { prefix: "/basic/customers", subject: "basic.customers" },
  { prefix: "/basic/items", subject: "basic.items" },
  { prefix: "/basic/categories", subject: "basic.categories" },
  { prefix: "/basic/cust_type", subject: "basic.cust_type" },
  { prefix: "/basic/units", subject: "basic.units" },
  { prefix: "/settings/user-assignments", subject: "settings.user-assignments" },
];

const assertTableRevalidationPermission = async (tableName: string) => {
  const subject = TABLE_REVALIDATION_SUBJECT[tableName];

  if (!subject) {
    await assertAnyAuthorized([
      { subject: "settings.permissions", action: "update" },
      { subject: "settings.user-assignments", action: "update" },
    ]);

    return;
  }

  await assertAuthorized({ subject, action: "update" });
};

const assertPathRevalidationPermission = async (path: string) => {
  const matched = PATH_REVALIDATION_SUBJECT.find((item) =>
    path.startsWith(item.prefix),
  );

  if (!matched) {
    await assertAnyAuthorized([
      { subject: "settings.permissions", action: "update" },
      { subject: "settings.user-assignments", action: "update" },
    ]);

    return;
  }

  await assertAuthorized({ subject: matched.subject, action: "update" });
};

/**
 * Revalidate cached data for a specific table
 * @param tableName - Name of the table to revalidate (e.g., 'accounts_list', 'cost_centers_list')
 */
export async function revalidateTableData(tableName: string) {
  await assertTableRevalidationPermission(tableName);

  try {
    // Revalidate the specific table cache
    revalidateTag(tableName);

    // شجرة الحسابات تُخزَّن بـ tags مختلفة — إبطالها لظهور التعديل فوراً
    if (tableName === "accounts_list") {
      revalidateTag("accounts");
      revalidateTag("accounts-tree");
      revalidatePath("/basic/accounts", "page");
    }

    if (tableName === "cost_centers_list") {
      revalidatePath("/basic/cost-centers", "page");
    }

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
  await assertPathRevalidationPermission(path);

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
  await assertAnyAuthorized(
    Object.values(TABLE_REVALIDATION_SUBJECT).map((subject) => ({
      subject,
      action: "update" as const,
    })),
  );

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
  await assertAnyAuthorized([
    { subject: "basic.accounts", action: "view" },
    { subject: "basic.customers", action: "view" },
    { subject: "basic.items", action: "view" },
  ]);

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
  await assertAuthorized({ subject: "basic.boxes", action: "update" });

  try {
    revalidateTag("boxes");
    revalidateTag("boxes_list");

    return { success: true };
  } catch (error) {
    console.error("Error revalidating boxes:", error);

    return { success: false, error };
  }
}
