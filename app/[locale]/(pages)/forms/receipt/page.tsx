import { Metadata } from "next";

import ReceiptVoucherClientPage from "./ReceiptVoucherClientPage";

import voucherFormDataService from "@/services/bff/voucher-form-data.service";
import Breadcrumb from "@/components/Breadcrumb";

export const metadata: Metadata = {
  title: "سند استلام - NafeesWeb",
  description: "إدارة سندات الاستلام",
};

const getVoucherFormData = voucherFormDataService.getVoucherFormData;

export default async function ReceiptVoucherPage() {
  const formData = await getVoucherFormData({ goldBoxes: true });

  return (
    <div className="container mx-auto p-4">
      <Breadcrumb
        items={[
          { name: "سند استلام", href: "/forms/receipt" },
          { name: "جديدة" },
        ]}
      />
      <ReceiptVoucherClientPage
        accounts={formData.accounts}
        boxes={formData.boxes || []}
        goldBoxes={formData.goldBoxes || formData.boxes || []}
        costCenters={formData.costCenters}
        customers={formData.customers || []}
        formMode="new"
        isNewVoucher={true}
        items={formData.items || []}
        startInEditMode={true}
        vouchType={111}
        voucherTypes={formData.voucherTypes}
        categories={formData.categories || []}
      />
    </div>
  );
}
