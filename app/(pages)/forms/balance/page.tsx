import { Metadata } from "next";

import BalanceVoucherClientPage from "./BalanceVoucherClientPage";
import voucherFormDataService from "@/services/bff/voucher-form-data.service";
import Breadcrumb from "@/components/Breadcrumb";

export const metadata: Metadata = {
  title: "قيد افتتاحي جديد - NafeesWeb",
  description: "إنشاء قيد افتتاحي جديد",
};

const getBalanceVoucherFormData = voucherFormDataService.getBalanceVoucherFormData;

export default async function BalanceVoucherPage() {
  const formData = await getBalanceVoucherFormData();

  return (
    <div className="container mx-auto p-4">
      <Breadcrumb
        items={[
          { name: "القيود", href: "/forms/voucher?type=adjustment" },
          { name: "قيد افتتاحي", href: "/forms/balance" },
          { name: "جديدة" },
        ]}
      />
      <BalanceVoucherClientPage
        formData={formData}
        formMode="new"
        isNewVoucher={true}
      />
    </div>
  );
}
