import { Metadata } from "next";

import CustomerGoldVoucherClientPage from "../gvoucher4/CustomerGoldVoucherClientPage";
import voucherFormDataService from "@/services/bff/voucher-form-data.service";

export const metadata: Metadata = {
  title: "سند صرف عميل - NafeesWeb",
  description: "إدارة سندات الصرف للعملاء",
};

const getVoucherFormData = voucherFormDataService.getVoucherFormData;

export default async function CustomerPaymentVoucherPage() {
  const formData = await getVoucherFormData();

  return (
    <div className="container mx-auto p-4">
      <CustomerGoldVoucherClientPage
        accounts={formData.accounts}
        boxes={formData.boxes || []}
        costCenters={formData.costCenters}
        customers={formData.customers || []}
        formMode="new"
        isNewVoucher={true}
        items={formData.items || []}
        startInEditMode={true}
        vouchType={5}
        voucherTypes={formData.voucherTypes}
      />
    </div>
  );
}

