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
import { assertAuthorized } from "@/utilities/auth/authorization-server";
import { resolveVoucherSubject } from "@/utilities/auth/authorization-core";


const DELIVERY_VOUCHER_TYPE = 222;

async function getBranchParams() {
  const cookieStore = await cookies();
  const comId = cookieStore.get(STORAGE_KEYS.COMPANY_ID)?.value || "1";

  return { com: comId };
}

export async function getAllDeliveryVouchersAction(params?: IParams) {
  const { com } = await getBranchParams();

  return voucherService.getByType(DELIVERY_VOUCHER_TYPE, {
    ...params,
    xcom_id: com,
  });
}

export async function getDeliveryVoucherByIdAction(id: number | string) {
  const { com } = await getBranchParams();

  return voucherService.getVoucherById(id, { xcom_id: com });
}

export async function getDeliveryVoucherDetailsAction(voucherId: number) {
  const { com } = await getBranchParams();

  return voucherService.getDetails(voucherId, { xcom_id: com });
}

export async function getDeliveryVoucherBoxesAction(voucherId: number) {
  const { com } = await getBranchParams();

  return voucherService.getBoxes(voucherId, { xcom_id: com });
}

export async function getDeliveryVoucherGoldDetailsAction(voucherId: number) {
  const { com } = await getBranchParams();

  return voucherService.getGoldDetails(voucherId, { xcom_id: com });
}

export async function getNextDeliveryVoucherNumberAction() {
  return voucherService.getNextNumber(DELIVERY_VOUCHER_TYPE);
}

export async function createDeliveryVoucherAction(
  voucherData: Omit<SaveVoucherData, "vouch_type">,
  details: VoucherDetailData[] = [],
  voucherBoxes: VoucherBoxData[] = [],
  goldDetails: GVoucherDetailData[] = [],
) {
  await assertAuthorized({
    subject: resolveVoucherSubject(DELIVERY_VOUCHER_TYPE),
    action: "create",
  });

  const result = await createVoucherAction(
    { ...voucherData, vouch_type: DELIVERY_VOUCHER_TYPE },
    details,
    voucherBoxes,
    goldDetails,
  );

  if (result.success) {
    await revalidateDeliveryPaths();
  }

  return result;
}

export async function updateDeliveryVoucherAction(
  voucherData: Omit<SaveVoucherData, "vouch_type">,
  details: VoucherDetailData[] = [],
  deletedDetailIds: number[] = [],
  voucherRecordId?: number,
  voucherBoxes: VoucherBoxData[] = [],
  deletedBoxIds: number[] = [],
  goldDetails: GVoucherDetailData[] = [],
  deletedGoldDetailIds: number[] = [],
) {
  await assertAuthorized({
    subject: resolveVoucherSubject(DELIVERY_VOUCHER_TYPE),
    action: "update",
  });

  const result = await updateVoucherAction(
    { ...voucherData, vouch_type: DELIVERY_VOUCHER_TYPE },
    details,
    deletedDetailIds,
    voucherRecordId,
    voucherBoxes,
    deletedBoxIds,
    goldDetails,
    deletedGoldDetailIds,
  );

  if (result.success) {
    await revalidateDeliveryPaths(voucherRecordId);
  }

  return result;
}

export async function deleteDeliveryVoucherAction(id: number) {
  await assertAuthorized({
    subject: resolveVoucherSubject(DELIVERY_VOUCHER_TYPE),
    action: "delete",
  });

  const result = await deleteVoucherAction(id);

  if (result.success) {
    await revalidateDeliveryPaths();
  }

  return result;
}

async function revalidateDeliveryPaths(voucherId?: number) {
  revalidatePath("/forms/delivery");
  revalidatePath("/reports/vouchers");
  revalidateTag("vouchers");
  revalidateTag(`vouchers-type-${DELIVERY_VOUCHER_TYPE}`);

  if (voucherId) {
    revalidatePath(`/forms/delivery/${voucherId}`);
    revalidateTag(`voucher-${voucherId}`);
  }
}
