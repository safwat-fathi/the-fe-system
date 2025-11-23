"use client";

import { Card, CardBody } from "@heroui/react";

export default function AccountStatementClient() {
  return (
    <div className="p-4 font-cairo">
      <Card>
        <CardBody className="text-center text-gray-600 space-y-2 py-10">
          <h2 className="text-xl font-semibold text-gray-800">
            كشف الحساب غير متاح حالياً
          </h2>
          <p className="text-sm text-gray-600">
            تمت إزالة بيانات دفتر الأستاذ العام مؤقتاً وسيتم توفير نسخة محدثة
            لاحقاً.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}

