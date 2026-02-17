"use client";

import type { Account } from "@/types/models/account";
import type { Box } from "@/types/models/box";
import type {
  CostCenter,
  VoucherStatus,
  VoucherType,
} from "@/types/voucher-form";

import { useState, useRef, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import dynamic from "next/dynamic";

import useCashReceiptForm from "./hooks/useCashReceiptForm";
import useNavigationFelids from "./hooks/useNavigationFelids";
import {
  CASH_RECEIPT_TABLE_COLUMNS,
  ACCOUNTS_TABLE_COLUMNS,
} from "./constants";
import CashItemRow from "./components/CashItemRow";
import DetailsItemRow from "./components/DetailsItemRow";
import CashReceiptHeaderSkeleton from "./components/skeletons/CashReceiptHeaderSkeleton";
import CashReceiptInfoSkeleton from "./components/skeletons/CashReceiptInfoSkeleton";
import SharedTableSkeleton from "./components/skeletons/SharedTableSkeleton";
import CashTotalsSkeleton from "./components/skeletons/CashTotalsSkeleton";

import { getLocaleDir } from "@/i18n/config";
import useEnterKeyNavigation from "@/app/[locale]/(pages)/forms/invoices/hooks/useEnterKeyNavigation";
import useKeyAsTab from "@/hooks/useKeyAsTab";
import { Voucher, VoucherDetail, VoucherBox } from "@/types/voucher";
import { loadBoxes } from "@/utilities/box.actions";
import { loadCostCenters } from "@/utilities/costCenter.actions";

const CashReceiptHeader = dynamic(
  () => import("./components/CashReceiptHeader"),
  {
    loading: () => <CashReceiptHeaderSkeleton />,
  },
);

const CashReceiptInfo = dynamic(() => import("./components/CashReceiptInfo"), {
  loading: () => <CashReceiptInfoSkeleton />,
});

const SharedTable = dynamic(() => import("./components/shared/SharedTable"), {
  loading: () => <SharedTableSkeleton />,
});

const CashTotals = dynamic(() => import("./components/CashTotals"), {
  loading: () => <CashTotalsSkeleton />,
});

const NotesModal = dynamic(() => import("./components/NotesModal"));
const GLTransactionModal = dynamic(
  () => import("@/components/gl-transaction/GLTransactionModal"),
);

interface CashReceiptVoucherClientPageProps {
  voucherData?: Voucher | null;
  voucherDetailsData?: VoucherDetail[];
  voucherBoxes?: VoucherBox[];
  isNewVoucher?: boolean;
  voucherRecordId?: number | string | null;
  voucherVouchId?: number;
  navigationInfo?: {
    previous: number | null;
    next: number | null;
    first: number | null;
    last: number | null;
    vouchersCount: number | null;
  };
  accounts: Account[];
  boxes: Box[];
  costCenters: CostCenter[];
  voucherTypes: VoucherType[];
  voucherStatuses: VoucherStatus[];
  startInEditMode?: boolean;
  vouchType: number;
  formMode?: "new" | "edit" | "preview";
  initialVoucherNumber?: number;
}

export default function CashReceiptVoucherClientPage({
  voucherData,
  voucherDetailsData,
  voucherBoxes: initialVoucherBoxes = [],
  voucherStatuses,
  navigationInfo,
  accounts,
  boxes,
  costCenters,
  vouchType,
  formMode = "new",
  initialVoucherNumber,
}: CashReceiptVoucherClientPageProps) {
  const locale = useLocale();
  const dir = getLocaleDir(locale as "ar" | "en");
  const t = useTranslations("forms.cashReceiptVoucher");

  const textAlign = dir === "rtl" ? "text-right" : "text-left";

  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [isGLModalOpen, setIsGLModalOpen] = useState(false);

  const boxOptions = useMemo(() => loadBoxes(boxes), [boxes]);
  const costCenterOptions = useMemo(
    () => loadCostCenters(costCenters),
    [costCenters],
  );

  const {
    isEditing,
    isLoading,
    saveVoucher,
    voucher,
    setVoucher,
    isPrinting,
    printVoucher,
    handleMasterCostChange,
    handleAddCashBox,
    handleAddDetail,
    removeCashBox,
    removeDetail,
    details,
    voucherBoxes,
    updateVoucherBox: updateVoucherBoxForm,
    updateDetail,
    totals,
    balance,
    isBalanced,
  } = useCashReceiptForm({
    voucherData,
    voucherDetailsData,
    voucherBoxes: initialVoucherBoxes,
    initialVoucherNumber,
    formMode,
    vouchType,
  });

  const handleCashChange = (index: number, changes: Partial<VoucherBox>) => {
    updateVoucherBoxForm(index, changes);
  };

  const handleDetailKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
    col: number,
    options?: { isLastCol?: boolean },
  ) => {
    handleKeyDownTable(e, index, col, options);
  };

  const { refNoInput } = useNavigationFelids();

  // Refs for keyboard navigation
  const selectorsRef = useRef<HTMLDivElement>(null);
  const notesInputRef = useRef<HTMLInputElement>(null);
  const firstCashTableInputRef = useRef<HTMLInputElement | null>(null);
  const firstAccountTableInputRef = useRef<HTMLInputElement | null>(null);

  // Hook for Enter key navigation in top form fields
  const { handleKeyDown: handleKeyDownSelectors } = useKeyAsTab({
    keys: ["Enter"],
    containerRef: selectorsRef,
    disabled: !isEditing,
    shouldIgnoreEvent: (event) => {
      const target = event.target as HTMLElement | null;

      if (!target) return false;

      // Ignore elements with data-skip-key-as-tab="true"
      if (target.closest("[data-skip-key-as-tab='true']")) {
        return true;
      }

      // Ignore textareas and buttons
      const tagName = target.tagName.toLowerCase();

      if (tagName === "textarea" || tagName === "button") {
        return true;
      }

      // Ignore if inside an open dropdown list
      const listboxElement = target.closest('[role="listbox"]');

      if (listboxElement) {
        return true;
      }

      // Ignore if inside an open popover or dropdown
      const popoverElement = target.closest(
        '[role="dialog"], [role="menu"], [data-headlessui-state]',
      );

      if (popoverElement) {
        return true;
      }

      // Ignore if React Select menu is open
      if (
        target.getAttribute("aria-expanded") === "true" ||
        target.closest('[aria-expanded="true"]')
      ) {
        return true;
      }

      // Allow navigation through all fields smoothly
      return false;
    },
    onBoundaryFocus: (direction) => {
      // When reaching the end of selectors (after الحالة), move to notes input
      if (direction === 1) {
        const currentElement = document.activeElement as HTMLElement;
        const isInSelectors = selectorsRef.current?.contains(currentElement);

        if (isInSelectors) {
          // Check if we're at the last field (الحالة)
          const allFocusable = Array.from(
            selectorsRef.current?.querySelectorAll(
              'input:not([disabled]):not([tabindex="-1"]), select:not([disabled]):not([tabindex="-1"]), [role="combobox"]',
            ) || [],
          ) as HTMLElement[];

          const currentIndex = allFocusable.indexOf(currentElement);

          if (currentIndex === allFocusable.length - 1) {
            // Move to notes input
            notesInputRef.current?.focus();

            return true;
          }
        }
      }

      return false;
    },
  });

  // Hook for Enter key navigation in cash table rows
  const { setInputRef: setCashInputRef, handleKeyDown: handleCashKeyDown } =
    useEnterKeyNavigation({
      rows: voucherBoxes,
      rowHasValue: (row) => {
        return !!(
          (row?.box_id && row.box_id > 0) ||
          (row?.amount && row.amount > 0)
        );
      },
      onAddRow: handleAddCashBox,
      onLastCell: () => {
        // عندما نصل لأخر حقل في جدول النقدية، ننتقل لجدول الحسابات
        firstAccountTableInputRef.current?.focus();
      },
    });

  // Hook for Enter key navigation in accounts table rows
  const { setInputRef, handleKeyDown: handleKeyDownTable } =
    useEnterKeyNavigation({
      rows: details,
      rowHasValue: (row) => {
        return !!(
          row?.acc_id ||
          (row?.debit && row.debit > 0) ||
          (row?.credit && row.credit > 0)
        );
      },
      onAddRow: handleAddDetail,
    });

  return (
    <div className="p-2 max-w-[1500px] mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <CashReceiptHeader
        formMode={formMode}
        isEditing={isEditing}
        isLoading={isLoading}
        isPrinting={isPrinting}
        navigationInfo={
          navigationInfo || {
            next: null,
            previous: null,
            last: null,
            first: null,
            vouchersCount: null,
          }
        }
        printVoucher={printVoucher}
        saveVoucher={saveVoucher}
        setIsGLModalOpen={setIsGLModalOpen}
        setVoucher={setVoucher}
        textAlign={textAlign}
        vouchType={vouchType}
        voucher={voucher}
      />
      <CashReceiptInfo
        voucher={voucher}
        setVoucher={setVoucher}
        refNoInput={refNoInput}
        onKeyDownCapture={handleKeyDownSelectors}
        isEditing={isEditing}
        selectorsRef={selectorsRef}
        initialCostCenters={costCenters}
        handleMasterCostChange={handleMasterCostChange}
        voucherStatuses={voucherStatuses}
        notesInputRef={notesInputRef}
        setIsNotesModalOpen={setIsNotesModalOpen}
        focusFirstCashTableInput={() => firstCashTableInputRef.current?.focus()}
      />

      <SharedTable
        title={t("tables.cash.title")}
        textAlign={textAlign}
        handleAddRow={handleAddCashBox}
        isEditing={isEditing}
        columns={CASH_RECEIPT_TABLE_COLUMNS}
      >
        {voucherBoxes.map((box, index) => (
          <CashItemRow
            key={box.id}
            isEditing={isEditing}
            cashItem={box}
            handleCashChange={handleCashChange}
            handleCashKeyDown={handleCashKeyDown}
            index={index}
            boxes={boxes}
            boxOptions={boxOptions}
            costCenters={costCenters}
            costCenterOptions={costCenterOptions}
            removeCashBox={removeCashBox}
            isRemoveDisabled={voucherBoxes.length === 1}
            setInputRef={(rowIndex, colIndex) => (el) => {
              setCashInputRef(rowIndex, colIndex)(el);
              if (rowIndex === 0 && colIndex === 0) {
                firstCashTableInputRef.current = el;
              }
            }}
          />
        ))}
      </SharedTable>
      <SharedTable
        title={t("tables.accounts.title")}
        textAlign={textAlign}
        handleAddRow={handleAddDetail}
        isEditing={isEditing}
        columns={ACCOUNTS_TABLE_COLUMNS}
      >
        {details.map((detail, index) => (
          <DetailsItemRow
            key={detail.id}
            detail={detail}
            accounts={accounts}
            costCenters={costCenters}
            costCenterOptions={costCenterOptions}
            detailIndex={index}
            isEditing={isEditing}
            updateDetail={updateDetail}
            handleDetailKeyDown={handleDetailKeyDown}
            removeDetail={removeDetail}
            isRemoveDisabled={details.length === 1}
            setInputRef={(rowIndex, colIndex) => (el) => {
              setInputRef(rowIndex, colIndex)(el);
              if (rowIndex === 0 && colIndex === 0) {
                firstAccountTableInputRef.current = el;
              }
            }}
          />
        ))}
      </SharedTable>

      <CashTotals
        totals={totals}
        balance={balance}
        isBalanced={isBalanced}
        textAlign={textAlign}
      />

      {/* مودال توسيع البيان */}
      <NotesModal
        isEditing={isEditing}
        isNotesModalOpen={isNotesModalOpen}
        setVoucher={setVoucher}
        setIsNotesModalOpen={setIsNotesModalOpen}
        textAlign={textAlign}
        voucher={voucher}
      />

      {/* Modal القيود المحاسبية */}
      <GLTransactionModal
        isOpen={isGLModalOpen}
        onClose={() => setIsGLModalOpen(false)}
        transId={voucher.id && Number(voucher.id) > 0 ? Number(voucher.id) : 0}
        transType={vouchType || 1} // سند قبض
        voucherTitle={
          voucher.vouch_id && Number(voucher.vouch_id) > 0
            ? `سند قبض رقم ${voucher.vouch_id}`
            : voucher.id
              ? `سند قبض (DB-${voucher.id})`
              : undefined
        }
      />
    </div>
  );
}
