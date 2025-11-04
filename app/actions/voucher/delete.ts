/**
 * Delete voucher action
 */

"use server";

import { revalidatePath } from "next/cache";

import { voucherService } from "@/services/api";

/**
 * Delete a voucher
 */
export async function deleteVoucherAction(voucherId: number) {
  try {
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
