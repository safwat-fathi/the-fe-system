import { Metadata } from "next";
import { Card, CardBody } from "@heroui/react";
import { LockClosedIcon } from "@heroicons/react/24/outline";

import Breadcrumb from "@/components/Breadcrumb";

export const metadata: Metadata = {
  title: "تقرير الإشعارات المدينة الضريبية - NafeesWeb",
  description: "تقرير الإشعارات المدينة الضريبية",
};

export default async function TaxDebitNotesPage() {
  return (
    <div className="responsive-container font-cairo">
      <Breadcrumb />
      <Card>
        <CardBody className="p-12 text-center">
          <LockClosedIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            هذه الميزة غير متوفرة حالياً
          </h2>
          <p className="text-gray-600">
            تقرير الإشعارات المدينة الضريبية سيتم تفعيله قريباً
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
