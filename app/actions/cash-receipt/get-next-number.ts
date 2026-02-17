"use server";

import { cashReceiptService } from "@/services/api/cash-receipt.service";

/**
 * Get the next available cash receipt number
 * @param voucherType The type of voucher
 */
export async function getNextCashReceiptNumberAction(voucherType: number) {
  try {
    const nextNumber =
      await cashReceiptService.getNextCashReceiptNumber(voucherType);

    return {
      success: true,
      data: nextNumber,
    };
  } catch (error) {
    console.error("Error getting next cash receipt number:", error);

    return {
      success: false,
      message: "فشل في الحصول على رقم السند التالي",
    };
  }
}
