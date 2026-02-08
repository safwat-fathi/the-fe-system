import type { Voucher, VoucherBox, GVoucherDetail } from "@/types/voucher";
import type { Customer } from "@/types/models/customer";
import type { CostCenter } from "@/types/voucher-form";
import type {
  CustomerSelectOption,
  CostCenterSelectOption,
} from "../useDeliveryForm";

import { ArrowsPointingOutIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";
import AsyncCreatableSelect from "react-select/async-creatable";
import ReactSelect, { type StylesConfig } from "react-select";
import { memo } from "react";

import { useDeliveryKeyNavigation } from "../hooks/useDeliveryKeyNavigation";
import useKeyboardNavigation from "../hooks/useKeyboardNavigation";
import { baseSelectStyles } from "../constants/selectStyles";

interface DeliveryDetailsProps {
  isEditing: boolean;
  voucher: Voucher;
  setVoucher: React.Dispatch<React.SetStateAction<Voucher>>;
  setIsNotesModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  // Customer props
  customers: Customer[];
  selectedCustomer: Customer | null;
  setSelectedCustomer: React.Dispatch<React.SetStateAction<Customer | null>>;
  defaultCustomerOptions: CustomerSelectOption[];
  getCustomerSelectValue: () => CustomerSelectOption | null;
  getCostomerOptions: (inputValue: string) => Promise<CustomerSelectOption[]>;
  // Cost center props
  costCenters: CostCenter[];
  costCenterSelectOptions: CostCenterSelectOption[];
  getCostCenterSelectValue: (
    costId: number | null | undefined,
  ) => CostCenterSelectOption | null;
  // Gold details props
  goldDetails: GVoucherDetail[];
  addGoldDetailRow: () => void;
  updateGoldDetail: (index: number, data: Partial<GVoucherDetail>) => void;
  // Voucher boxes props
  voucherBoxes: VoucherBox[];
  updateVoucherBox: (
    index: number,
    field: keyof VoucherBox,
    value: unknown,
  ) => void;
}

const DeliveryDetails = ({
  isEditing,
  voucher,
  setVoucher,
  setIsNotesModalOpen,
  customers,
  setSelectedCustomer,
  defaultCustomerOptions,
  getCustomerSelectValue,
  costCenterSelectOptions,
  getCostCenterSelectValue,
  goldDetails,
  addGoldDetailRow,
  updateGoldDetail,
  voucherBoxes,
  updateVoucherBox,
  getCostomerOptions,
}: DeliveryDetailsProps) => {
  const t = useTranslations("forms.customerGoldVoucher");
  const { register, handleEnter } = useKeyboardNavigation();

  const { selectorsRef, handleKeyDownSelectors } = useDeliveryKeyNavigation({
    isEditing,
    goldDetails,
    addGoldDetailRow,
  });

  return (
    <>
      <div
        ref={selectorsRef}
        className="grid grid-cols-1 md:grid-cols-12 gap-1.5 mb-1.5"
        onKeyDownCapture={handleKeyDownSelectors}
      >
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-slate-700 mb-0.5">
            {t("fields.refNo")}
          </label>
          <input
            className="w-full h-8 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2"
            disabled={!isEditing}
            ref={register(0)}
            onKeyDown={(e) => handleEnter(e, 0)}
            readOnly={!isEditing}
            type="text"
            value={voucher.ref_no || ""}
            onChange={(e) =>
              setVoucher((prev) => ({ ...prev, ref_no: e.target.value }))
            }
          />
        </div>

        <div className="md:col-span-3">
          <label
            className="block text-xs font-medium text-slate-700 mb-0.5"
            htmlFor="delivery-datetime"
          >
            {t("fields.dateTime")}
          </label>
          <input
            className="w-full h-8 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2"
            disabled={!isEditing}
            ref={register(1)}
            onKeyDown={(e) => handleEnter(e, 1)}
            readOnly={!isEditing}
            type="datetime-local"
            value={
              voucher.vouch_date
                ? new Date(voucher.vouch_date).toISOString().slice(0, 16)
                : ""
            }
            onChange={(e) =>
              setVoucher((prev) => ({
                ...prev,
                vouch_date: new Date(e.target.value).toISOString(),
              }))
            }
          />
        </div>
        <div className="md:col-span-7">
          <label
            className="block text-xs font-medium text-slate-700 mb-0.5"
            htmlFor="delivery-notes"
          >
            {t("fields.notes")}
          </label>
          <div className="relative">
            <input
              className="w-full h-8 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2 pr-8"
              disabled={!isEditing}
              ref={register(2)}
              onKeyDown={(e) => handleEnter(e, 2)}
              placeholder={t("placeholders.notesInput")}
              readOnly={!isEditing}
              type="text"
              value={voucher.vouch_notes || ""}
              onChange={(e) =>
                setVoucher((prev) => ({ ...prev, vouch_notes: e.target.value }))
              }
              onDoubleClick={() => {
                if (isEditing) {
                  setIsNotesModalOpen(true);
                }
              }}
            />
            {isEditing && (
              <button
                className="absolute left-1 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-all duration-200"
                data-skip-key-as-tab="true"
                title={t("modals.notes.expandTitle")}
                type="button"
                onClick={() => setIsNotesModalOpen(true)}
              >
                <ArrowsPointingOutIcon className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Form Fields - Row 2: العميل، مناولة، مركز التكلفة */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-1.5 mb-1.5">
        {/* العميل */}
        <div className="md:col-span-4">
          <label
            className="block text-xs font-medium text-slate-700 mb-0.5"
            htmlFor="customer-select"
          >
            {t("fields.customer")}
          </label>
          <div>
            <AsyncCreatableSelect<CustomerSelectOption>
              isClearable
              isSearchable
              className="text-xs"
              classNamePrefix="react-select"
              ref={register(3)}
              onKeyDown={(e) => handleEnter(e, 3)}
              components={{ IndicatorSeparator: () => null }}
              defaultOptions={defaultCustomerOptions}
              inputId="customer-select"
              instanceId="customer-select"
              isDisabled={!isEditing}
              loadOptions={getCostomerOptions}
              menuPortalTarget={
                typeof window !== "undefined" ? document.body : null
              }
              menuPosition="fixed"
              placeholder={t("placeholders.selectCustomer")}
              styles={
                baseSelectStyles as StylesConfig<CustomerSelectOption, false>
              }
              value={getCustomerSelectValue()}
              onChange={(selectedOption: CustomerSelectOption | null) => {
                if (!isEditing) return;
                if (!selectedOption) {
                  setSelectedCustomer(null);
                  setVoucher((prev) => ({
                    ...prev,
                    cust_id: undefined,
                    handling: "",
                  }));

                  return;
                }

                const selected =
                  selectedOption?.customer ||
                  customers.find((cust) => cust.id === selectedOption?.value);

                setSelectedCustomer(selected || null);

                const handling = selected?.handling?.toString() || "";

                setVoucher((prev) => ({
                  ...prev,
                  cust_id: selected?.id ?? null,
                  handling: handling,
                }));
              }}
            />
          </div>
        </div>

        {/* مناولة */}
        <div className="md:col-span-3">
          <label
            className="block text-xs font-medium text-slate-700 mb-0.5"
            htmlFor="delivery-handling"
          >
            {t("fields.handling")}
          </label>
          <input
            className="w-full h-8 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2"
            disabled={!isEditing}
            placeholder={t("placeholders.handling")}
            readOnly={!isEditing}
            type="text"
            value={voucher.handling || ""}
            onChange={(e) =>
              setVoucher((prev) => ({ ...prev, handling: e.target.value }))
            }
            ref={register(4)}
            onKeyDown={(e) => handleEnter(e, 4)}
          />
        </div>

        {/* مركز التكلفة */}
        <div className="md:col-span-5">
          <label
            className="block text-xs font-medium text-slate-700 mb-0.5"
            htmlFor="delivery-cost-center-select"
          >
            {t("fields.costCenter")}
          </label>
          <div>
            <ReactSelect<CostCenterSelectOption>
              isSearchable
              className="text-xs"
              classNamePrefix="react-select"
              components={{ IndicatorSeparator: () => null }}
              inputId="delivery-cost-center-select"
              instanceId="delivery-cost-center-select"
              isDisabled={!isEditing}
              menuPortalTarget={
                typeof window !== "undefined" ? document.body : null
              }
              menuPosition="fixed"
              options={costCenterSelectOptions}
              placeholder={t("placeholders.selectCostCenter")}
              styles={
                baseSelectStyles as StylesConfig<CostCenterSelectOption, false>
              }
              value={getCostCenterSelectValue(voucher.cost_id)}
              onChange={(selectedOption: CostCenterSelectOption | null) => {
                if (!isEditing) return;
                const costId = selectedOption?.value
                  ? parseInt(String(selectedOption.value))
                  : undefined;

                setVoucher((prev) => ({
                  ...prev,
                  cost_id: costId ?? null,
                }));

                goldDetails.forEach((_, index) => {
                  updateGoldDetail(index, { cost_id: costId });
                });
                voucherBoxes.forEach((_, index) => {
                  updateVoucherBox(index, "cost_id", costId);
                });
              }}
              ref={register(5)}
              onKeyDown={(e) => handleEnter(e, 5)}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default memo(DeliveryDetails);
