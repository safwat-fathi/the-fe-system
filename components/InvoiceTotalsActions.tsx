"use client";

import { Button } from "@heroui/react";
import { ReactNode } from "react";

interface Props {
  invoiceNumber: number;
  formattedDateTime: string;
  saveInvoice: () => void;
  previewInvoice: () => void;
  totalAmount: number;
  taxAmount: number;
  netAmount: number;
  children: ReactNode;
}

export default function InvoiceTotalsActions({
  invoiceNumber,
  formattedDateTime,
  saveInvoice,
  previewInvoice,
  totalAmount,
  taxAmount,
  netAmount,
  children,
}: Props) {
  return (
    <div className="p-6 max-w-[1500px] mx-auto bg-white rounded shadow">
      <div className="flex justify-between items-center border-b pb-3 mb-6">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold text-black-400">فاتورة</span>
          <span className="text-lg font-bold">#{invoiceNumber}</span>
          <span className="text-sm text-gray-400">{formattedDateTime}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={saveInvoice}
            className="bg-green-600 text-white hover:bg-green-700 px-2 py-1 text-sm rounded"
          >
            <i className="bi bi-save me-2"></i> حفظ الفاتورة
          </Button>
          <Button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white hover:bg-blue-700 px-2 py-1 text-sm rounded"
          >
            <i className="bi bi-file-earmark-plus me-2"></i> فاتورة جديدة
          </Button>
          <Button
            onClick={previewInvoice}
            className="bg-gray-600 text-white hover:bg-gray-700 px-2 py-1 text-sm rounded"
          >
            <i className="bi bi-eye me-2"></i> معاينة الفاتورة
          </Button>
        </div>
      </div>
      {children}
      <div className="flex justify-between items-center mt-4">
        <div className="flex items-center gap-6 text-sm font-semibold">
          <div className="text-gray-600">
            <span>الإجمالي: </span>
            <span>{totalAmount.toFixed(2)} ﷼</span>
          </div>
          <div className="text-green-500">
            <span>الضريبة: </span>
            <span>{taxAmount.toFixed(2)} ﷼</span>
          </div>
          <div className="text-gray-600 text-base font-bold">
            <span>الصافي: </span>
            <span>{netAmount.toFixed(2)} ﷼</span>
          </div>
        </div>
      </div>
    </div>
  );
}

