/**
 * Delete voucher action
 */

"use server";

import { revalidatePath } from "next/cache";

import { voucherService } from "@/services/api";
import {
  assertAnyAuthorized,
} from "@/utilities/auth/authorization-server";
import { resolveVoucherSubject } from "@/utilities/auth/authorization-core";

/**
 * Delete a voucher
 */
export async function deleteVoucherAction(voucherId: number) {
  try {
    await assertAnyAuthorized([
      { subject: resolveVoucherSubject(0), action: "delete" },
      { subject: resolveVoucherSubject(1), action: "delete" },
      { subject: resolveVoucherSubject(2), action: "delete" },
      { subject: resolveVoucherSubject(3), action: "delete" },
      { subject: resolveVoucherSubject(4), action: "delete" },
      { subject: resolveVoucherSubject(5), action: "delete" },
      { subject: resolveVoucherSubject(111), action: "delete" },
      { subject: resolveVoucherSubject(222), action: "delete" },
    ]);

    const response = await voucherService.deleteVoucher(voucherId);

    if (response.success) {
      revalidatePath("/forms/voucher");
      revalidatePath("/reports/vouchers");

      return {
        success: true,
        message: "تم حذف السند بنجاح",
      };
    }

    return {
      success: false,
      message: response.message || "حدث خطأ أثناء حذف السند",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "حدث خطأ",
    };
  }
}
