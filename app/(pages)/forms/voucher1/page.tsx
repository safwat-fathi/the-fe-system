import { Metadata } from "next";

import CashReceiptVoucherClientPage from "./CashReceiptVoucherClientPage";
import voucherFormDataService from "@/services/bff/voucher-form-data.service";

export const metadata: Metadata = {
  title: "سند قبض - NafeesWeb",
  description: "إدارة سندات القبض",
};

const getVoucherFormData = voucherFormDataService.getVoucherFormData;

export default async function ReceiptVoucherPage() {
  const formData = await getVoucherFormData();

  return (
    <div className="container mx-auto p-4">
      <CashReceiptVoucherClientPage
        accounts={formData.accounts}
        boxes={formData.boxes}
        costCenters={formData.costCenters}
        formMode="new"
        isNewVoucher={true}
        startInEditMode={true}
        vouchType={1}
        voucherTypes={formData.voucherTypes}
        voucherStatuses={formData.voucherStatuses}
      />
    </div>
  );
}

