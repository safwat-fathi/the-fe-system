import type { VoucherDetailData } from "./types";
import type { NormalizedDetail } from "./process-details";

export const mapNormalizedDetailToVoucherDetail = (
  detail: NormalizedDetail,
): VoucherDetailData => ({
  id: detail.id,
  vouch_id: Number(detail.payload?.vouch ?? 0),
  acc_id: Number(detail.payload?.acc ?? 0),
  debit:
    typeof detail.payload?.debit === "number"
      ? detail.payload.debit
      : detail.debit,
  credit:
    typeof detail.payload?.credit === "number"
      ? detail.payload.credit
      : detail.credit,
  debit_base:
    typeof detail.payload?.debit_base === "number"
      ? detail.payload.debit_base
      : detail.debit,
  credit_base:
    typeof detail.payload?.credit_base === "number"
      ? detail.payload.credit_base
      : detail.credit,
  g_debit:
    typeof detail.payload?.g_debit === "number"
      ? detail.payload.g_debit
      : detail.gDebitBase,
  g_credit:
    typeof detail.payload?.g_credit === "number"
      ? detail.payload.g_credit
      : detail.gCreditBase,
  g_debit_base:
    typeof detail.payload?.g_debit_base === "number"
      ? detail.payload.g_debit_base
      : detail.gDebitBase,
  g_credit_base:
    typeof detail.payload?.g_credit_base === "number"
      ? detail.payload.g_credit_base
      : detail.gCreditBase,
  gauge:
    typeof detail.payload?.gauge === "number"
      ? detail.payload.gauge
      : 875,
  vouch_notes: detail.payload?.vouch_notes || "",
  cost_id:
    detail.payload?.cost !== undefined && detail.payload?.cost !== null
      ? Number(detail.payload.cost)
      : null,
});

