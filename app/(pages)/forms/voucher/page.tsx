import { Metadata } from "next";
import { notFound } from "next/navigation";

import VoucherClientPage from "@/app/(pages)/forms/voucher/VoucherClientPage";
import voucherFormDataService from "@/services/bff/voucher-form-data.service";
import { voucherService } from "@/services/api";
import { Voucher, VoucherDetail } from "@/types/voucher";

type VoucherPageType = "adjustment" | "receipt" | "payment" | "opening";
type VoucherFormMode = "new" | "edit" | "preview";

// استخدام الخدمة المحسنة
const getVoucherFormData = voucherFormDataService.getVoucherFormData;

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

    // جلب السند
    const vouchersResponse = await voucherService.getAll();

    if (
      vouchersResponse.success &&
      vouchersResponse.data &&
      Array.isArray(vouchersResponse.data)
    ) {
      const targetVoucher = vouchersResponse.data.find(
        (v: any) => v.id === parseInt(lookupId),
      );

      if (targetVoucher) {
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
        const voucherRecordId = targetVoucher.id || parseInt(lookupId);
        const branchId =
          Number(targetVoucher.com_id ?? targetVoucher.com ?? 1) || 1;
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
            tax: detail.tax || 0,
            tax_prc: detail.tax_prc || 0,
            vat_no: detail.vat_no || 0,
            vouch_notes: detail.vouch_notes || "",
          }));
        }
      }
    }

    if (!voucherData) {
      notFound();
    }
  }

  const formData = await getVoucherFormData();

  const newVoucherHref = `/forms/voucher?type=${encodeURIComponent(
    voucherType,
  )}&mode=new`;

  return (
    <div className="container mx-auto p-4">
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
        taxRates={formData.taxRates}
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
