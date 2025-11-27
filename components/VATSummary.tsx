"use client";

import React from "react";
import { Card, CardBody } from "@heroui/react";

import { formatAmount } from "@/utilities/formatAmount";
import useFractions from "@/utilities/useFractions";

interface VATSummaryProps {
  totalSalesVAT: number;
  totalPurchasesVAT: number;
  netVAT: number;
  totalInvoices: number;
  period: string;
}

export default function VATSummary({
  totalSalesVAT,
  totalPurchasesVAT,
  netVAT,
  totalInvoices,
}: VATSummaryProps) {
  const fractions = useFractions() as { frac: number; frac2: number };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
        <CardBody className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold">
              {formatAmount(totalSalesVAT, fractions.frac)}
            </div>
            <div className="text-sm opacity-90">إجمالي ضريبة المبيعات</div>
          </div>
        </CardBody>
      </Card>

      <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <CardBody className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold">
              {formatAmount(totalPurchasesVAT, fractions.frac)}
            </div>
            <div className="text-sm opacity-90">إجمالي ضريبة المشتريات</div>
          </div>
        </CardBody>
      </Card>

      <Card
        className={`bg-gradient-to-r ${netVAT >= 0 ? "from-red-500 to-red-600" : "from-green-500 to-green-600"} text-white`}
      >
        <CardBody className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold">
              {formatAmount(Math.abs(netVAT), fractions.frac)}
            </div>
            <div className="text-sm opacity-90">
              {netVAT >= 0 ? "الضريبة المستحقة" : "الضريبة المستردة"}
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
        <CardBody className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{totalInvoices}</div>
            <div className="text-sm opacity-90">عدد الفواتير</div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
