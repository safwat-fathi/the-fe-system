"use client";

import VoucherHeader from "./VoucherHeader";
import VoucherActions from "./VoucherActions";
import VoucherNavigation from "./VoucherNavigation";
import VoucherStatus from "./VoucherStatus";
import VoucherForm from "./VoucherForm";
import VoucherDetailsTable from "./VoucherDetailsTable";
import VoucherTotals from "./VoucherTotals";
import PreviousVouchersModal from "./PreviousVouchersModal";
import { Voucher, VoucherDetail } from "@/types/voucher";

interface VoucherContainerProps {
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
  currentRecord: number;
  totalRecords: number;
  searchTerm: string;
  isModalOpen: boolean;
  vouchersList: any[];
  onVoucherChange: (field: keyof Voucher, value: any) => void;
  onVoucherTypeChange: (newType: number) => void;
  onUpdateDetail: (index: number, field: keyof VoucherDetail, value: any) => void;
  onAddRow: () => void;
  onRemoveRow: (index: number) => void;
  onSave: () => void;
  onEdit: () => void;
  onNew: () => void;
  onPrint: () => void;
  onCreateFromPrevious: () => void;
  onNavigate: (direction: 'first' | 'prev' | 'next' | 'last') => void;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  onModalClose: () => void;
  onSelectVoucher: (voucher: any) => void;
  onUpdateAccountsList: (newAccount: any) => void;
}

export default function VoucherContainer({
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
  vouchersList,
  currentRecord,
  totalRecords,
  searchTerm,
  isModalOpen,
  onVoucherChange,
  onVoucherTypeChange,
  onUpdateDetail,
  onAddRow,
  onRemoveRow,
  onSave,
  onEdit,
  onNew,
  onPrint,
  onCreateFromPrevious,
  onNavigate,
  onSearchChange,
  onSearch,
  onModalClose,
  onSelectVoucher,
  onUpdateAccountsList
}: VoucherContainerProps) {
  return (
    <div className="p-3 max-w-[1500px] mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
      {/* رأس القيد */}
      <VoucherHeader
        voucher={voucher}
        voucherTypes={voucherTypes}
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        onSearch={onSearch}
      />

      {/* شريط الأزرار والتنقل */}
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-3 mb-4 border border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <VoucherActions
              voucher={voucher}
              isLoading={isLoading}
              isPrinting={isPrinting}
              onSave={onSave}
              onEdit={onEdit}
              onNew={onNew}
              onPrint={onPrint}
              onCreateFromPrevious={onCreateFromPrevious}
            />
            
            <VoucherNavigation
              currentRecord={currentRecord}
              totalRecords={totalRecords}
              onNavigate={onNavigate}
            />
          </div>

          <VoucherStatus voucher={voucher} />
        </div>
      </div>

      {/* نموذج بيانات القيد */}
      <VoucherForm
        voucher={voucher}
        currentTime={currentTime}
        voucherTypes={voucherTypes}
        voucherStatuses={voucherStatuses}
        onVoucherChange={onVoucherChange}
        onVoucherTypeChange={onVoucherTypeChange}
      />

      {/* جدول تفاصيل القيد */}
      <VoucherDetailsTable
        details={details}
        accounts={accounts}
        costCenters={costCenters}
        isBalanced={isBalanced}
        onAddRow={onAddRow}
        onRemoveRow={onRemoveRow}
        onUpdateDetail={onUpdateDetail}
        onUpdateAccountsList={onUpdateAccountsList}
      />

      {/* شريط الإجماليات */}
      <VoucherTotals
        totals={{
          totalDebit: details.reduce((sum, d) => sum + (parseFloat(String(d.debit || 0)) || 0), 0),
          totalCredit: details.reduce((sum, d) => sum + (parseFloat(String(d.credit || 0)) || 0), 0),
          totalDebitG: details.reduce((sum, d) => sum + (parseFloat(String(d.debit_g || 0)) || 0), 0),
          totalCreditG: details.reduce((sum, d) => sum + (parseFloat(String(d.credit_g || 0)) || 0), 0),
          totalTax: details.reduce((sum, d) => sum + (parseFloat(String(d.tax || 0)) || 0), 0),
          totalTaxPrc: details.reduce((sum, d) => sum + (parseFloat(String(d.tax_prc || 0)) || 0), 0),
        }}
      />

      {/* نافذة القيود السابقة */}
      <PreviousVouchersModal
        isOpen={isModalOpen}
        onClose={onModalClose}
        vouchersList={vouchersList}
        voucherTypes={voucherTypes}
        voucherStatuses={voucherStatuses}
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        onSelectVoucher={onSelectVoucher}
      />
    </div>
  );
}
