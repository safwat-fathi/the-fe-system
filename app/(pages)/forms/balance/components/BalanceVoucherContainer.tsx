"use client";

import BalanceVoucherHeader from "./BalanceVoucherHeader";
import BalanceVoucherActions from "./BalanceVoucherActions";
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
  onVoucherChange,
  onUpdateDetail,
  onAddRow,
  onRemoveRow,
  onSave,
  onPrint,
  onUpdateAccountsList,
}: BalanceVoucherContainerProps) {
  return (
    <div className="p-3 max-w-[1500px] mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
      {/* رأس القيد */}
      <BalanceVoucherHeader
        currentTime={currentTime}
        voucher={voucher}
        voucherTypes={voucherTypes}
      />

      {/* شريط الأزرار */}
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-3 mb-4 border border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BalanceVoucherActions
              isBalanced={isBalanced}
              isLoading={isLoading}
              isPrinting={isPrinting}
              voucher={voucher}
              onPrint={onPrint}
              onSave={onSave}
            />
          </div>
        </div>
      </div>

      {/* نموذج بيانات القيد */}
      <BalanceVoucherForm
        currentTime={currentTime}
        voucher={voucher}
        onVoucherChange={onVoucherChange}
      />

      {/* جدول تفاصيل القيد */}
      <BalanceVoucherDetailsTable
        accounts={accounts}
        costCenters={costCenters}
        details={details}
        isBalanced={isBalanced}
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
      />
    </div>
  );
}
