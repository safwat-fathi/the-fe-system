import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import VoucherClientPage from "../AdjustmentVoucherClientPage";
import VoucherStatusCheckboxes from "../components/VoucherStatusCheckboxes";

import adjustmentVoucherFormDataService from "@/services/bff/adjustment-voucher-form-data.service";
import Breadcrumb from "@/components/Breadcrumb";
import { redirectToLogin } from "@/app/actions/auth";
import { AuthenticationError } from "@/utilities/errors/Authentication";

export const metadata: Metadata = {
  title: "تعديل قيد تسوية - NafeesWeb",
  description: "عرض وتعديل قيد التسوية",
};

export default async function VoucherEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("forms.adjustment");

  try {
    const { id } = await params;
    const searchParamsData = await searchParams;
    const mode = Array.isArray(searchParamsData.mode)
      ? searchParamsData.mode[0]
      : searchParamsData.mode;

    const formMode = mode === "edit" ? "edit" : "preview";
    const startInEditMode = mode === "edit";

    const voucherId = parseInt(id);

    if (isNaN(voucherId) || voucherId <= 0) {
      notFound();
    }
    const formData =
      await adjustmentVoucherFormDataService.getAdjustmentVoucherFormData();

    const voucherData =
      await adjustmentVoucherFormDataService.getAdjustmentVoucherWithDetails(
        voucherId,
        formData,
      );

    if (!voucherData.voucher) {
      notFound();
    }

    const { voucher, details, navigationInfo } = voucherData;

    const getVoucherTitle = (vouchType: number) => {
      switch (vouchType) {
        case 1:
          return "سند قبض";
        case 2:
          return "سند صرف";
        case 3:
          return t("breadcrumbs.list");
        default:
          return "قيد";
      }
    };

    const voucherTitle = getVoucherTitle(voucher.vouch_type || 3);
    const newVoucherHref = `/forms/adjustment?type=${
      voucher.vouch_type === 1
        ? "receipt"
        : voucher.vouch_type === 2
          ? "payment"
          : "adjustment"
    }&mode=new`;

    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-between mb-2">
          <Breadcrumb
            items={[
              { name: voucherTitle, href: newVoucherHref },
              {
                name:
                  formMode === "edit"
                    ? t("breadcrumbs.edit", {
                        id: voucher.vouch_id || voucher.id || "",
                      })
                    : t("breadcrumbs.preview"),
              },
            ]}
          />
          <VoucherStatusCheckboxes
            commit={voucher.commit}
            post={voucher.post}
            print={voucher.print}
          />
        </div>
        <VoucherClientPage
          accounts={formData.accounts}
          caratTypes={formData.caratTypes}
          costCenters={formData.costCenters}
          formMode={formMode}
          isNewVoucher={false}
          navigationInfo={navigationInfo}
          newVoucherHref={newVoucherHref}
          startInEditMode={startInEditMode}
          vouchType={voucher.vouch_type}
          voucherData={voucher}
          voucherDetailsData={details}
          voucherRecordId={voucher.id}
          voucherVouchId={Number(voucher.vouch_id) || 0}
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
