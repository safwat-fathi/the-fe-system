/**
 * Helper functions for path revalidation
 */

import { revalidatePath } from "next/cache";

import { getVoucherRoute } from "@/utilities/voucher/routing";

/**
 * Revalidate voucher paths after create/update
 */
export function revalidateVoucherPaths(vouchType: number, masterId?: number) {
  // Revalidate general paths
  revalidatePath("/forms/voucher");
  revalidatePath("/forms/voucher1");
  revalidatePath("/forms/voucher2");
  revalidatePath("/forms/gvoucher4");
  revalidatePath("/forms/gvoucher5");
  revalidatePath("/forms/receipt");
  revalidatePath("/forms/delivery");
  revalidatePath("/reports/vouchers");

  // Revalidate specific voucher path if masterId is provided
  if (masterId) {
    const route = getVoucherRoute(vouchType, masterId, "preview");
    // Extract base path without query params
    const basePath = route.split("?")[0];

    revalidatePath(basePath);
  }
}
