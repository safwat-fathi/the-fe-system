import { cache } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";

import VoucherClientPage from "@/app/(pages)/forms/voucher/VoucherClientPage";
import voucherFormDataService from "@/services/bff/voucher-form-data.service";
import { voucherService } from "@/services/api";
import { Voucher, VoucherDetail } from "@/types/voucher";
import Breadcrumb from "@/components/Breadcrumb";

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

  if ((mode === "edit" || mode === "preview") && editId) {
    const lookupId = editId ?? "";

    // ✅ جلب السند مباشرة بالـ ID (مثل الفواتير) - سريع جداً
    // البحث أولاً في جميع الأنواع (xvouch_type="0") ثم في النوع المحدد إذا لزم الأمر
    let targetVoucher = await getVoucherById(lookupId); // بدون تحديد النوع = جميع الأنواع

    if (targetVoucher) {
      const targetVoucherWithId = targetVoucher as any; // API response contains additional fields
      
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
      };

      // جلب تفاصيل السند
      const voucherRecordId = targetVoucherWithId.id || parseInt(lookupId);
      const branchId =
        Number(targetVoucherWithId.com_id ?? 1) || 1;
      const detailsResponse = await voucherService.getDetails(
        voucherRecordId,
        { com: branchId },
      );

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
          cost_id: detail.cost_id || 0,
          debit: detail.debit || 0,
          credit: detail.credit || 0,
          debit_g: detail.debit_g || 0,
          credit_g: detail.credit_g || 0,
          gauge: detail.gauge || 875,
          vouch_notes: detail.vouch_notes || "",
        }));
      }
    } else {
      notFound();
    }
  }

  const formData = await getVoucherFormData();

  const newVoucherHref = `/forms/voucher?type=${encodeURIComponent(
    voucherType,
  )}&mode=new`;

  return (
    <div className="container mx-auto p-4">
      <Breadcrumb
        items={[
          { name: "القيود", href: "/forms/voucher?type=adjustment" },
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
}
