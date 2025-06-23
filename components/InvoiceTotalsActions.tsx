"use client";

import { Button, Checkbox } from "@heroui/react";
import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import useFractions from "@/utilities/useFractions";

interface Props {
  invoiceNumber: number;
  formattedDateTime: string;
  saveInvoice: () => void;
  previewInvoice: () => void;
  totalAmount: number;
  taxAmount: number;
  netAmount: number;
  totalDiscount: number;
  commit: boolean;
  setCommit: (val: boolean) => void;
  print: boolean;
  setPrint: (val: boolean) => void;
  isEditing: boolean;
  onEdit: () => void;
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
  commit,
  setCommit,
  print,
  setPrint,
  isEditing,
  onEdit,
  children,
}: Props) {
  const { frac } = useFractions();
  const router = useRouter();
  return (
    <div className="p-6 max-w-[1500px] mx-auto bg-white rounded shadow">
      <div className="flex justify-between items-center border-b pb-3 mb-6">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold text-black-400">فاتورة</span>
          <span className="text-lg font-bold">#{invoiceNumber}</span>
          <span className="text-sm text-gray-400">{formattedDateTime}</span>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing && (
            <Button
              className="bg-yellow-600 text-white hover:bg-yellow-700 px-2 py-1 text-sm rounded"
              onClick={onEdit}
            >
              <i className="bi bi-pencil me-2" /> تعديل
            </Button>
          )}
          <Checkbox
            isDisabled={!isEditing}
            isSelected={commit}
            onValueChange={setCommit}
          >
            حفظ
          </Checkbox>
          <Checkbox
            isDisabled={!isEditing}
            isSelected={print}
            onValueChange={setPrint}
          >
            طباعة
          </Checkbox>
          <Button
            className="bg-green-600 text-white hover:bg-green-700 px-2 py-1 text-sm rounded"
            onClick={saveInvoice}
          >
            <i className="bi bi-save me-2" /> حفظ الفاتورة
          </Button>
          <Button
            className="bg-blue-600 text-white hover:bg-blue-700 px-2 py-1 text-sm rounded"
            onClick={() => router.push('/dashboard/forms/invoice')}
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
            <span>{totalAmount.toFixed(frac)} ﷼</span>
          </div>
          <div className="text-gray-600">
            <span>إجمالي الخصم: </span>
            <span>{totalDiscount.toFixed(frac)} ﷼</span>
          </div>
          <div className="text-green-500">
            <span>الضريبة: </span>
            <span>{taxAmount.toFixed(frac)} ﷼</span>
          </div>
          <div className="text-gray-600 text-base font-bold">
            <span>الإجمالي شامل الضريبة: </span>
            <span>{netAmount.toFixed(frac)} ﷼</span>
          </div>
        </div>
      </div>
    </div>
  );
}
