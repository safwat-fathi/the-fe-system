import { Metadata } from "next";

import CashReceiptVoucherClientPage from "../voucher1/CashReceiptVoucherClientPage";
import voucherFormDataService from "@/services/bff/voucher-form-data.service";

export const metadata: Metadata = {
  title: "سند صرف - NafeesWeb",
  description: "إدارة سندات الصرف",
};

const getVoucherFormData = voucherFormDataService.getVoucherFormData;

export default async function PaymentVoucherPage() {
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
        vouchType={2}
        voucherTypes={formData.voucherTypes}
        voucherStatuses={formData.voucherStatuses}
      />
    </div>
  );
}

