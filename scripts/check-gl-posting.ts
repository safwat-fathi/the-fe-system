#!/usr/bin/env ts-node
/**
 * GL posting regression checker
 *
 * يفترض أن يُشغَّل على بيئة التطوير للتحقق من أن القيود المُرحَّلة
 * متوازنة ومطابقة للتوقعات لكل سند نموذجي.
 *
 * المتطلبات:
 * - Node.js 18+
 * - تعيين المتغيرات البيئية التالية:
 *   - NEXT_PUBLIC_API_BASE_URL : عنوان الـ API (مثال: https://example.com)
 *   - API_ACCESS_TOKEN         : رمز الوصول (Bearer) المستخدم للمصادقة
 *
 * الاستخدام:
 *   npx ts-node scripts/check-gl-posting.ts
 *
 * يمكن تعديل قائمة السندات النموذجية أدناه لتغطية الأنواع المختلفة.
 */

import "dotenv/config";

type Numeric = number | string | null | undefined;

interface SampleVoucherConfig {
  label: string;
  voucherType: number;
  voucherNumber: number;
  expectations?: {
    detailLines?: number;
    cashSum?: number;
    goldSum?: number;
  };
}

interface VoucherSnapshot {
  voucherId: number;
  masterId: number;
  details: any[];
  boxes: any[];
  goldDetails: any[];
  transactions: any[];
}

const SAMPLE_VOUCHERS: SampleVoucherConfig[] = [
  /**
   * أمثلة جاهزة يمكن للمطور تعديلها بسرعة بحسب البيانات المتاحة في قاعدة البيانات.
   * يوصى بوجود سند لكل نوع رئيسي (افتتاحي، قبض، صرف، قبض عميل، صرف عميل، تسوية).
   */
  {
    label: "Opening entry sanity check",
    voucherType: 0,
    voucherNumber: 51,
    expectations: {
      detailLines: 3,
    },
  },
  {
    label: "Cash receipt voucher baseline",
    voucherType: 1,
    voucherNumber: 1001,
  },
];

function assertEnv(value: string | undefined, key: string): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable ${key}. ` +
        `Please define it before running the script.`,
    );
  }

  return value;
}

function parseAmount(value: Numeric): number {
  if (value === null || value === undefined) {
    return 0;
  }

  if (typeof value === "number") {
    return value;
  }

  const normalized = String(value).replace(/,/g, "").trim();
  const numeric = Number(normalized);

  return Number.isFinite(numeric) ? numeric : 0;
}

async function fetchJson<T = any>(
  baseUrl: string,
  path: string,
  params: Record<string, Numeric> = {},
  options: RequestInit = {},
): Promise<T> {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    query.append(key, String(value));
  });

  const url = new URL(path, baseUrl);
  if ([...query.keys()].length > 0) {
    url.search = query.toString();
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Request to ${url.toString()} failed: ${response.status} ${response.statusText}\n${body}`,
    );
  }

  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    return (await response.json()) as T;
  }

  throw new Error(
    `Unexpected content type for ${url.toString()}: ${contentType}`,
  );
}

async function getVoucherSnapshot(
  baseUrl: string,
  token: string,
  voucherType: number,
  voucherNumber: number,
): Promise<VoucherSnapshot> {
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // جلب السند الرئيسي لمعرفة الـ masterId
  const voucherList: any = await fetchJson(
    baseUrl,
    "/vouchers_list",
    {
      xcom_id: "1",
      xyear_id: "0",
      xvouch_type: voucherType,
      xvouch_id: voucherNumber,
      xfrom_date: "0",
      xto_date: "0",
      page: "1",
    },
    { headers },
  );

  const voucherResults: any[] = Array.isArray(voucherList?.results)
    ? voucherList.results
    : Array.isArray(voucherList)
      ? voucherList
      : [];

  if (voucherResults.length === 0) {
    throw new Error(
      `Voucher ${voucherNumber} (type ${voucherType}) not found in vouchers_list API.`,
    );
  }

  const voucher = voucherResults[0];
  const masterId = Number(voucher.id ?? voucher.vouch_id);

  if (!Number.isFinite(masterId)) {
    throw new Error(
      `Unable to resolve master ID for voucher ${voucherNumber} (type ${voucherType}).`,
    );
  }

  const [detailsResponse, boxesResponse, goldDetailsResponse, glResponse] =
    await Promise.all([
      fetchJson(
        baseUrl,
        "/vouchers_dtl_list",
        {
          xvouch_id: masterId,
          xcom_id: "1",
          page: "1",
        },
        { headers },
      ),
      fetchJson(
        baseUrl,
        "/vouchers_box_list",
        {
          xvouch_id: masterId,
          xcom_id: "1",
        },
        { headers },
      ),
      fetchJson(
        baseUrl,
        "/gvouchers_dtl_list",
        {
          xvouch_id: masterId,
          xcom_id: "1",
          page: "1",
        },
        { headers },
      ),
      fetchJson(
        baseUrl,
        "/gl_transaction_list",
        {
          xtrans_id: voucherNumber,
          xtrans_type: voucherType,
          xcom_id: "1",
          xyear_id: "0",
          xfrom_date: "0",
          xto_date: "0",
        },
        { headers },
      ),
    ]);

  const mapResponse = (payload: any): any[] => {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.results)) return payload.results;
    return [];
  };

  return {
    voucherId: Number(voucherNumber),
    masterId,
    details: mapResponse(detailsResponse),
    boxes: mapResponse(boxesResponse),
    goldDetails: mapResponse(goldDetailsResponse),
    transactions: mapResponse(glResponse),
  };
}

function summarizeDetails(snapshot: VoucherSnapshot) {
  const detailTotals = snapshot.details.reduce(
    (acc, detail) => {
      acc.debit += parseAmount(detail.debit_base ?? detail.debit);
      acc.credit += parseAmount(detail.credit_base ?? detail.credit);
      acc.goldDebit += parseAmount(detail.g_debit_base ?? detail.g_debit);
      acc.goldCredit += parseAmount(detail.g_credit_base ?? detail.g_credit);

      return acc;
    },
    { debit: 0, credit: 0, goldDebit: 0, goldCredit: 0 },
  );

  const glTotals = snapshot.transactions.reduce(
    (acc, trx) => {
      acc.debit += parseAmount(trx.debit_base ?? trx.debit);
      acc.credit += parseAmount(trx.credit_base ?? trx.credit);
      acc.goldDebit += parseAmount(trx.g_debit_base ?? trx.g_debit);
      acc.goldCredit += parseAmount(trx.g_credit_base ?? trx.g_credit);

      return acc;
    },
    { debit: 0, credit: 0, goldDebit: 0, goldCredit: 0 },
  );

  return {
    detailTotals,
    glTotals,
  };
}

function compareTotals(
  label: string,
  details: { debit: number; credit: number; goldDebit: number; goldCredit: number },
  glTotals: { debit: number; credit: number; goldDebit: number; goldCredit: number },
) {
  const fmt = (value: number) => value.toFixed(2);
  const tolerance = 0.01;

  const checks: Array<{ field: keyof typeof details; caption: string }> = [
    { field: "debit", caption: "إجمالي المدين" },
    { field: "credit", caption: "إجمالي الدائن" },
    { field: "goldDebit", caption: "ذهب مدين" },
    { field: "goldCredit", caption: "ذهب دائن" },
  ];

  const failures: string[] = [];

  for (const check of checks) {
    const detailValue = details[check.field];
    const glValue = glTotals[check.field];
    const diff = Math.abs(detailValue - glValue);

    if (diff > tolerance) {
      failures.push(
        `${check.caption}: تفاصيل=${fmt(detailValue)} GL=${fmt(glValue)} (فرق ${fmt(diff)})`,
      );
    }
  }

  if (failures.length > 0) {
    console.error(`❌ ${label} - اختلاف بين تفاصيل السند وترحيل GL:`);
    failures.forEach((msg) => console.error(`   - ${msg}`));
  } else {
    console.log(`✅ ${label} - totals match (details vs GL).`);
  }
}

async function runSample(config: SampleVoucherConfig): Promise<void> {
  const baseUrl = assertEnv(process.env.NEXT_PUBLIC_API_BASE_URL, "NEXT_PUBLIC_API_BASE_URL");
  const token = assertEnv(process.env.API_ACCESS_TOKEN, "API_ACCESS_TOKEN");

  const snapshot = await getVoucherSnapshot(
    baseUrl,
    token,
    config.voucherType,
    config.voucherNumber,
  );

  const { detailTotals, glTotals } = summarizeDetails(snapshot);

  console.log("\n─────────────────────────────────────────────");
  console.log(`📄 ${config.label}`);
  console.log(
    `   Voucher #${config.voucherNumber} (type ${config.voucherType}) – masterId ${snapshot.masterId}`,
  );
  console.log(
    `   تفاصيل: ${snapshot.details.length} | صناديق: ${snapshot.boxes.length} | ذهب: ${snapshot.goldDetails.length} | GL: ${snapshot.transactions.length}`,
  );

  if (config.expectations?.detailLines !== undefined) {
    const expected = config.expectations.detailLines;
    if (snapshot.details.length !== expected) {
      console.warn(
        `   ⚠️ عدد تفاصيل مختلف عن المتوقع. المتوقع=${expected} الفعلي=${snapshot.details.length}`,
      );
    } else {
      console.log(`   ✅ عدد التفاصيل مطابق (${expected})`);
    }
  }

  if (config.expectations?.cashSum !== undefined) {
    const expected = config.expectations.cashSum;
    const diff = Math.abs(detailTotals.debit - detailTotals.credit);
    if (Math.abs(detailTotals.debit - expected) > 0.01) {
      console.warn(
        `   ⚠️ إجمالي النقد في التفاصيل ${detailTotals.debit.toFixed(
          2,
        )} لا يطابق التوقع ${expected.toFixed(2)}`,
      );
    } else {
      console.log(
        `   ✅ إجمالي النقد مطابق (${expected.toFixed(2)}) | فرق المدين/الدائن في التفاصيل ${diff.toFixed(2)}`,
      );
    }
  }

  if (config.expectations?.goldSum !== undefined) {
    const expected = config.expectations.goldSum;
    const goldDiff = Math.abs(detailTotals.goldDebit - detailTotals.goldCredit);
    if (Math.abs(detailTotals.goldDebit - expected) > 0.01) {
      console.warn(
        `   ⚠️ إجمالي الذهب في التفاصيل ${detailTotals.goldDebit.toFixed(
          2,
        )} لا يطابق التوقع ${expected.toFixed(2)}`,
      );
    } else {
      console.log(
        `   ✅ إجمالي الذهب مطابق (${expected.toFixed(2)}) | فرق الذهب في التفاصيل ${goldDiff.toFixed(2)}`,
      );
    }
  }

  compareTotals(config.label, detailTotals, glTotals);

  const glBalanceDiffCash = Math.abs(glTotals.debit - glTotals.credit);
  const glBalanceDiffGold = Math.abs(glTotals.goldDebit - glTotals.goldCredit);

  if (glBalanceDiffCash > 0.01 || glBalanceDiffGold > 0.01) {
    console.error(
      `   ❌ GL غير متوازن: نقد (${glBalanceDiffCash.toFixed(
        2,
      )}) | ذهب (${glBalanceDiffGold.toFixed(2)})`,
    );
  } else {
    console.log(
      `   ✅ GL متوازن: نقد (${glTotals.debit.toFixed(2)} = ${glTotals.credit.toFixed(2)}) | ذهب (${glTotals.goldDebit.toFixed(2)} = ${glTotals.goldCredit.toFixed(2)})`,
    );
  }
}

async function main() {
  console.log("🚀 Starting GL posting regression check…");

  for (const sample of SAMPLE_VOUCHERS) {
    try {
      await runSample(sample);
    } catch (error) {
      console.error(`\n❌ Failed to validate sample "${sample.label}":`);
      console.error(error instanceof Error ? error.message : error);
    }
  }

  console.log("\n✅ Completed GL posting checks.\n");
  console.log(
    "ملاحظة: يمكن تعديل قائمة SAMPLE_VOUCHERS لإضافة سندات جديدة، أو تحديث التوقعات بحسب بيانات قاعدة البيانات الفعلية.",
  );
}

main().catch((error) => {
  console.error("Fatal error while running GL posting checks:", error);
  process.exitCode = 1;
});

