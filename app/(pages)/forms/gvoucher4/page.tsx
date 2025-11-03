import { Metadata } from "next";

import CustomerGoldVoucherClientPage from "./CustomerGoldVoucherClientPage";

import voucherFormDataService from "@/services/bff/voucher-form-data.service";
import Breadcrumb from "@/components/Breadcrumb";

export const metadata: Metadata = {
  title: "سند قبض عميل - NafeesWeb",
  description: "إدارة سندات القبض للعملاء",
};

const getVoucherFormData = voucherFormDataService.getVoucherFormData;

export default async function CustomerReceiptVoucherPage() {
  const formData = await getVoucherFormData();

  return (
    <div className="container mx-auto p-4">
      <Breadcrumb
        items={[
          { name: "القيود", href: "/forms/voucher?type=adjustment" },
          { name: "القبض عملاء", href: "/forms/gvoucher4" },
          { name: "جديدة" },
        ]}
      />
      <CustomerGoldVoucherClientPage
        accounts={formData.accounts}
        boxes={formData.boxes || []}
        costCenters={formData.costCenters}
        customers={formData.customers || []}
        formMode="new"
        isNewVoucher={true}
        items={formData.items || []}
        startInEditMode={true}
        vouchType={4}
        voucherTypes={formData.voucherTypes}
      />
    </div>
  );
}
