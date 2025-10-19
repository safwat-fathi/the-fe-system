"use client";

import { Button, Calendar, Checkbox, Input } from "@heroui/react";
import { ReactNode } from "react";
import { useRouter } from "next/navigation";

import { RiyalIcon } from "./RiyalIcon";

import useFractions from "@/utilities/useFractions";
import {
  CalendarIcon,
  CheckCircleIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CreditCardIcon,
  PencilIcon,
  PlusCircleIcon,
  PrinterIcon,
} from "@heroicons/react/24/outline";
import { SearchIcon } from "./icons";

interface Props {
  invoiceNumber: string;
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
  invoiceType?: "sales" | "sales_return" | "purchase" | "purchase_return";
  // إجماليات قابلة للإدخال
  autoTotalValue: number;
  autoTotalWages: number;
  manualTotalValue: number;
  manualTotalWages: number;
  useManualTotals: boolean;
  onManualTotalChange: (type: "value" | "wages", value: number) => void;
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
  navigateToInvoice?: (direction: "first" | "prev" | "next" | "last") => void;
  newInvoiceHref?: string;
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
  invoiceType = "sales",
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
  newInvoiceHref = "/forms/invoices?type=sale&mode=new",
}: Props) {
  const fractions = useFractions() as { frac: number; frac2: number };
  const router = useRouter();

  // دالة لتحديد عنوان الفاتورة
  const getInvoiceTitle = () => {
    switch (invoiceType) {
      case "sales_return":
        return "مردود بيع";
      case "purchase":
        return "شراء";
      case "purchase_return":
        return "مردود شراء";
      default:
        return "بيع";
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
                  <CalendarIcon className="w-4 h-4 text-slate-500" />
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
              <SearchIcon className="w-4 h-4" />
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
              <CheckCircleIcon className="w-4 h-4 " />
              حفظ
            </Button>

            {!isEditing && (
              <Button
                className="h-7 px-3 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm"
                onClick={onEdit}
              >
                <PencilIcon className="w-4 h-4 text-slate-500" />
                تعديل
              </Button>
            )}

            <Button
              className="h-7 px-3 text-xs bg-blue-600 text-white hover:bg-blue-700 border border-blue-600 rounded-md shadow-sm"
              onClick={() => router.push(newInvoiceHref)}
            >
              {/* <i className="bi bi-plus-circle me-1"></i> */}
              <PlusCircleIcon className="w-4 h-4 " />
              جديد
            </Button>

            <Button
              className="h-7 px-3 text-xs bg-slate-600 text-white hover:bg-slate-700 border border-slate-600 rounded-md shadow-sm"
              onClick={previewInvoice}
            >
              {/* <i className="bi bi-printer me-1"></i> */}
              <PrinterIcon className="w-4 h-4 " />
              طباعة
            </Button>

            {/* أزرار التنقل */}
            {navigateToInvoice && (
              <div className="flex items-center gap-1 mr-2">
                <Button
                  size="sm"
                  className="h-7 w-7 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm"
                  onClick={() => navigateToInvoice("first")}
                >
                  {/* <i className="bi bi-chevron-double-right text-xs"></i> */}
                  <ChevronDoubleRightIcon className="w-4 h-4 " />
                </Button>
                <Button
                  size="sm"
                  className="h-7 w-7 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm"
                  onClick={() => navigateToInvoice("prev")}
                >
                  <ChevronRightIcon className="w-4 h-4 " />
                </Button>
                <span className="text-xs text-slate-600 px-2 font-medium">
                  {currentRecord} من {totalRecords}
                </span>
                <Button
                  size="sm"
                  className="h-7 w-7 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm"
                  onClick={() => navigateToInvoice("next")}
                >
                  <ChevronLeftIcon className="w-4 h-4 " />
                </Button>
                <Button
                  size="sm"
                  className="h-7 w-7 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm"
                  onClick={() => navigateToInvoice("last")}
                >
                  <ChevronDoubleLeftIcon className="w-4 h-4 " />
                </Button>
              </div>
            )}
          </div>

          {/* حالة الفاتورة */}
          <div className="flex items-center gap-3">
            <Checkbox
              isSelected={commit}
              onValueChange={setCommit}
              isDisabled={!isEditing}
              color="success"
              size="sm"
            >
              <span className="text-xs text-slate-600">حُفظ</span>
            </Checkbox>

            <Checkbox
              isSelected={print}
              onValueChange={setPrint}
              isDisabled={!isEditing}
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
            <span className="text-gray-700 font-medium">
              إجمالي الوزن المعاير:
            </span>
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
            <span className="text-gray-800 font-semibold">
              الإجمالي شامل الضريبة:
            </span>
            <span className="font-bold text-blue-900 flex items-center gap-1">
              {Number(netAmount).toFixed(fractions.frac)}
              <RiyalIcon color="currentColor" />
            </span>
          </div>
        </div>
      </div>

      {/* زر الدفع - يظهر فقط للفواتير النقدية وليس لفواتير الشراء أو المردودات */}
      {paymentMethod === "cash" &&
        invoiceType !== "purchase" &&
        invoiceType !== "purchase_return" &&
        invoiceType !== "sales_return" && (
          <div className="mt-3 flex justify-start">
            <Button
              className="h-8 px-4 text-sm bg-purple-600 text-white hover:bg-purple-700 border border-purple-600 rounded-md shadow-sm"
              onClick={() =>
                router.push(`/forms/invoices/payment?total=${netAmount}`)
              }
            >
              <CreditCardIcon className="w-4 h-4 me-2" />
              دفع
            </Button>
          </div>
        )}
    </div>
  );
}
