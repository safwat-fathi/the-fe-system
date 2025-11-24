"use client";

import { Card, CardBody } from "@heroui/react";

export default function TrialBalanceClient() {
  return (
    <div className="p-4 font-cairo">
      <Card>
        <CardBody className="text-center text-gray-600 space-y-2 py-10">
          <h2 className="text-xl font-semibold text-gray-800">
            تقرير ميزان المراجعة غير متاح حالياً
          </h2>
          <p className="text-sm text-gray-600">
            تم إيقاف تكامل دفتر الأستاذ العام لحين إعادة بنائه بالآلية الجديدة.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
