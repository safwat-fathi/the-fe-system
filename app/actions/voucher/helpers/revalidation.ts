/**
 * Helper functions for path revalidation
 */

import { revalidatePath, revalidateTag } from "next/cache";

import { getVoucherRoute } from "@/utilities/voucher/routing";

/**
 * Revalidate voucher paths after create/update
 */
export function revalidateVoucherPaths(
  vouchType: number,
  masterId?: number,
  vouchId?: number,
) {
  // Revalidate general paths
  revalidatePath("/forms/voucher");
  revalidatePath("/forms/voucher1");
  revalidatePath("/forms/voucher2");
  revalidatePath("/forms/gvoucher4");
  revalidatePath("/forms/gvoucher5");
  revalidatePath("/forms/receipt");
  revalidatePath("/forms/delivery");
  revalidatePath("/forms/balance");
  revalidatePath("/reports/vouchers");

  // Revalidate cache tags
  revalidateTag("balance-vouchers");
  revalidateTag("vouchers");
  revalidateTag(`vouchers-type-${vouchType}`); // إعادة التحقق من قيود النوع المحدد
  revalidateTag("voucher-details"); // إعادة التحقق من تفاصيل القيد بعد التحديث

  // Revalidate specific voucher path
  // استخدام vouch_id إذا كان متاحاً (لأن URL يستخدم vouch_id)، وإلا استخدم masterId
  const idToUse = vouchId && Number(vouchId) > 0 ? vouchId : masterId;

  if (idToUse) {
    const route = getVoucherRoute(vouchType, idToUse, "preview");
    // Extract base path without query params
    const basePath = route.split("?")[0];

    revalidatePath(basePath);

    // Revalidate with layout to ensure all cached data is refreshed
    revalidatePath(basePath, "layout");
  }
}
