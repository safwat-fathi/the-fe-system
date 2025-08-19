"use client";

import { Button, Checkbox, Input } from "@heroui/react";
import { ReactNode } from "react";
import { useRouter } from "next/navigation";

import { RiyalIcon } from "./RiyalIcon";

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
  // نوع الفاتورة
  invoiceType?: 'invoice' | 'sales_return' | 'purchase' | 'purchase_return';
  // إجماليات قابلة للإدخال
  autoTotalValue: number;
  autoTotalWages: number;
  manualTotalValue: number;
  manualTotalWages: number;
  useManualTotals: boolean;
  onManualTotalChange: (type: 'value' | 'wages', value: number) => void;
  onUseManualTotalsChange: (use: boolean) => void;
  onResetManualTotals: () => void;
  // البحث برقم الفاتورة
  searchNumber: string;
  setSearchNumber: (val: string) => void;
  onInvoiceSearch: () => void;
  // إجماليات إضافية جديدة
  totalGWeight?: number;
  totalValueTax?: number;
  totalWagesTax?: number;
  totalTax?: number;
  // طريقة الدفع
  paymentMethod?: string;
  // أزرار التنقل
  currentRecord?: number;
  totalRecords?: number;
  navigateToInvoice?: (direction: 'first' | 'prev' | 'next' | 'last') => void;
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
  // نوع الفاتورة
  invoiceType = 'invoice',
  // إجماليات قابلة للإدخال
  autoTotalValue,
  autoTotalWages,
  manualTotalValue,
  manualTotalWages,
  useManualTotals,
  onManualTotalChange,
  onUseManualTotalsChange,
  onResetManualTotals,
  // البحث برقم الفاتورة
  searchNumber,
  setSearchNumber,
  onInvoiceSearch,
  // إجماليات إضافية جديدة
  totalGWeight = 0,
  totalValueTax = 0,
  totalWagesTax = 0,
  totalTax = 0,
  // طريقة الدفع
  paymentMethod = "cash",
  // أزرار التنقل
  currentRecord = 1,
  totalRecords = 1,
  navigateToInvoice,
}: Props) {
  const fractions = useFractions() as { frac: number; frac2: number };
  const router = useRouter();

  // دالة لتحديد عنوان الفاتورة
  const getInvoiceTitle = () => {
    switch (invoiceType) {
      case 'sales_return':
        return 'مردود بيع';
      case 'purchase':
        return 'شراء';
      case 'purchase_return':
        return 'مردود شراء';
      default:
        return 'بيع';
    }
  };

  const invoiceTitle = getInvoiceTitle();

  return (
    <div className="p-3 max-w-[1500px] mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
      {/* رأس الفاتورة المرتب */}
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-3 mb-4 border border-slate-200">
        {/* الصف الأول: معلومات الفاتورة */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-4">
                <span>فاتورة {invoiceTitle}</span>
                <span className="text-slate-600 font-medium">
                  #{invoiceNumber}
                </span>
                <span className="text-sm text-slate-600 font-medium flex items-center gap-1">
                  <i className="bi bi-calendar3 text-slate-500"></i>
                  {formattedDateTime}
                </span>
              </h1>
            </div>
          </div>

          {/* البحث */}
          <div className="flex items-center gap-2">
            <Input
              className="w-32 h-7 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              placeholder="بحث برقم الفاتورة..."
              type="number"
              value={searchNumber}
              onChange={(e) => setSearchNumber(e.target.value)}
            />
            <Button 
              size="sm"
              className="h-7 px-2 text-xs bg-slate-600 text-white hover:bg-slate-700 border border-slate-600 rounded-md shadow-sm"
              onPress={onInvoiceSearch}
            >
              <i className="bi bi-search text-xs"></i>
            </Button>
          </div>
        </div>

        {/* الصف الثاني: الأزرار والحالة */}
        <div className="flex items-center justify-between">
          {/* الأزرار من اليسار لليمين */}
          <div className="flex items-center gap-2">
            <Button
              className="h-7 px-3 text-xs bg-emerald-600 text-white hover:bg-emerald-700 border border-emerald-600 rounded-md shadow-sm"
              onClick={saveInvoice}
            >
              <i className="bi bi-check-circle me-1"></i>
              حفظ
            </Button>

            {!isEditing && (
              <Button
                className="h-7 px-3 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm"
                onClick={onEdit}
              >
                <i className="bi bi-pencil-square me-1"></i>
                تعديل
              </Button>
            )}

            <Button
              className="h-7 px-3 text-xs bg-blue-600 text-white hover:bg-blue-700 border border-blue-600 rounded-md shadow-sm"
              onClick={() => router.push("/dashboard/forms/invoices/Gold_invoice2?new=true")}
            >
              <i className="bi bi-plus-circle me-1"></i>
              جديد
            </Button>

            <Button
              className="h-7 px-3 text-xs bg-slate-600 text-white hover:bg-slate-700 border border-slate-600 rounded-md shadow-sm"
              onClick={previewInvoice}
            >
              <i className="bi bi-printer me-1"></i>
              طباعة
            </Button>

            {/* أزرار التنقل */}
            {navigateToInvoice && (
              <div className="flex items-center gap-1 mr-2">
                <Button
                  size="sm"
                  className="h-7 w-7 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm"
                  onClick={() => navigateToInvoice('first')}
                >
                  <i className="bi bi-chevron-double-right text-xs"></i>
                </Button>
                <Button
                  size="sm"
                  className="h-7 w-7 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm"
                  onClick={() => navigateToInvoice('prev')}
                >
                  <i className="bi bi-chevron-right text-xs"></i>
                </Button>
                <span className="text-xs text-slate-600 px-2 font-medium">
                  {currentRecord} من {totalRecords}
                </span>
                <Button
                  size="sm"
                  className="h-7 w-7 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm"
                  onClick={() => navigateToInvoice('next')}
                >
                  <i className="bi bi-chevron-left text-xs"></i>
                </Button>
                <Button
                  size="sm"
                  className="h-7 w-7 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm"
                  onClick={() => navigateToInvoice('last')}
                >
                  <i className="bi bi-chevron-double-left text-xs"></i>
                </Button>
              </div>
            )}
          </div>

          {/* حالة الفاتورة */}
          <div className="flex items-center gap-3">
            <Checkbox
              isSelected={commit}
              isReadOnly
              color="success"
              size="sm"
            >
              <span className="text-xs text-slate-600">حُفظ</span>
            </Checkbox>
            
            <Checkbox
              isSelected={print}
              isReadOnly
              color="warning"
              size="sm"
            >
              <span className="text-xs text-slate-600">طُبع</span>
            </Checkbox>
          </div>
        </div>
      </div>
      {children}
      
      {/* شريط الإجماليات في سطر واحد */}
      <div className="mt-4 bg-gray-50 rounded-lg p-3 border border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-700 font-medium">الإجمالي:</span>
            <span className="font-semibold text-blue-800 flex items-center gap-1">
              {Number(totalAmount).toFixed(fractions.frac)}
              <RiyalIcon color="currentColor" />
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-700 font-medium">إجمالي الخصم:</span>
            <span className="font-semibold text-red-800 flex items-center gap-1">
              {Number(totalDiscount).toFixed(fractions.frac)}
              <RiyalIcon color="currentColor" />
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-700 font-medium">إجمالي الوزن المعاير:</span>
            <span className="font-semibold text-amber-800 flex items-center gap-1">
              {Number(totalGWeight).toFixed(fractions.frac2)}
              <span className="text-xs text-amber-800">جم</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-700 font-medium">ضريبة القيمة:</span>
            <span className="font-semibold text-green-800 flex items-center gap-1">
              {Number(totalValueTax).toFixed(fractions.frac)}
              <RiyalIcon color="currentColor" />
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-700 font-medium">ضريبة الأجور:</span>
            <span className="font-semibold text-green-800 flex items-center gap-1">
              {Number(totalWagesTax).toFixed(fractions.frac)}
              <RiyalIcon color="currentColor" />
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-700 font-medium">الضريبة:</span>
            <span className="font-semibold text-green-800 flex items-center gap-1">
              {Number(taxAmount).toFixed(fractions.frac)}
              <RiyalIcon color="currentColor" />
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-800 font-semibold">الإجمالي شامل الضريبة:</span>
            <span className="font-bold text-blue-900 flex items-center gap-1">
              {Number(netAmount).toFixed(fractions.frac)}
              <RiyalIcon color="currentColor" />
            </span>
          </div>
        </div>
      </div>

      {/* زر الدفع - يظهر فقط للفواتير النقدية */}
      {paymentMethod === "cash" && (
        <div className="mt-3 flex justify-start">
          <Button
            className="h-8 px-4 text-sm bg-purple-600 text-white hover:bg-purple-700 border border-purple-600 rounded-md shadow-sm"
            onClick={() =>
              router.push(`/dashboard/forms/invoices/invoice_payment?total=${netAmount}`)
            }
          >
            <i className="bi bi-credit-card me-2"></i>
            دفع
          </Button>
        </div>
      )}
    </div>
  );
}
