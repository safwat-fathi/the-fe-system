"use client";

import BalanceVoucherHeader from "./BalanceVoucherHeader";
import BalanceVoucherForm from "./BalanceVoucherForm";
import BalanceVoucherDetailsTable from "./BalanceVoucherDetailsTable";
import BalanceVoucherTotals from "./BalanceVoucherTotals";

import { Voucher, VoucherDetail } from "@/types/voucher";

interface BalanceVoucherContainerProps {
  voucher: Voucher;
  currentTime: string;
  details: VoucherDetail[];
  accounts: any[];
  costCenters: any[];
  voucherTypes: any[];
  voucherStatuses: any[];
  caratTypes?: any[];
  taxRates?: number[];
  isEditing?: boolean;
  formMode?: "new" | "edit" | "preview";
  isLoading: boolean;
  isPrinting: boolean;
  isBalanced: boolean;
  onVoucherChange: (field: keyof Voucher, value: any) => void;
  onUpdateDetail: (
    index: number,
    field: keyof VoucherDetail,
    value: any,
  ) => void;
  onAddRow: () => void;
  onRemoveRow: (index: number) => void;
  onSave: () => void;
  onPrint: () => void;
  onUpdateAccountsList: (newAccount: any) => void;
  onEditClick?: () => void;
}

export default function BalanceVoucherContainer({
  voucher,
  details,
  currentTime,
  isLoading,
  isPrinting,
  isBalanced,
  accounts,
  costCenters,
  voucherTypes,
  voucherStatuses,
  caratTypes = [],
  taxRates = [],
  isEditing = true,
  formMode = "new",
  onVoucherChange,
  onUpdateDetail,
  onAddRow,
  onRemoveRow,
  onSave,
  onPrint,
  onUpdateAccountsList,
  onEditClick,
}: BalanceVoucherContainerProps) {
  return (
    <div className="p-3 max-w-[1500px] mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
      {/* رأس القيد مع الأزرار */}
      <BalanceVoucherHeader
        currentTime={currentTime}
        formMode={formMode}
        isBalanced={isBalanced}
        isEditing={isEditing}
        isLoading={isLoading}
        isPrinting={isPrinting}
        voucher={voucher}
        voucherTypes={voucherTypes}
        onEditClick={onEditClick}
        onPrint={onPrint}
        onSave={onSave}
      />

      {/* نموذج بيانات القيد */}
      <BalanceVoucherForm
        currentTime={currentTime}
        isEditing={isEditing}
        voucher={voucher}
        onVoucherChange={onVoucherChange}
      />

      {/* جدول تفاصيل القيد */}
      <BalanceVoucherDetailsTable
        accounts={accounts}
        caratTypes={caratTypes}
        costCenters={costCenters}
        details={details}
        isBalanced={isBalanced}
        isEditing={isEditing}
        taxRates={taxRates}
        onAddRow={onAddRow}
        onRemoveRow={onRemoveRow}
        onUpdateAccountsList={onUpdateAccountsList}
        onUpdateDetail={onUpdateDetail}
      />

      {/* شريط الإجماليات */}
      <BalanceVoucherTotals
        totals={{
          totalDebit: details.reduce(
            (sum, d) => sum + (parseFloat(String(d.debit || 0)) || 0),
            0,
          ),
          totalCredit: details.reduce(
            (sum, d) => sum + (parseFloat(String(d.credit || 0)) || 0),
            0,
          ),
          totalDebitG: details.reduce(
            (sum, d) => sum + (parseFloat(String(d.debit_g || 0)) || 0),
            0,
          ),
          totalCreditG: details.reduce(
            (sum, d) => sum + (parseFloat(String(d.credit_g || 0)) || 0),
            0,
          ),
          totalTax: details.reduce(
            (sum, d) => sum + (parseFloat(String(d.tax || 0)) || 0),
            0,
          ),
          totalTaxPrc: details.reduce(
            (sum, d) => sum + (parseFloat(String(d.tax_prc || 0)) || 0),
            0,
          ),
        }}
        isCashBalanced={(() => {
          const cashBalance =
            details.reduce(
              (sum, d) => sum + (parseFloat(String(d.debit || 0)) || 0),
              0,
            ) -
            details.reduce(
              (sum, d) => sum + (parseFloat(String(d.credit || 0)) || 0),
              0,
            );
          return Math.abs(cashBalance) < 0.01;
        })()}
        isGoldBalanced={(() => {
          const goldBalance =
            details.reduce(
              (sum, d) => sum + (parseFloat(String(d.debit_g || 0)) || 0),
              0,
            ) -
            details.reduce(
              (sum, d) => sum + (parseFloat(String(d.credit_g || 0)) || 0),
              0,
            );
          return Math.abs(goldBalance) < 0.01;
        })()}
      />
    </div>
  );
}
