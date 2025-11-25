import { cache } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";

import VoucherClientPage from "@/app/[locale]/(pages)/forms/voucher/VoucherClientPage";
import voucherFormDataService from "@/services/bff/voucher-form-data.service";
import { voucherService } from "@/services/api";
import { Voucher, VoucherDetail } from "@/types/voucher";
import Breadcrumb from "@/components/Breadcrumb";
import { redirectToLogin } from "@/app/actions/auth";
import { AuthenticationError } from "@/utilities/errors/Authentication";

type VoucherPageType = "adjustment" | "receipt" | "payment" | "opening";
type VoucherFormMode = "new" | "edit" | "preview";

// استخدام الخدمة المحسنة مع cache
const getVoucherFormData = cache(() =>
  voucherFormDataService.getVoucherFormData(),
);

// Cache wrapper لـ getVoucherById (مثل الفواتير)
// إذا لم يتم تمرير vouchType، سيتم البحث في جميع الأنواع (xvouch_type="0")
const getVoucherById = cache(
  async (id: string | number, vouchType?: number) => {
    return voucherService.getVoucherById(id, {
      xvouch_type: vouchType !== undefined ? String(vouchType) : "0", // "0" = جميع الأنواع
    });
  },
);

// جلب قيد تسوية للحصول على navigationInfo
const getAdjustmentVoucherForNavigation = cache(async () => {
  try {
    const vouchersResponse = await voucherService.getAll({
      xvouch_type: "3", // قيد التسوية فقط
    });

    if (!vouchersResponse.success || !vouchersResponse.data) {
      return null;
    }

    const vouchers = Array.isArray(vouchersResponse.data)
      ? vouchersResponse.data
      : [];

    if (vouchers.length === 0) {
      return null;
    }

    // إرجاع أول سند في القائمة (عادة ما يحتوي على navigationInfo)
    return vouchers[0];
  } catch (error) {
    console.error("Error fetching adjustment voucher for navigation:", error);

    return null;
  }
});

const VOUCHER_TYPE_CONFIG: Record<
  VoucherPageType,
  {
    title: string;
    description: string;
    vouchType: number;
  }
> = {
  adjustment: {
    title: "قيد تسوية",
    description: "إدارة قيود التسوية",
    vouchType: 3,
  },
  receipt: {
    title: "سند قبض",
    description: "إدارة سندات القبض",
    vouchType: 1,
  },
  payment: {
    title: "سند صرف",
    description: "إدارة سندات الصرف",
    vouchType: 2,
  },
  opening: {
    title: "قيد افتتاحي",
    description: "إدارة القيود الافتتاحية",
    vouchType: 0,
  },
};

const FALLBACK_TYPE: VoucherPageType = "adjustment";

const toSingleValue = (
  value: string | string[] | undefined,
): string | undefined => {
  if (Array.isArray(value)) return value[0];

  return value;
};

const resolveVoucherType = (rawType: string | undefined): VoucherPageType => {
  if (!rawType) return FALLBACK_TYPE;
  const type = rawType.toLowerCase() as VoucherPageType;

  return type in VOUCHER_TYPE_CONFIG ? type : FALLBACK_TYPE;
};

const resolveFormMode = (rawMode: string | undefined): VoucherFormMode => {
  if (!rawMode) return "new";
  const mode = rawMode.toLowerCase();

  if (mode === "edit") return "edit";
  if (mode === "preview") return "preview";

  return "new";
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const params = await searchParams;
  const voucherType = resolveVoucherType(toSingleValue(params.type));
  const config = VOUCHER_TYPE_CONFIG[voucherType];

  return {
    title: config.title,
    description: config.description,
  };
}

export default async function VoucherPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  try {
  const params = await searchParams;

  const voucherType = resolveVoucherType(toSingleValue(params.type));
  const mode = resolveFormMode(toSingleValue(params.mode));
  const editId = toSingleValue(params.id);
  const startInEdit = toSingleValue(params.edit) === "true";

  if ((mode === "edit" || mode === "preview") && !editId) {
    notFound();
  }

  const config = VOUCHER_TYPE_CONFIG[voucherType];

  let voucherData: Voucher | null = null;
  let voucherDetailsData: VoucherDetail[] = [];

  const normalizeCost = (value: unknown): number | null => {
    if (value === undefined || value === null || value === "") {
      return null;
    }

    const numeric = Number(value);

    return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
  };

  if ((mode === "edit" || mode === "preview") && editId) {
    const lookupId = editId ?? "";

    // ✅ جلب السند مباشرة بالـ ID (مثل الفواتير) - سريع جداً
    // البحث أولاً في جميع الأنواع (xvouch_type="0") ثم في النوع المحدد إذا لزم الأمر
    const targetVoucher = await getVoucherById(lookupId); // بدون تحديد النوع = جميع الأنواع

    if (targetVoucher) {
      const targetVoucherWithId = targetVoucher as any; // API response contains additional fields

      const resolvedVoucherCost =
        normalizeCost(targetVoucher.cost_id) ??
        normalizeCost((targetVoucher as any)?.cost) ??
        null;

      voucherData = {
        ...targetVoucher,
        vouch_date: targetVoucher.vouch_date
          ? targetVoucher.vouch_date
          : new Date().toISOString(),
        cr_date: targetVoucher.cr_date || new Date().toISOString(),
        vouch_id: targetVoucher.vouch_id || 0,
        ref_no: targetVoucher.ref_no || "",
        vouch_notes: targetVoucher.vouch_notes || "",
        vouch_status: targetVoucher.vouch_status || 1,
        pay_type: targetVoucher.pay_type || 1,
        cost_id: resolvedVoucherCost,
      };

      // جلب تفاصيل السند
      const voucherRecordId = targetVoucherWithId.id || parseInt(lookupId);
      const branchId = Number(targetVoucherWithId.com_id ?? 1) || 1;
      const detailsResponse = await voucherService.getDetails(voucherRecordId, {
        com: branchId,
      });

      if (
        detailsResponse.success &&
        detailsResponse.data &&
        Array.isArray(detailsResponse.data)
      ) {
        voucherDetailsData = detailsResponse.data.map((detail: any) => ({
          ...detail,
          acc_id: detail.acc_id || detail.acc || 0,
          acc_code: detail.acc_code || "",
          acc_name: detail.acc_name || "",
          cost_id:
            normalizeCost(detail.cost_id) ?? normalizeCost(detail.cost) ?? 0,
          debit: detail.debit || 0,
          credit: detail.credit || 0,
          debit_base: detail.debit_base || detail.debit || 0,
          credit_base: detail.credit_base || detail.credit || 0,
          g_debit: detail.g_debit || detail.debit_g || 0,
          g_credit: detail.g_credit || detail.credit_g || 0,
          gauge: detail.gauge || 875,
          g_debit_base: detail.g_debit_base || 0,
          g_credit_base: detail.g_credit_base || 0,
          vouch_notes: detail.vouch_notes || "",
        }));
      }
    } else {
      notFound();
    }
  }

  const formData = await getVoucherFormData();

  // جلب navigationInfo عند إنشاء قيد تسوية جديد
  const voucherForNav =
    mode === "new" && config.vouchType === 3
      ? await getAdjustmentVoucherForNavigation()
      : null;

  // بناء navigationInfo من قيد التسوية
  const parseNavId = (value: unknown): number | null => {
    if (value === null || value === undefined || value === "") {
      return null;
    }

    const numeric = Number(value);

    return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
  };

  const navigationInfo = voucherForNav
    ? {
        previous: parseNavId(
          (voucherForNav as any).previous_voucher_id ??
            (voucherForNav as any).previous,
        ),
        next: parseNavId(
          (voucherForNav as any).next_voucher_id ?? (voucherForNav as any).next,
        ),
        first: parseNavId(
          (voucherForNav as any).first_voucher_id ??
            (voucherForNav as any).first,
        ),
        last: parseNavId(
          (voucherForNav as any).last_voucher_id ?? (voucherForNav as any).last,
        ),
      }
    : undefined;

  const newVoucherHref = `/forms/voucher?type=${encodeURIComponent(
    voucherType,
  )}&mode=new`;

  return (
    <div className="container mx-auto p-4">
      <Breadcrumb
        items={[
          { name: config.title, href: newVoucherHref },
          {
            name:
              mode === "new"
                ? "جديدة"
                : mode === "edit"
                  ? `تعديل ${voucherData?.vouch_id ?? editId ?? ""}`
                  : "معاينة",
          },
        ]}
      />
      <VoucherClientPage
        accounts={formData.accounts}
        caratTypes={formData.caratTypes}
        costCenters={formData.costCenters}
        formMode={mode}
        isNewVoucher={mode === "new"}
        navigationInfo={navigationInfo}
        newVoucherHref={newVoucherHref}
        startInEditMode={
          mode === "new"
            ? true // في وضع new، الحقول قابلة للتعديل دائماً
            : startInEdit || mode === "edit" // في وضع edit أو preview
        }
        vouchType={config.vouchType}
        voucherData={voucherData}
        voucherDetailsData={voucherDetailsData}
        voucherRecordId={voucherData?.id ?? null}
        voucherStatuses={formData.voucherStatuses}
        voucherTypes={formData.voucherTypes}
      />
    </div>
  );
  } catch (error) {
    if (error instanceof AuthenticationError) {
      await redirectToLogin();
    }

    throw error;
  }
}
