"use client";

import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import dynamic from "next/dynamic";

import { useBalanceKeyboardNavigation } from "./hooks/useBalanceKeyboardNavigation";
import BalanceDetailRow from "./components/BalanceDetailRow";
import UnbalancedModalMessage from "./components/UnbalancedModalMessage";
import BalanceHeaderSkeleton from "./components/skeletons/BalanceHeaderSkeleton";
import BalanceInfoSkeleton from "./components/skeletons/BalanceInfoSkeleton";
import DetailsTableSkeleton from "./components/skeletons/DetailsTableSkeleton";
import TotalBalanceSkeleton from "./components/skeletons/TotalBalanceSkeleton";

import { getLocaleDir } from "@/i18n/config";
import { useBalanceVoucherForm } from "@/hooks/useBalanceVoucherForm";

// Dynamic imports with loading skeletons
const BalanceHeader = dynamic(() => import("./components/BalanceHeader"), {
  loading: () => <BalanceHeaderSkeleton />,
});

const BalanceInfo = dynamic(() => import("./components/BalanceInfo"), {
  loading: () => <BalanceInfoSkeleton />,
});

const DetailsTable = dynamic(() => import("./components/DetailsTable"), {
  loading: () => <DetailsTableSkeleton />,
});

const TotalBalance = dynamic(() => import("./components/TotalBalance"), {
  loading: () => <TotalBalanceSkeleton />,
});

// Modals — no loading fallback needed (not visible on mount)
const NotesModal = dynamic(() => import("./components/NotesModal"));
const ConfirmationModal = dynamic(() =>
  import("@/components/Modal").then((mod) => ({
    default: mod.ConfirmationModal,
  })),
);
const GLTransactionModal = dynamic(
  () => import("@/components/gl-transaction/GLTransactionModal"),
);

export interface BalanceVoucherClientPageProps {
  voucherData?: any;
  voucherDetailsData?: any[];
  formData: any;
  formMode?: "new" | "edit" | "preview";
  voucherRecordId?: number | string | null;
  voucherVouchId?: number;
  isNewVoucher?: boolean;
  startInEditMode?: boolean;
}

type BasicSelectOption = {
  value: string;
  label: string;
};

export default function BalanceVoucherClientPage({
  voucherData,
  voucherDetailsData,
  formData,
  formMode: initialFormMode = "new",
  voucherRecordId,
  voucherVouchId: _voucherVouchId,
  isNewVoucher = true,
  startInEditMode: propStartInEditMode,
}: BalanceVoucherClientPageProps) {
  const locale = useLocale();
  const dir = getLocaleDir(locale as "ar" | "en");
  const t = useTranslations("forms.balanceVoucher");

  // Dynamic text alignment classes based on locale
  const textAlign = dir === "rtl" ? "text-right" : "text-left";

  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") || initialFormMode;
  const formMode = (
    mode === "new" ? "new" : mode === "edit" ? "edit" : "preview"
  ) as "new" | "edit" | "preview";

  // حالة المودال لتوسيع البيان
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  // حالة Modal القيود المحاسبية
  const [isGLModalOpen, setIsGLModalOpen] = useState(false);

  // Use the hook for all state management and business logic
  const {
    // State
    voucher,
    setVoucher,
    details,
    accounts,
    costCenters,
    voucherTypes,
    isLoading,
    isEditing,
    isPrinting,
    showUnbalancedModal,
    defaultAccountOptions,

    // Totals and balances
    totals,
    cashBalance,
    goldBalance,
    isCashBalanced,
    isGoldBalanced,
    isBalanced,

    // Functions
    addDetailRow,
    removeDetailRow,
    updateDetail,
    handleMasterCostChange,
    saveVoucher,
    printVoucher,
    handleEditClick,
    loadAccountOptions,
    getAccountSelectValue,
    updateAccountsList,
    handleUnbalancedConfirm,
    handleUnbalancedCancel,
  } = useBalanceVoucherForm({
    voucherData,
    voucherDetailsData,
    formData,
    formMode,
    voucherRecordId,
    isNewVoucher,
    startInEditMode: propStartInEditMode,
  });

  const costCenterSelectOptions = useMemo<BasicSelectOption[]>(() => {
    return (costCenters || []).map(
      (center: { id: number; name?: string; cost_name?: string }) => ({
        value: String(center.id),
        label: center.name || center.cost_name || `مركز ${center.id}`,
      }),
    );
  }, [costCenters]);

  const getCostCenterSelectValue = useCallback(
    (costId?: number | null): BasicSelectOption | null => {
      if (costId === null || costId === undefined) return null;

      return (
        costCenterSelectOptions.find(
          (option) => Number(option.value) === Number(costId),
        ) ?? null
      );
    },
    [costCenterSelectOptions],
  );

  const handleCostCenterChange = useCallback(
    (selected: BasicSelectOption | null) => {
      const id = selected?.value ? Number(selected.value) : null;

      handleMasterCostChange(Number.isFinite(id) ? id : null);
    },
    [handleMasterCostChange],
  );

  const handleGLModalClose = useCallback(() => setIsGLModalOpen(false), []);

  // Keyboard navigation
  const {
    selectorsRef,
    handleKeyDownSelectors,
    setInputRef,
    handleKeyDownTable,
    focusNextField,
  } = useBalanceKeyboardNavigation({ isEditing, details, addDetailRow });

  return (
    <div className="p-1 max-w-[1500px] mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header - رأس القيد مع الأزرار */}
      <BalanceHeader
        voucher={voucher}
        voucherTypes={voucherTypes}
        isEditing={isEditing}
        isLoading={isLoading}
        saveVoucher={saveVoucher}
        handleEditClick={handleEditClick}
        printVoucher={printVoucher}
        setIsGLModalOpen={setIsGLModalOpen}
        formMode={formMode}
        isPrinting={isPrinting}
      />
      {/* Form - نموذج بيانات القيد */}
      <BalanceInfo
        selectorsRef={selectorsRef}
        handleKeyDownSelectors={handleKeyDownSelectors}
        voucher={voucher}
        isEditing={isEditing}
        setVoucher={setVoucher}
        costCenterOptions={costCenterSelectOptions}
        costCenterValue={getCostCenterSelectValue(voucher.cost_id)}
        onCostCenterChange={handleCostCenterChange}
        setIsNotesModalOpen={setIsNotesModalOpen}
      />
      {/* DetailsTable - جدول تفاصيل القيد */}
      <DetailsTable
        isEditing={isEditing}
        addDetailRow={addDetailRow}
        isBalanced={isBalanced}
        costCenters={costCenterSelectOptions}
      >
        {details.map((detail, index) => (
          <BalanceDetailRow
            key={detail.id && detail.id > 0 ? detail.id : `new-${index}`}
            detail={detail}
            index={index}
            isEditing={isEditing}
            handleKeyDownTable={handleKeyDownTable}
            updateDetail={updateDetail}
            setInputRef={setInputRef}
            focusNextField={focusNextField}
            costCenters={costCenterSelectOptions}
            removeDetailRow={removeDetailRow}
            accounts={accounts}
            defaultAccountOptions={defaultAccountOptions}
            getAccountSelectValue={getAccountSelectValue}
            loadAccountOptions={loadAccountOptions}
            updateAccountsList={updateAccountsList}
          />
        ))}
      </DetailsTable>

      {/* Totals - شريط الإجماليات */}
      <TotalBalance
        totals={totals}
        isCashBalanced={isCashBalanced}
        cashBalance={cashBalance}
        isGoldBalanced={isGoldBalanced}
        goldBalance={goldBalance}
        textAlign={textAlign}
      />
      <ConfirmationModal
        cancelText={t("modals.cancel")}
        confirmColor="warning"
        confirmText={t("modals.confirm")}
        isOpen={showUnbalancedModal}
        message={
          <UnbalancedModalMessage totals={totals} textAlign={textAlign} t={t} />
        }
        size="md"
        title={t("modals.unbalancedTitle")}
        onClose={handleUnbalancedCancel}
        onConfirm={handleUnbalancedConfirm}
      />
      {/* مودال توسيع البيان */}
      <NotesModal
        isNotesModalOpen={isNotesModalOpen}
        setIsNotesModalOpen={setIsNotesModalOpen}
        isEditing={isEditing}
        voucher={voucher}
        setVoucher={setVoucher}
        textAlign={textAlign}
      />
      {/* Modal القيود المحاسبية */}
      <GLTransactionModal
        isOpen={isGLModalOpen}
        onClose={handleGLModalClose}
        transId={voucher.id && Number(voucher.id) > 0 ? Number(voucher.id) : 0}
        transType={0} // قيد افتتاحي
        voucherTitle={
          voucher.vouch_id && Number(voucher.vouch_id) > 0
            ? `قيد افتتاحي رقم ${voucher.vouch_id}`
            : voucher.id
              ? `قيد افتتاحي (DB-${voucher.id})`
              : undefined
        }
      />
    </div>
  );
}
