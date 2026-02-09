import type { DeliveryCategory } from "../useDeliveryForm";

import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import DeliveryVoucherClientPage from "../DeliveryVoucherClientPage";

import deliveryFormDataService from "@/services/bff/delivery-form-data.service";
import Breadcrumb from "@/components/Breadcrumb";
import { redirectToLogin } from "@/app/actions/auth";
import { AuthenticationError } from "@/utilities/errors/Authentication";

export const metadata: Metadata = {
  title: "عرض سند تسليم - NafeesWeb",
  description: "عرض وتعديل سند التسليم",
};

export default async function DeliveryVoucherEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
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

    // Fetch form data and voucher data in parallel
    const formData = await deliveryFormDataService.getDeliveryFormData();

    const voucherData = await deliveryFormDataService.getVoucherWithDetails(
      voucherId,
      formData,
    );

    if (!voucherData.voucher) {
      notFound();
    }

    const t = await getTranslations("navigation.breadcrumbs.segments");

    const voucherIdForBreadcrumb =
      voucherData.voucher.vouch_id || voucherData.voucher.id || "";
    const breadcrumbLabel =
      formMode === "edit"
        ? `${t("edit")} ${voucherIdForBreadcrumb}`
        : t("preview");

    return (
      <div className="container mx-auto p-4">
        <Breadcrumb
          items={[
            { name: "", segmentKey: "delivery", href: "/forms/delivery" },
            {
              name: breadcrumbLabel,
            },
          ]}
        />
        <DeliveryVoucherClientPage
          accounts={formData.accounts}
          boxes={formData.boxes}
          categories={formData.categories as DeliveryCategory[]}
          costCenters={formData.costCenters}
          customers={formData.customers}
          formMode={formMode}
          goldBoxes={formData.goldBoxes}
          goldDetailsData={voucherData.goldDetails}
          isNewVoucher={false}
          items={formData.items}
          navigationInfo={voucherData.navigationInfo}
          startInEditMode={startInEditMode}
          vouchType={222}
          voucherBoxes={voucherData.voucherBoxes}
          voucherData={voucherData.voucher}
          voucherRecordId={voucherData.voucher.id}
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
