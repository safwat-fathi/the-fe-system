import { Metadata } from "next";

import DeliveryVoucherClientPage from "./DeliveryVoucherClientPage";

import voucherFormDataService from "@/services/bff/voucher-form-data.service";
import Breadcrumb from "@/components/Breadcrumb";

export const metadata: Metadata = {
  title: "سند تسليم - NafeesWeb",
  description: "إدارة سندات التسليم",
};

const getVoucherFormData = voucherFormDataService.getVoucherFormData;

export default async function DeliveryVoucherPage() {
  const formData = await getVoucherFormData({ goldBoxes: true });

  return (
    <div className="container mx-auto p-4">
      <Breadcrumb
        items={[
          { name: "سند تسليم", href: "/forms/delivery" },
          { name: "جديدة" },
        ]}
      />
      <DeliveryVoucherClientPage
        accounts={formData.accounts}
        boxes={formData.boxes || []}
        goldBoxes={formData.goldBoxes || formData.boxes || []}
        costCenters={formData.costCenters}
        customers={formData.customers || []}
        formMode="new"
        isNewVoucher={true}
        items={formData.items || []}
        startInEditMode={true}
        vouchType={222}
        voucherTypes={formData.voucherTypes}
        categories={formData.categories || []}
      />
    </div>
  );
}
