"use server";

import type { IParams } from "@/types/services/base";
import type {
  SaveVoucherData,
  VoucherDetailData,
  VoucherBoxData,
  GVoucherDetailData,
} from "./voucher/helpers/types";

import { revalidatePath, revalidateTag } from "next/cache";
import { cookies } from "next/headers";

import {
  createVoucherAction,
  updateVoucherAction,
  deleteVoucherAction,
} from "./voucher";

import { voucherService } from "@/services/api";
import { STORAGE_KEYS } from "@/constants";

const ADJUSTMENT_VOUCHER_TYPE = 3;

async function getBranchParams() {
  const cookieStore = await cookies();
  const comId = cookieStore.get(STORAGE_KEYS.COMPANY_ID)?.value || "1";

  return { com: comId };
}

export async function getAllAdjustmentVouchersAction(params?: IParams) {
  const { com } = await getBranchParams();

  return voucherService.getByType(ADJUSTMENT_VOUCHER_TYPE, {
    ...params,
    xcom_id: com,
  });
}

export async function getAdjustmentVoucherByIdAction(id: number | string) {
  const { com } = await getBranchParams();

  return voucherService.getVoucherById(id, { xcom_id: com });
}

export async function getAdjustmentVoucherDetailsAction(voucherId: number) {
  const { com } = await getBranchParams();

  return voucherService.getDetails(voucherId, { xcom_id: com });
}

export async function getNextAdjustmentVoucherNumberAction() {
  return voucherService.getNextNumber(ADJUSTMENT_VOUCHER_TYPE);
}

export async function createAdjustmentVoucherAction(
  voucherData: Omit<SaveVoucherData, "vouch_type">,
  details: VoucherDetailData[] = [],
) {
  // adjustment vouchers typically don't have boxes or gold details
  const voucherBoxes: VoucherBoxData[] = [];
  const goldDetails: GVoucherDetailData[] = [];

  const result = await createVoucherAction(
    { ...voucherData, vouch_type: ADJUSTMENT_VOUCHER_TYPE },
    details,
    voucherBoxes,
    goldDetails,
  );

  if (result.success) {
    await revalidateAdjustmentPaths();
  }

  return result;
}

export async function updateAdjustmentVoucherAction(
  voucherData: Omit<SaveVoucherData, "vouch_type">,
  details: VoucherDetailData[] = [],
  deletedDetailIds: number[] = [],
  voucherRecordId?: number,
) {
  // adjustment vouchers typically don't have boxes or gold details
  const voucherBoxes: VoucherBoxData[] = [];
  const deletedBoxIds: number[] = [];
  const goldDetails: GVoucherDetailData[] = [];
  const deletedGoldDetailIds: number[] = [];

  const result = await updateVoucherAction(
    { ...voucherData, vouch_type: ADJUSTMENT_VOUCHER_TYPE },
    details,
    deletedDetailIds,
    voucherRecordId,
    voucherBoxes,
    deletedBoxIds,
    goldDetails,
    deletedGoldDetailIds,
  );

  if (result.success) {
    await revalidateAdjustmentPaths(voucherRecordId);
  }

  return result;
}

export async function deleteAdjustmentVoucherAction(id: number) {
  const result = await deleteVoucherAction(id);

  if (result.success) {
    await revalidateAdjustmentPaths();
  }

  return result;
}

async function revalidateAdjustmentPaths(voucherId?: number) {
  revalidatePath("/forms/voucher");
  revalidatePath("/reports/vouchers");
  revalidateTag("vouchers");
  revalidateTag(`vouchers-type-${ADJUSTMENT_VOUCHER_TYPE}`);

  if (voucherId) {
    revalidatePath(`/forms/voucher/${voucherId}`);
    revalidateTag(`voucher-${voucherId}`);
  }
}
