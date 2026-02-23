"use server";

import { getBranchParams } from "../branch-params";

import { voucherService } from "@/services/api";

export async function getNextVoucherNumberAction(
  voucherType: number,
): Promise<number> {
  const parsedVoucherType = Number(voucherType);

  if (!Number.isFinite(parsedVoucherType) || parsedVoucherType <= 0) {
    return 1;
  }

  try {
    const { com } = await getBranchParams();
    const nextNumber = await voucherService.getNextNumber(parsedVoucherType, {
      xcom_id: com,
    });

    return Number.isFinite(nextNumber) && nextNumber > 0 ? nextNumber : 1;
  } catch {
    return 1;
  }
}
