import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import CustomerGoldVoucherClientPage from "./CustomerGoldVoucherClientPage";

import voucherFormDataService from "@/services/bff/voucher-form-data.service";
import Breadcrumb from "@/components/Breadcrumb";

export const metadata: Metadata = {
  title: "سند قبض عميل - NafeesWeb",
  description: "إدارة سندات القبض للعملاء",
};

const getVoucherFormData = voucherFormDataService.getVoucherFormData;

export default async function CustomerReceiptVoucherPage() {
  const formData = await getVoucherFormData({ goldBoxes: true });
  const t = await getTranslations("navigation.breadcrumbs.segments");

  return (
    <div className="container mx-auto p-4">
      <Breadcrumb
        items={[
          { name: "", segmentKey: "gvoucher4", href: "/forms/gvoucher4" },
          { name: "", segmentKey: "new" },
        ]}
      />
      <CustomerGoldVoucherClientPage
        accounts={formData.accounts}
        boxes={formData.boxes || []}
        categories={formData.categories || []}
        costCenters={formData.costCenters}
        customers={formData.customers || []}
        formMode="new"
        goldBoxes={formData.goldBoxes || formData.boxes || []}
        isNewVoucher={true}
        items={formData.items || []}
        startInEditMode={true}
        vouchType={4}
        voucherTypes={formData.voucherTypes}
      />
    </div>
  );
}
