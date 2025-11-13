"use client";

import { Button, Checkbox } from "@heroui/react";
import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarIcon,
  CheckCircleIcon,
  CreditCardIcon,
  PencilIcon,
  PlusCircleIcon,
  PrinterIcon,
} from "@heroicons/react/24/outline";

import { RiyalIcon } from "./RiyalIcon";
import { SearchIcon } from "./icons";

import useFractions from "@/utilities/useFractions";

interface Props {
  invoiceNumber: string;
  formattedDateTime: string;
  saveInvoice: () => void | Promise<any>;
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
  canEdit?: boolean;
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
  // حالة الفاتورة هل هي جديدة؟
  isNewInvoice?: boolean;
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
  canEdit = true,
  children,
  // نوع الفاتورة
  invoiceType = "sales",
  // // إجماليات قابلة للإدخال
  // autoTotalValue,
  // autoTotalWages,
  // manualTotalValue,
  // manualTotalWages,
  // useManualTotals,
  // onManualTotalChange,
  // onUseManualTotalsChange,
  // onResetManualTotals,
  // البحث برقم الفاتورة
  searchNumber,
  setSearchNumber,
  onInvoiceSearch,
  // إجماليات إضافية جديدة
  totalGWeight = 0,
  // totalValueTax = 0,
  // totalWagesTax = 0,
  // totalTax = 0,
  // طريقة الدفع
  paymentMethod = "cash",
  // // أزرار التنقل
  // currentRecord = 1,
  // totalRecords = 1,
  // navigateToInvoice,
  newInvoiceHref = "/forms/invoices?type=sale&mode=new",
  isNewInvoice = false,
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
    <div className="p-2 sm:p-3 max-w-full mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
      {/* رأس الفاتورة المرتب */}
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4 border border-slate-200">
        {/* الصف الأول: معلومات الفاتورة */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-800 flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-4">
                <span>فاتورة {invoiceTitle}</span>
                <span className="text-slate-600 font-medium text-sm sm:text-base">
                  #{invoiceNumber}
                </span>
                <div className="flex items-center gap-1 text-sm text-slate-600 font-medium">
                  <CalendarIcon className="w-4 h-4 text-slate-500" />
                  {formattedDateTime}
                </div>
              </h1>
            </div>
          </div>

          {/* البحث */}
          <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto">
            <input
              className="flex-1 ps-2 h-7 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-0 focus:outline-none"
              // placeholder="بحث..."
              placeholder="بحث برقم الفاتورة..."
              type="number"
              value={searchNumber}
              onChange={(e) => setSearchNumber(e.target.value)}
            />
            <Button
              className="h-7 px-2 text-xs bg-slate-600 text-white hover:bg-slate-700 border border-slate-600 rounded-md shadow-sm"
              size="sm"
              onPress={onInvoiceSearch}
            >
              <SearchIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* الصف الثاني: الأزرار والحالة */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* الأزرار من اليسار لليمين */}
          <div className="flex flex-wrap items-center gap-1 ">
            {isEditing && (
              <Button
                className="h-7 px-3 text-xs bg-emerald-600 text-white hover:bg-emerald-700 border border-emerald-600 rounded-md shadow-sm"
                onClick={saveInvoice}
              >
                <CheckCircleIcon className="w-4 h-4 " />
                <span className="hidden sm:inline">حفظ</span>
              </Button>
            )}

            {!isEditing && (
              <Button
                className="h-7 px-3 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm"
                onClick={onEdit}
              >
                <PencilIcon className="w-4 h-4 text-slate-500" />
                <span className="hidden sm:inline">تعديل</span>
              </Button>
            )}

            <Button
              className="h-7 px-3 text-xs bg-blue-600 text-white hover:bg-blue-700 border border-blue-600 rounded-md shadow-sm"
              onClick={() => router.push(newInvoiceHref)}
            >
              <PlusCircleIcon className="w-4 h-4 " />
              <span className="hidden sm:inline">جديد</span>
            </Button>

            {!isNewInvoice && (
              <Button
                className="h-7 px-3 text-xs bg-slate-600 text-white hover:bg-slate-700 border border-slate-600 rounded-md shadow-sm"
                onClick={previewInvoice}
              >
                <PrinterIcon className="w-4 h-4 " />
                <span className="hidden sm:inline">طباعة</span>
              </Button>
            )}

            {/* أزرار التنقل */}
            {/* {navigateToInvoice && (
              <div className="hidden md:flex items-center gap-1 mr-2">
                <Button
                  className="h-7 w-7 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm"
                  size="sm"
                  onClick={() => navigateToInvoice("first")}
                >
                  <ChevronDoubleRightIcon className="w-4 h-4 " />
                </Button>
                <Button
                  className="h-7 w-7 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm"
                  size="sm"
                  onClick={() => navigateToInvoice("prev")}
                >
                  <ChevronRightIcon className="w-4 h-4 " />
                </Button>
                <span className="text-xs text-slate-600 px-2 font-medium">
                  {currentRecord} من {totalRecords}
                </span>
                <Button
                  className="h-7 w-7 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm"
                  size="sm"
                  onClick={() => navigateToInvoice("next")}
                >
                  <ChevronLeftIcon className="w-4 h-4 " />
                </Button>
                <Button
                  className="h-7 w-7 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm"
                  size="sm"
                  onClick={() => navigateToInvoice("last")}
                >
                  <ChevronDoubleLeftIcon className="w-4 h-4 " />
                </Button>
              </div>
            )} */}
          </div>

          {/* حالة الفاتورة */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1">
              <Checkbox
                color="success"
                isDisabled={!isEditing}
                isSelected={commit}
                size="sm"
                onValueChange={setCommit}
              />
              <span className="text-xs text-slate-600">حُفظ</span>
            </div>

            <div className="flex items-center gap-1">
              <Checkbox
                color="warning"
                isDisabled={!isEditing}
                isSelected={print}
                size="sm"
                onValueChange={setPrint}
              />
              <span className="text-xs text-slate-600">طُبع</span>
            </div>
          </div>
        </div>
      </div>
      {children}

      {/* شريط الإجماليات - محاذاة متجاوبة */}
      <div className="mt-3 sm:mt-4 bg-gray-50 rounded-lg p-2 sm:p-3 border border-gray-200">
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch justify-between gap-2 sm:gap-3 text-xs sm:text-sm">
          <div className="flex-1 min-w-[150px] flex items-center justify-between p-1 sm:p-2">
            <span className="text-gray-700 font-medium">الإجمالي:</span>
            <span className="font-semibold text-blue-800 flex items-center gap-1">
              {Number(totalAmount).toFixed(fractions.frac)}
              <RiyalIcon color="currentColor" />
            </span>
          </div>

          <div className="flex-1 min-w-[150px] flex items-center justify-between p-1 sm:p-2">
            <span className="text-gray-700 font-medium">إجمالي الخصم:</span>
            <span className="font-semibold text-red-800 flex items-center gap-1">
              {Number(totalDiscount).toFixed(fractions.frac)}
              <RiyalIcon color="currentColor" />
            </span>
          </div>

          <div className="flex-1 min-w-[150px] flex items-center justify-between p-1 sm:p-2">
            <span className="text-gray-700 font-medium">الوزن المعاير:</span>
            <span className="font-semibold text-amber-800 flex items-center gap-1">
              {Number(totalGWeight).toFixed(fractions.frac2)}
              <span className="text-xs">جم</span>
            </span>
          </div>

          <div className="flex-1 min-w-[150px] flex items-center justify-between p-1 sm:p-2">
            <span className="text-gray-700 font-medium">الضريبة:</span>
            <span className="font-semibold text-green-800 flex items-center gap-1">
              {Number(taxAmount).toFixed(fractions.frac)}
              <RiyalIcon color="currentColor" />
            </span>
          </div>

          <div className="flex-1 min-w-[150px] flex items-center justify-between p-1 sm:p-2">
            <span className="text-gray-800 font-semibold">الإجمالي:</span>
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
