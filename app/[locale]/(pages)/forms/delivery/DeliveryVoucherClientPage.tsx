"use client";
import type { Account } from "@/types/models/account";
import type { Box } from "@/types/models/box";
import type { CostCenter, VoucherType } from "@/types/voucher-form";
import type { Customer } from "@/types/models/customer";
import type { Item } from "@/types/models/item";

import { useState, useCallback, memo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";

import { useDeliveryForm, type DeliveryCategory } from "./useDeliveryForm";
import { useGoldTableNavigation } from "./hooks/useGoldTableNavigation";
import useNavigationMetadata from "./hooks/useNavigationMetadata";
import DeliveryHeaderSkeleton from "./components/DeliveryHeaderSkeleton";
import DeliveryDetailsSkeleton from "./components/DeliveryDetailsSkeleton";
import GoldTableSkeleton from "./components/goldTable/GoldTableSkeleton";
import CashTableSkeleton from "./components/cashTable/CashTableSkeleton";
import DeliveryTotalsSkeleton from "./components/DeliveryTotalsSkeleton";

const DeliveryHeader = dynamic(() => import("./components/DeliveryHeader"), {
  ssr: false,
  loading: () => <DeliveryHeaderSkeleton />,
});
const DeliveryDetails = dynamic(() => import("./components/DeliveryDetails"), {
  ssr: false,
  loading: () => <DeliveryDetailsSkeleton />,
});
const GoldTable = dynamic(() => import("./components/goldTable/GoldTable"), {
  ssr: false,
  loading: () => <GoldTableSkeleton />,
});
const CashTable = dynamic(() => import("./components/cashTable/CashTable"), {
  ssr: false,
  loading: () => <CashTableSkeleton />,
});
const DeliveryTotals = dynamic(() => import("./components/DeliveryTotals"), {
  ssr: false,
  loading: () => <DeliveryTotalsSkeleton />,
});

const NotesModal = dynamic(() => import("./components/NotesModal"), {
  ssr: false,
  loading: () => null,
});

import { Voucher, VoucherBox, GVoucherDetail } from "@/types/voucher";

import "bootstrap-icons/font/bootstrap-icons.css";

interface DeliveryVoucherClientPageProps {
  voucherData?: Voucher | null;
  voucherBoxes?: VoucherBox[];
  goldDetailsData?: GVoucherDetail[];
  isNewVoucher?: boolean;
  voucherRecordId?: number | string | null;
  navigationInfo?: {
    previous?: number | null;
    next?: number | null;
    first?: number | null;
    last?: number | null;
    vouchersCount?: number | null;
  };
  accounts: Account[];
  boxes: Box[];
  goldBoxes?: Box[];
  costCenters: CostCenter[];
  customers: Customer[];
  items: Item[];
  voucherTypes: VoucherType[];
  startInEditMode?: boolean;
  vouchType: number; // 222 للتسليم
  formMode?: "new" | "edit" | "preview";
  categories?: DeliveryCategory[];
}

const DeliveryVoucherClientPage = ({
  voucherData,
  voucherBoxes: initialVoucherBoxes = [],
  goldDetailsData: initialGoldDetails = [],
  isNewVoucher: _isNewVoucher = true,
  voucherRecordId,
  navigationInfo,
  accounts: _initialAccounts,
  boxes: initialBoxes,
  goldBoxes: initialGoldBoxes = [],
  costCenters: initialCostCenters,
  customers: initialCustomers,
  items: initialItems,
  vouchType,
  formMode = "new",
  categories: initialCategories = [],
}: DeliveryVoucherClientPageProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const tDelivery = useTranslations("forms.deliveryVoucher");

  const {
    handleSearch,
    saveVoucher,
    isLoading,
    voucher,
    setVoucher,
    voucherBoxes,
    goldDetails,
    searchTerm,
    setSearchTerm,
    voucherNumber,
    isEditing,
    items: deliveryItems,
    customers: deliveryCustomers,
    selectedCustomer: deliverySelectedCustomer,
    setSelectedCustomer: deliverySetSelectedCustomer,
    defaultCustomerOptions: deliveryDefaultCustomerOptions,
    getCostomerOptions,
    getCustomerSelectValue: deliveryGetCustomerSelectValue,
    costCenters: deliveryCostCenters,
    costCenterSelectOptions: deliveryCostCenterSelectOptions,
    costCenterOptionsWithStringValue,
    getCostCenterSelectValue: deliveryGetCostCenterSelectValue,
    getCostCenterValueForGold,
    handleCostCenterChange,
    hasVoucherId,
    loadItemOptions: deliveryLoadItemOptions,
    getItemSelectValue: deliveryGetItemSelectValue,
    getDefaultItemOptions: deliveryGetDefaultItemOptions,
    addGoldDetailRow,
    removeGoldDetailRow,
    updateGoldDetail,
    addVoucherBoxRow,
    updateVoucherBox,
    removeVoucherBoxRow,
    cashBoxSelectOptions,
    goldBoxSelectOptions,
    totals,
    isPrinting,
    printVoucher,
  } = useDeliveryForm({
    voucherData: voucherData ?? undefined,
    vouchType,
    voucherBoxes: initialVoucherBoxes,
    goldDetailsData: initialGoldDetails,

    formMode,
    boxes: initialBoxes,
    goldBoxes: initialGoldBoxes,
    voucherRecordId:
      typeof voucherRecordId === "number" ? voucherRecordId : undefined,
    customers: initialCustomers,
    costCenters: initialCostCenters,
    items: initialItems,
    categories: initialCategories,
  });

  const navigationMetadata = useNavigationMetadata({
    navigationInfo,
  });

  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);

  const {
    setGoldInputRef,
    setBoxInputRef,
    handleGoldKeyDown,
    handleBoxKeyDown,
    focusNextGoldField,
    focusNextBoxField,
  } = useGoldTableNavigation({
    goldDetails,
    voucherBoxes,
    addGoldDetailRow,
    addVoucherBoxRow,
  });

  const handleItemChange = useCallback(
    (
      index: number,
      selectedOption: {
        value: number;
        label: string;
        item: Record<string, unknown>;
      } | null,
    ) => {
      if (!selectedOption) {
        updateGoldDetail(index, {
          item_id: undefined,
          item_code: "",
          item_name: "",
        });

        return;
      }

      const selected = selectedOption.item;

      if (selected) {
        updateGoldDetail(index, {
          item_id: Number(selected.id) || undefined,
          item_code: String(selected.item_code ?? ""),
          item_name: String(selected.item_name ?? ""),
        });

        if (selected.k !== undefined && selected.k !== null) {
          updateGoldDetail(index, {
            k: Number(selected.k),
          });
        }
      }
    },
    [updateGoldDetail],
  );

  const handleEditClick = () => {
    setVoucher((prev) => ({
      ...prev,
      commit: false,
    }));

    if (pathname) {
      const vouchIdToUse = voucher.vouch_id;

      if (vouchIdToUse && Number(vouchIdToUse) > 0) {
        router.push(`/forms/delivery/${vouchIdToUse}?mode=edit`);
      }
    }
  };

  const getGoldBoxValue = useCallback(
    (detail: GVoucherDetail) => {
      if (!detail.box_id) return null;

      return (
        goldBoxSelectOptions.find(
          (opt: { value: number; label: string }) =>
            opt.value === detail.box_id,
        ) || null
      );
    },
    [goldBoxSelectOptions],
  );

  const handleGoldBoxChange = useCallback(
    (
      index: number,
      selectedOption: { value: number; label: string } | null,
    ) => {
      updateGoldDetail(index, {
        box_id: selectedOption ? selectedOption.value : undefined,
      });
    },
    [updateGoldDetail],
  );

  const handleNotesChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target;

      setVoucher((prev) => ({
        ...prev,
        vouch_notes: value,
      }));
    },
    [setVoucher],
  );

  return (
    <div className="p-1 max-w-[1500px] mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <DeliveryHeader
        voucherTypeName={tDelivery("title")}
        isEditing={isEditing}
        isPrinting={isPrinting}
        voucherNumber={voucherNumber}
        voucher={voucher}
        hasVoucherId={hasVoucherId}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        handleSearch={handleSearch}
        saveVoucher={saveVoucher}
        printVoucher={printVoucher}
        navigationMetadata={navigationMetadata}
        handleEditClick={handleEditClick}
        isLoading={isLoading}
        formMode={formMode}
      />
      <DeliveryDetails
        isEditing={isEditing}
        voucher={voucher}
        setVoucher={setVoucher}
        setIsNotesModalOpen={setIsNotesModalOpen}
        customers={deliveryCustomers}
        selectedCustomer={deliverySelectedCustomer}
        setSelectedCustomer={deliverySetSelectedCustomer}
        defaultCustomerOptions={deliveryDefaultCustomerOptions}
        getCostomerOptions={getCostomerOptions}
        getCustomerSelectValue={deliveryGetCustomerSelectValue}
        costCenters={deliveryCostCenters}
        costCenterSelectOptions={deliveryCostCenterSelectOptions}
        getCostCenterSelectValue={deliveryGetCostCenterSelectValue}
        goldDetails={goldDetails}
        addGoldDetailRow={addGoldDetailRow}
        updateGoldDetail={updateGoldDetail}
        voucherBoxes={voucherBoxes}
        updateVoucherBox={updateVoucherBox}
      />
      <GoldTable
        isEditing={isEditing}
        goldDetails={goldDetails}
        items={deliveryItems}
        addGoldDetailRow={addGoldDetailRow}
        removeGoldDetailRow={removeGoldDetailRow}
        updateGoldDetail={updateGoldDetail}
        loadItemOptions={deliveryLoadItemOptions}
        getItemSelectValue={deliveryGetItemSelectValue}
        getDefaultItemOptions={deliveryGetDefaultItemOptions}
        onItemChange={handleItemChange}
        onKeyDown={handleGoldKeyDown}
        setInputRef={setGoldInputRef}
        focusNextField={focusNextGoldField}
        boxOptions={goldBoxSelectOptions}
        getBoxValue={getGoldBoxValue}
        onBoxChange={handleGoldBoxChange}
        costCenterOptions={costCenterOptionsWithStringValue}
        getCostCenterValue={getCostCenterValueForGold}
        onCostCenterChange={handleCostCenterChange}
      />

      <CashTable
        isEditing={isEditing}
        addVoucherBoxRow={addVoucherBoxRow}
        voucherBoxes={voucherBoxes}
        cashBoxSelectOptions={cashBoxSelectOptions}
        setBoxInputRef={setBoxInputRef}
        updateVoucherBox={updateVoucherBox}
        handleBoxKeyDown={handleBoxKeyDown}
        focusNextBoxField={focusNextBoxField}
        onRemoveRow={removeVoucherBoxRow}
        costCenterOptions={costCenterOptionsWithStringValue}
      />
      <DeliveryTotals totals={totals} />
      <NotesModal
        isNotesModalOpen={isNotesModalOpen}
        setIsNotesModalOpen={setIsNotesModalOpen}
        isEditing={isEditing}
        value={voucher.vouch_notes || ""}
        onChange={handleNotesChange}
      />
    </div>
  );
};

export default memo(DeliveryVoucherClientPage);
