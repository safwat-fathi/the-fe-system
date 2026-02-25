"use client";

import type { Voucher, VoucherDetail } from "@/types/voucher";
import type { Account } from "@/types/models/account";
import type {
  CaratType,
  CostCenter,
  VoucherStatus,
  VoucherType,
} from "@/types/voucher-form";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import dynamic from "next/dynamic";

import AdjustmentInfoSkeleton from "./components/skeletons/AdjustmentInfoSkeleton";
import AdjustmentTotalsSkeleton from "./components/skeletons/AdjustmentTotalsSkeleton";
import AdjustmentTableSkeleton from "./components/skeletons/AdjustmentTableSkeleton";
import AdjustmentHeaderSkeleton from "./components/skeletons/AdjustmentHeaderSkeleton";
import { useAdjustmentVoucherForm } from "./hooks/useAdjustmentVoucherForm";
import useAdjustmentNavigationMetadata from "./hooks/useAdjustmentNavigationMetadata";
import useKeyboardNavigation from "./hooks/useKeyboardNavigation";

import { getLocaleDir } from "@/i18n/config";

const AdjustmentInfo = dynamic(() => import("./components/AdjustmentInfo"), {
  loading: () => <AdjustmentInfoSkeleton />,
  ssr: false,
});

const AdjustmentTable = dynamic(() => import("./components/AdjustmentTable"), {
  loading: () => <AdjustmentTableSkeleton />,
  ssr: false,
});

const AdjustmentTotals = dynamic(
  () => import("./components/AdjustmentTotals"),
  {
    loading: () => <AdjustmentTotalsSkeleton />,
    ssr: false,
  },
);

const VoucherHeader = dynamic(() => import("./components/AdjustmentHeader"), {
  loading: () => <AdjustmentHeaderSkeleton />,
  ssr: false,
});

const NotesModal = dynamic(() => import("./components/NotesModal"), {
  ssr: false,
});

const GLTransactionModal = dynamic(
  () => import("@/components/gl-transaction/GLTransactionModal"),
  {
    ssr: false,
  },
);

interface VoucherClientPageProps {
  voucherData?: Voucher | null;
  voucherDetailsData?: VoucherDetail[];
  isNewVoucher?: boolean;
  voucherRecordId?: number | string | null;
  voucherVouchId?: number;
  navigationInfo?: {
    previous?: number | null;
    next?: number | null;
    first?: number | null;
    last?: number | null;
    vouchersCount?: number | null;
  };
  accounts: Account[];
  costCenters: CostCenter[];
  voucherTypes: VoucherType[];
  voucherStatuses: VoucherStatus[];
  caratTypes?: CaratType[];
  startInEditMode?: boolean;
  vouchType?: number;
  formMode?: "new" | "edit" | "preview";
  newVoucherHref?: string;
  initialVoucherNumber?: number;
}

export default function VoucherClientPage({
  voucherData,
  voucherDetailsData,
  isNewVoucher: _isNewVoucher = true,
  voucherRecordId: _voucherRecordId,
  voucherVouchId: _voucherVouchId,
  accounts: initialAccounts,
  costCenters,
  voucherTypes: initialVoucherTypes,
  voucherStatuses: initialVoucherStatuses,
  caratTypes: initialCaratTypes = [],
  startInEditMode: _startInEditMode = false,
  vouchType = 2,
  formMode = "new",
  newVoucherHref: _newVoucherHref,
  navigationInfo,
  initialVoucherNumber,
}: VoucherClientPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const dir = getLocaleDir(locale as "ar" | "en");
  const t = useTranslations("forms.adjustment");

  const textAlign = dir === "rtl" ? "text-right" : "text-left";

  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [isGLModalOpen, setIsGLModalOpen] = useState(false);
  const isEditing = formMode === "edit" || formMode === "new";

  const accountOptions = useMemo(
    () =>
      initialAccounts.map((acc) => ({
        value: acc.id,
        label: `${acc.acc_code} - ${acc.acc_name}`,
        account: acc,
      })),
    [initialAccounts],
  );

  const costCenterOptions = useMemo(
    () =>
      costCenters.map((cc) => ({
        value: cc.id,
        label: `${cc.id} - ${cc.cost_name || cc.cost_name_e || ""}`,
        costCenter: cc,
      })),
    [costCenters],
  );

  const {
    voucher,
    setVoucher,
    isLoading,
    isPrinting,
    saveVoucher,
    handleSearch,
    setSearchTerm,
    searchTerm,
    details,
    addDetailRow,
    removeDetailRow,
    updateDetail,
    handleCostCenter,
    handlePrint,
    isVoucherBalanced,
    totals,
    updateVoucherType,
  } = useAdjustmentVoucherForm({
    formMode,
    initialVoucherNumber,
    voucherDetailsData,
    voucherData,
    accounts: initialAccounts,
    caratTypes: initialCaratTypes,
  });

  useEffect(() => {
    const focusRefNo = () => {
      const refNoInput = document.getElementById("voucher-ref-no");

      if (refNoInput) {
        refNoInput.focus();
        if (refNoInput instanceof HTMLInputElement && !refNoInput.value) {
          refNoInput.select();
        }
      }
    };

    // محاولة فورية
    const timer1 = setTimeout(focusRefNo, 50);
    // محاولة إضافية بعد تأخير أطول للتأكد
    const timer2 = setTimeout(focusRefNo, 200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [pathname]);

  const { register: registerField, handleEnter: handleFieldEnter } =
    useKeyboardNavigation();

  const handleCreateClick = useCallback(() => {
    router.push(`/forms/adjustment?mode=new`);
  }, [router]);

  const handleEditClick = useCallback(() => {
    setVoucher((prev) => ({
      ...prev,
      commit: false,
    }));

    if (pathname) {
      const vouchIdToUse = voucher.vouch_id;

      if (vouchIdToUse && Number(vouchIdToUse) > 0) {
        router.push(`/forms/adjustment/${vouchIdToUse}?mode=edit`);
      }
    }
  }, [setVoucher, pathname, voucher.vouch_id, router]);

  const navigationMetadata = useAdjustmentNavigationMetadata({
    navigationInfo,
  });

  const voucherNumber =
    voucher.vouch_id && Number(voucher.vouch_id) > 0
      ? String(voucher.vouch_id)
      : voucher.id
        ? `DB-${voucher.id}`
        : "";

  return (
    <>
      <div className="p-1 max-w-[1500px] mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
        <VoucherHeader
          textAlign={textAlign}
          title={t("title")}
          vouch_id={voucher.vouch_id}
          isEditing={isEditing}
          isLoading={isLoading}
          saveVoucher={saveVoucher}
          formMode={formMode}
          handleEditClick={handleEditClick}
          handleCreateClick={handleCreateClick}
          isPrinting={isPrinting}
          printVoucher={handlePrint}
          DBId={voucher.id}
          voucher_commit={voucher.commit}
          setIsGLModalOpen={setIsGLModalOpen}
          navigationMetadata={navigationMetadata}
          voucherNumber={voucherNumber}
          handleSearch={handleSearch}
          setSearchTerm={setSearchTerm}
          searchTerm={searchTerm}
        />
        <AdjustmentInfo
          textAlign={textAlign}
          isEditing={isEditing}
          voucher={voucher}
          voucherStatuses={initialVoucherStatuses}
          setVoucher={setVoucher}
          voucherTypes={initialVoucherTypes}
          costCenters={costCenters}
          handleCostCenter={handleCostCenter}
          updateVoucherType={updateVoucherType}
          setIsNotesModalOpen={setIsNotesModalOpen}
          registerField={registerField}
          handleFieldEnter={handleFieldEnter}
        />
        <AdjustmentTable
          initialCostCenters={costCenters}
          costCenterOptions={costCenterOptions}
          isEditing={isEditing}
          addDetailRow={addDetailRow}
          removeDetailRow={removeDetailRow}
          textAlign={textAlign}
          isVoucherBalanced={isVoucherBalanced}
          details={details}
          initialAccounts={initialAccounts}
          accountOptions={accountOptions}
          updateDetail={updateDetail}
          registerField={registerField}
          handleFieldEnter={handleFieldEnter}
        />
        <AdjustmentTotals totals={totals} textAlign={textAlign} />
      </div>

      {/* مودال توسيع البيان */}
      <NotesModal
        isNotesModalOpen={isNotesModalOpen}
        setIsNotesModalOpen={setIsNotesModalOpen}
        voucher={voucher}
        setVoucher={setVoucher}
        isEditing={isEditing}
        textAlign={textAlign}
      />

      {/* Modal القيود المحاسبية */}
      <GLTransactionModal
        isOpen={isGLModalOpen}
        onClose={() => setIsGLModalOpen(false)}
        transId={voucher.id && Number(voucher.id) > 0 ? Number(voucher.id) : 0}
        transType={vouchType || 3} // قيد تسوية
        voucherTitle={
          voucher.vouch_id && Number(voucher.vouch_id) > 0
            ? `قيد تسوية رقم ${voucher.vouch_id}`
            : voucher.id
              ? `قيد تسوية (DB-${voucher.id})`
              : undefined
        }
      />
    </>
  );
}
