"use client";
import type { ItemSelectOption, FormItem as Item } from "../../useDeliveryForm";
import type { GVoucherDetail } from "@/types/voucher";

import { useTranslations, useLocale } from "next-intl";
import { KeyboardEvent, memo, useMemo } from "react";

import { GOLD_TABLE_COLUMNS } from "../../constants";

import GoldRowTable from "./GoldRowTable";

import { getLocaleDir } from "@/i18n/config";

type GoldTableProps = {
  isEditing: boolean;
  goldDetails: GVoucherDetail[];
  items: Item[];
  // Actions
  addGoldDetailRow: () => void;
  removeGoldDetailRow: (index: number) => void;
  updateGoldDetail: (index: number, object: Partial<GVoucherDetail>) => void;
  // Item select
  loadItemOptions: (
    search: string,
    loadedOptions: readonly ItemSelectOption[],
    additional: { page?: number },
  ) => Promise<ItemSelectOption[]>;
  getItemSelectValue: (detail: GVoucherDetail) => ItemSelectOption | null;
  getDefaultItemOptions: (detail: GVoucherDetail) => ItemSelectOption[];
  onItemChange: (
    index: number,
    selectedOption: ItemSelectOption | null,
  ) => void;
  // Box select
  boxOptions: { value: number; label: string }[];
  getBoxValue: (
    detail: GVoucherDetail,
  ) => { value: number; label: string } | null;
  onBoxChange: (
    index: number,
    selectedOption: { value: number; label: string } | null,
  ) => void;
  // Cost Center select
  costCenterOptions: { value: string; label: string }[];
  getCostCenterValue: (
    detail: GVoucherDetail,
  ) => { value: string; label: string } | null;
  onCostCenterChange: (
    index: number,
    selectedOption: { value: string; label: string } | null,
  ) => void;
  // Navigation
  onKeyDown: (
    e: KeyboardEvent,
    index: number,
    colIndex: number,
    options?: {},
  ) => void;
  setInputRef: (
    index: number,
    colIndex: number,
  ) => (el: HTMLInputElement | null) => void;
  focusNextField: (index: number, colIndex: number) => void;
};

const GoldTable = ({
  isEditing,
  goldDetails,
  items,
  addGoldDetailRow,
  removeGoldDetailRow,
  updateGoldDetail,
  loadItemOptions,
  getItemSelectValue,
  getDefaultItemOptions,
  onItemChange,
  // Box
  boxOptions,
  getBoxValue,
  onBoxChange,
  // Cost Center
  costCenterOptions,
  getCostCenterValue,
  onCostCenterChange,
  onKeyDown,
  setInputRef,
  focusNextField,
}: GoldTableProps) => {
  const locale = useLocale();
  const dir = getLocaleDir(locale as "ar" | "en");
  const textAlign = dir === "rtl" ? "text-right" : "text-left";
  const textAlignCenter = "text-center";
  const t = useTranslations("forms.customerGoldVoucher.tables.gold");

  const defaultItemOptions = useMemo(() => {
    return goldDetails.map((detail) => getDefaultItemOptions(detail));
  }, [goldDetails, getDefaultItemOptions]);

  const itemValue = useMemo(() => {
    return goldDetails.map((detail) => getItemSelectValue(detail));
  }, [goldDetails, getItemSelectValue]);

  const boxValue = useMemo(() => {
    return goldDetails.map((detail) => getBoxValue(detail));
  }, [goldDetails, getBoxValue]);

  const costCenterValue = useMemo(() => {
    return goldDetails.map((detail) => getCostCenterValue(detail));
  }, [goldDetails, getCostCenterValue]);

  return (
    <div className="bg-white rounded-lg border border-slate-200 mb-1.5">
      <div className="p-1 border-b border-slate-200 bg-slate-50">
        <h3 className={`text-xs font-semibold text-slate-800 ${textAlign}`}>
          {t("title")}
        </h3>
      </div>
      <div className="p-0.5">
        <div className="flex justify-between mb-0.5">
          <button
            className="text-xs px-2 py-0.5 btn"
            disabled={!isEditing}
            type="button"
            onClick={addGoldDetailRow}
          >
            {t("addRow")}
          </button>
        </div>
      </div>
      <div className="overflow-x-auto mb-0.5 max-w-full">
        <div className="max-h-[500px] overflow-y-auto">
          <table className="min-w-[1400px] border text-xs text-center table-fixed">
            <thead className="bg-gray-100 text-xs font-bold">
              <tr>
                {GOLD_TABLE_COLUMNS.map((column) => (
                  <th
                    key={column.key}
                    className={`${column.width} p-1 border ${textAlignCenter}`}
                  >
                    {t(`columns.${column.key}` as Parameters<typeof t>[0])}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {goldDetails.map((detail, index) => (
                <GoldRowTable
                  key={detail.id || index}
                  index={index}
                  detail={detail}
                  isEditing={isEditing}
                  items={items}
                  itemPlaceholder={t("placeholders.selectItem")}
                  defaultItemOptions={defaultItemOptions[index]}
                  itemValue={itemValue[index]}
                  loadItemOptions={loadItemOptions}
                  onItemChange={onItemChange}
                  // Box
                  boxOptions={boxOptions}
                  boxValue={boxValue[index]}
                  onBoxChange={onBoxChange}
                  // Cost Center
                  costCenterOptions={costCenterOptions}
                  costCenterValue={costCenterValue[index]}
                  onCostCenterChange={onCostCenterChange}
                  onKeyDown={onKeyDown}
                  setInputRef={setInputRef}
                  focusNextField={focusNextField}
                  onRemoveRow={removeGoldDetailRow}
                  updateGoldDetail={updateGoldDetail}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default memo(GoldTable);
