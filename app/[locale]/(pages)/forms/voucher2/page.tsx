import { Metadata } from "next";
import { cache } from "react";

import CashReceiptVoucherClientPage from "../voucher1/CashReceiptVoucherClientPage";

import voucherFormDataService from "@/services/bff/voucher-form-data.service";
import { voucherService } from "@/services/api";
import Breadcrumb from "@/components/Breadcrumb";
import { redirectToLogin } from "@/app/actions/auth";
import { AuthenticationError } from "@/utilities/errors/Authentication";

export const metadata: Metadata = {
  title: "سند صرف - NafeesWeb",
  description: "إدارة سندات الصرف",
};

const getVoucherFormData = voucherFormDataService.getVoucherFormData;

// جلب سند صرف للحصول على navigationInfo
// نحاول جلب أي سند صرف للحصول على معلومات التنقل
const getPaymentVoucherForNavigation = cache(async () => {
  try {
    const vouchersResponse = await voucherService.getAll({
      xvouch_type: "2", // سند الصرف فقط
    });

    if (!vouchersResponse.success || !vouchersResponse.data) {
      return null;
    }

    const vouchers = Array.isArray(vouchersResponse.data)
      ? vouchersResponse.data
      : [];

    if (vouchers.length === 0) {
      return null;
    }

    // إرجاع أول سند في القائمة (عادة ما يحتوي على navigationInfo)
    // navigationInfo موجود في كل سند ويشير إلى first_voucher_id و last_voucher_id
    return vouchers[0];
  } catch (error) {
    console.error("Error fetching payment voucher for navigation:", error);

    return null;
  }
});

export default async function PaymentVoucherPage() {
  try {
    const [formData, voucherForNav] = await Promise.all([
      getVoucherFormData(),
      getPaymentVoucherForNavigation(),
    ]);

    // بناء navigationInfo من سند الصرف
    const parseNavId = (value: unknown): number | null => {
      if (value === null || value === undefined || value === "") {
        return null;
      }

      const numeric = Number(value);

      return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
    };

    const navigationInfo = voucherForNav
      ? {
          previous: parseNavId(
            (voucherForNav as any).previous_voucher_id ??
              (voucherForNav as any).previous,
          ),
          next: parseNavId(
            (voucherForNav as any).next_voucher_id ??
              (voucherForNav as any).next,
          ),
          first: parseNavId(
            (voucherForNav as any).first_voucher_id ??
              (voucherForNav as any).first,
          ),
          last: parseNavId(
            (voucherForNav as any).last_voucher_id ??
              (voucherForNav as any).last,
          ),
        }
      : undefined;

    return (
      <div className="container mx-auto p-4">
        <Breadcrumb
          items={[
            { name: "سند صرف", href: "/forms/voucher2" },
            { name: "جديدة" },
          ]}
        />
        <CashReceiptVoucherClientPage
          accounts={formData.accounts}
          boxes={formData.boxes}
          costCenters={formData.costCenters}
          formMode="new"
          isNewVoucher={true}
          navigationInfo={navigationInfo}
          startInEditMode={true}
          vouchType={2}
          voucherStatuses={formData.voucherStatuses}
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
