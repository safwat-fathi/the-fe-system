import type { DeliveryCategory } from "./useDeliveryForm";

import { Metadata } from "next";
import { cache, Suspense } from "react";

import DeliveryVoucherClientPage from "./DeliveryVoucherClientPage";

import deliveryFormDataService from "@/services/bff/delivery-form-data.service";
import Breadcrumb from "@/components/Breadcrumb";
import { redirectToLogin } from "@/app/actions/auth";
import { AuthenticationError } from "@/utilities/errors/Authentication";

export const metadata: Metadata = {
  title: "سند تسليم - NafeesWeb",
  description: "إدارة سندات التسليم",
};

function DeliveryFormFallback() {
  return (
    <div className="p-4 my-4 bg-white rounded-lg shadow-sm border border-gray-200 min-h-[600px] flex items-center justify-center">
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    </div>
  );
}

const getDeliveryFormData = cache(async () => {
  return await deliveryFormDataService.getDeliveryFormData();
});

export default async function DeliveryVoucherPage() {
  try {
    const formData = await getDeliveryFormData();

    return (
      <div className="container mx-auto p-4">
        <Breadcrumb
          items={[
            { name: "", segmentKey: "delivery", href: "/forms/delivery" },
            { name: "", segmentKey: "new" },
          ]}
        />
        <Suspense key={"delivery-page"} fallback={<DeliveryFormFallback />}>
          <DeliveryVoucherClientPage
            accounts={formData.accounts}
            boxes={formData.boxes}
            categories={formData.categories as DeliveryCategory[]}
            costCenters={formData.costCenters}
            customers={formData.customers}
            formMode="new"
            goldBoxes={formData.goldBoxes}
            isNewVoucher={true}
            items={formData.items}
            startInEditMode={true}
            vouchType={222}
            voucherTypes={formData.voucherTypes}
          />
        </Suspense>
      </div>
    );
  } catch (error) {
    if (error instanceof AuthenticationError) {
      await redirectToLogin();
    }

    throw error;
  }
}
