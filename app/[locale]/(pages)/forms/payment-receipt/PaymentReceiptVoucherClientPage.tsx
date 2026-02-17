"use client";

import type { Account } from "@/types/models/account";
import type { Box } from "@/types/models/box";
import type {
  CostCenter,
  VoucherStatus,
  VoucherType,
} from "@/types/voucher-form";
import type { Voucher, VoucherBox, VoucherDetail } from "@/types/voucher";

import { useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";

import useCashReceiptForm from "../cash-receipt/hooks/useCashReceiptForm";
import useNavigationFelids from "../cash-receipt/hooks/useNavigationFelids";
import useEnterKeyNavigation from "../invoices/hooks/useEnterKeyNavigation";

import {
  ACCOUNTS_TABLE_COLUMNS,
  CASH_RECEIPT_TABLE_COLUMNS,
} from "./constants";
import CashItemRow from "./components/CashItemRow";
import DetailItemRow from "./components/DetailItemRow";
import PaymentReceiptHeaderSkeleton from "./components/skeletons/PaymentReceiptHeaderSkeleton";
import PaymentReceiptInfoSkeleton from "./components/skeletons/PaymentReceiptInfoSkeleton";
import SharedTableSkeleton from "./components/skeletons/SharedTableSkeleton";
import PaymentTotalsSkeleton from "./components/skeletons/PaymentTotalsSkeleton";

const PaymentHeader = dynamic(
  () => import("./components/PaymentReceiptHeader"),
  {
    loading: () => <PaymentReceiptHeaderSkeleton />,
  },
);

const PaymentReceiptInfo = dynamic(
  () => import("./components/PaymentReceiptInfo"),
  {
    loading: () => <PaymentReceiptInfoSkeleton />,
  },
);

const SharedTable = dynamic(() => import("./components/shared/SharedTable"), {
  loading: () => <SharedTableSkeleton />,
});

const CashTotals = dynamic(() => import("./components/CashTotals"), {
  loading: () => <PaymentTotalsSkeleton />,
});

const NotesModal = dynamic(() => import("./components/NotesModal"));
const GLTransactionModal = dynamic(
  () => import("@/components/gl-transaction/GLTransactionModal"),
);

import { loadBoxes } from "@/utilities/box.actions";
import { loadCostCenters } from "@/utilities/costCenter.actions";
import { getLocaleDir } from "@/i18n/config";
import useKeyAsTab from "@/hooks/useKeyAsTab";

interface PaymentReceiptVoucherClientPageProps {
  accounts: Account[];
  boxes: Box[];
  costCenters: CostCenter[];
  formMode: "new" | "edit" | "preview";
  navigationInfo?: {
    previous: number | null;
    next: number | null;
    first: number | null;
    last: number | null;
    vouchersCount: number | null;
  };
  vouchType: number;
  voucherStatuses: VoucherStatus[];
  voucherTypes: VoucherType[];
  initialVoucherNumber: number;
  voucherData?: Voucher | null;
  voucherDetailsData?: VoucherDetail[];
  voucherBoxes?: VoucherBox[];
}

const PaymentReceiptVoucherClientPage = ({
  accounts,
  boxes,
  costCenters,
  formMode,
  navigationInfo,
  vouchType,
  voucherStatuses,
  initialVoucherNumber,
  voucherData,
  voucherDetailsData,
  voucherBoxes: initialVoucherBoxes = [],
}: PaymentReceiptVoucherClientPageProps) => {
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
  const locale = useLocale();
  const dir = getLocaleDir(locale as "ar" | "en");
  const t = useTranslations("forms.paymentReceipt");

  const textAlign = dir === "rtl" ? "text-right" : "text-left";

  const [isGLModalOpen, setIsGLModalOpen] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);

  const { refNoInput } = useNavigationFelids();

  const selectorsRef = useRef<HTMLDivElement>(null);
  const notesInputRef = useRef<HTMLInputElement>(null);
  const firstCashTableInputRef = useRef<HTMLInputElement | null>(null);
  const firstAccountTableInputRef = useRef<HTMLInputElement | null>(null);

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
        firstAccountTableInputRef.current?.focus();
      },
    });

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

  const { handleKeyDown: handleKeyDownSelectors } = useKeyAsTab({
    keys: ["Enter"],
    containerRef: selectorsRef,
    disabled: !isEditing,
    shouldIgnoreEvent: (event) => {
      const target = event.target as HTMLElement | null;

      if (!target) return false;

      if (target.closest("[data-skip-key-as-tab='true']")) {
        return true;
      }

      const tagName = target.tagName.toLowerCase();

      if (tagName === "textarea" || tagName === "button") {
        return true;
      }

      const listboxElement = target.closest('[role="listbox"]');

      if (listboxElement) {
        return true;
      }

      const popoverElement = target.closest(
        '[role="dialog"], [role="menu"], [data-headlessui-state]',
      );

      if (popoverElement) {
        return true;
      }

      if (
        target.getAttribute("aria-expanded") === "true" ||
        target.closest('[aria-expanded="true"]')
      ) {
        return true;
      }

      return false;
    },
    onBoundaryFocus: (direction) => {
      if (direction === 1) {
        const currentElement = document.activeElement as HTMLElement;
        const isInSelectors = selectorsRef.current?.contains(currentElement);

        if (isInSelectors) {
          const allFocusable = Array.from(
            selectorsRef.current?.querySelectorAll(
              'input:not([disabled]):not([tabindex="-1"]), select:not([disabled]):not([tabindex="-1"]), [role="combobox"]',
            ) || [],
          ) as HTMLElement[];

          const currentIndex = allFocusable.indexOf(currentElement);

          if (currentIndex === allFocusable.length - 1) {
            notesInputRef.current?.focus();

            return true;
          }
        }
      }

      return false;
    },
  });

  return (
    <div className="p-2 max-w-[1500px] mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
      <PaymentHeader
        voucher={voucher}
        textAlign={textAlign}
        isEditing={isEditing}
        isLoading={isLoading}
        saveVoucher={saveVoucher}
        printVoucher={printVoucher}
        setIsGLModalOpen={setIsGLModalOpen}
        setVoucher={setVoucher}
        formMode={formMode}
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
        vouchType={vouchType}
      />
      <PaymentReceiptInfo
        voucher={voucher}
        setVoucher={setVoucher}
        isEditing={isEditing}
        initialCostCenters={costCenters}
        handleMasterCostChange={handleMasterCostChange}
        voucherStatuses={voucherStatuses}
        setIsNotesModalOpen={setIsNotesModalOpen}
        focusFirstPaymentTableInput={() =>
          firstCashTableInputRef.current?.focus()
        }
        notesInputRef={notesInputRef}
        refNoInput={refNoInput}
        onKeyDownCapture={handleKeyDownSelectors}
        selectorsRef={selectorsRef}
      />
      <SharedTable
        title={t("tables.cash.title")}
        textAlign={textAlign}
        handleAddRow={handleAddCashBox}
        isEditing={isEditing}
        columns={CASH_RECEIPT_TABLE_COLUMNS}
      >
        {voucherBoxes.map((voucherBox, index) => (
          <CashItemRow
            key={voucherBox.id}
            isEditing={isEditing}
            cashItem={voucherBox}
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
          <DetailItemRow
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
      <NotesModal
        isEditing={isEditing}
        isNotesModalOpen={isNotesModalOpen}
        setVoucher={setVoucher}
        setIsNotesModalOpen={setIsNotesModalOpen}
        textAlign={textAlign}
        voucher={voucher}
      />
      <GLTransactionModal
        isOpen={isGLModalOpen}
        onClose={() => setIsGLModalOpen(false)}
        transId={voucher.id && Number(voucher.id) > 0 ? Number(voucher.id) : 0}
        transType={vouchType || 2}
        voucherTitle={
          voucher.vouch_id && Number(voucher.vouch_id) > 0
            ? `سند صرف رقم ${voucher.vouch_id}`
            : voucher.id
              ? `سند صرف (DB-${voucher.id})`
              : undefined
        }
      />
    </div>
  );
};

export default PaymentReceiptVoucherClientPage;
