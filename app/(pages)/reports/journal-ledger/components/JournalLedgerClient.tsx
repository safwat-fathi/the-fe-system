"use client";

import { Card, CardBody } from "@heroui/react";

export default function JournalLedgerClient() {
  return (
    <div className="p-4 font-cairo">
      <Card>
        <CardBody className="text-center text-gray-600 space-y-2 py-10">
          <h2 className="text-xl font-semibold text-gray-800">
            تقرير دفتر اليومية غير متاح حالياً
          </h2>
          <p className="text-sm text-gray-600">
            نعمل على إعادة تصميم نظام الترحيل المحاسبي، وسيعود التقرير قريباً.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}

