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
  totalDiscount: number;
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
  totalDiscount,
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
            className="bg-green-600 text-white hover:bg-green-700 px-2 py-1 text-sm rounded"
            onClick={saveInvoice}
          >
            <i className="bi bi-save me-2" /> حفظ الفاتورة
          </Button>
          <Button
            className="bg-blue-600 text-white hover:bg-blue-700 px-2 py-1 text-sm rounded"
            onClick={() => window.location.reload()}
          >
            <i className="bi bi-file-earmark-plus me-2" /> فاتورة جديدة
          </Button>
          <Button
            className="bg-gray-600 text-white hover:bg-gray-700 px-2 py-1 text-sm rounded"
            onClick={previewInvoice}
          >
            <i className="bi bi-eye me-2" /> معاينة الفاتورة
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
          <div className="text-gray-600">
            <span>إجمالي الخصم: </span>
            <span>{totalDiscount.toFixed(2)} ﷼</span>
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
