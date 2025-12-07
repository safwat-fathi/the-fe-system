import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import CustomerGoldVoucherClientPage from "../gvoucher4/CustomerGoldVoucherClientPage";

import voucherFormDataService from "@/services/bff/voucher-form-data.service";
import Breadcrumb from "@/components/Breadcrumb";

export const metadata: Metadata = {
  title: "سند صرف عميل - NafeesWeb",
  description: "إدارة سندات الصرف للعملاء",
};

const getVoucherFormData = voucherFormDataService.getVoucherFormData;

export default async function CustomerPaymentVoucherPage() {
  const formData = await getVoucherFormData({ goldBoxes: true });
  const t = await getTranslations("navigation.breadcrumbs.segments");

  return (
    <div className="container mx-auto p-4">
      <Breadcrumb
        items={[
          { name: "", segmentKey: "gvoucher5", href: "/forms/gvoucher5" },
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
        vouchType={5}
        voucherTypes={formData.voucherTypes}
      />
    </div>
  );
}
