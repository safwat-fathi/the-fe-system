"use client";

import type { GVoucherDetail } from "@/types/voucher";
import type { ItemSelectOption, FormItem as Item } from "../../useDeliveryForm";

import { memo, KeyboardEvent } from "react";

import ItemSelectCell from "./ItemSelectCell";
import BoxSelectCell from "./BoxSelectCell";
import CostCenterSelectCell from "./CostCenterSelectCell";

// ================== Types ==================
type GoldRowTableProps = {
  index: number;
  detail: GVoucherDetail;
  isEditing: boolean;
  items: Item[];
  // Item select props
  itemPlaceholder: string;
  defaultItemOptions: ItemSelectOption[];
  itemValue: ItemSelectOption | null;
  loadItemOptions: (
    search: string,
    loadedOptions: readonly ItemSelectOption[],
    additional: { page?: number },
  ) => Promise<ItemSelectOption[]>;
  onItemChange: (
    index: number,
    selectedOption: ItemSelectOption | null,
  ) => void;
  // Box select props
  boxOptions: { value: number; label: string }[];
  boxValue: { value: number; label: string } | null;
  boxPlaceholder?: string;
  onBoxChange: (
    index: number,
    selectedOption: { value: number; label: string } | null,
  ) => void;
  // Cost Center select props
  costCenterOptions: { value: string; label: string }[];
  costCenterValue: { value: string; label: string } | null;
  onCostCenterChange: (
    index: number,
    selectedOption: { value: string; label: string } | null,
  ) => void;

  // Navigation props
  onKeyDown: (
    e: KeyboardEvent,
    index: number,
    colIndex: number,
    options?: object,
  ) => void;
  setInputRef: (
    index: number,
    colIndex: number,
  ) => (el: HTMLInputElement | null) => void;
  focusNextField: (index: number, colIndex: number) => void;
  // Actions
  onRemoveRow: (index: number) => void;
  // Field update
  updateGoldDetail: (index: number, object: Partial<GVoucherDetail>) => void;
};

// ================== Input Styles ==================
const numberInputStyle = {
  MozAppearance: "textfield" as const,
  WebkitAppearance: "none" as const,
  appearance: "none" as const,
};

const inputClassName =
  "w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0";

// ================== Component ==================
const GoldRowTable = ({
  index,
  detail,
  isEditing,
  items,
  itemPlaceholder,
  defaultItemOptions,
  itemValue,
  loadItemOptions,
  onItemChange,
  // Box props
  boxOptions,
  boxValue,
  boxPlaceholder,
  onBoxChange,
  // Cost Center props
  costCenterOptions,
  costCenterValue,
  onCostCenterChange,
  onKeyDown,
  setInputRef,
  focusNextField,
  onRemoveRow,
  updateGoldDetail,
}: GoldRowTableProps) => {
  return (
    <tr className="border-b">
      {/* Item Select - Col 0 */}
      <ItemSelectCell
        index={index}
        detail={detail}
        isEditing={isEditing}
        items={items}
        placeholder={itemPlaceholder}
        defaultOptions={defaultItemOptions}
        value={itemValue}
        loadItemOptions={loadItemOptions}
        onItemChange={onItemChange}
        onKeyDown={onKeyDown}
        setInputRef={setInputRef}
        focusNextField={focusNextField}
      />

      {/* Weight - Col 1 */}
      <td className="p-0 border">
        <input
          ref={setInputRef(index, 1)}
          className={inputClassName}
          data-gold-col={1}
          data-gold-row={index}
          disabled={!isEditing}
          readOnly={!isEditing}
          style={numberInputStyle}
          type="number"
          value={detail.weight || ""}
          onChange={(e) =>
            updateGoldDetail(index, {
              weight: e.target.value ? parseFloat(e.target.value) : undefined,
            })
          }
          onKeyDown={(e) => onKeyDown(e, index, 1)}
          onWheel={(e) => e.currentTarget.blur()}
        />
      </td>

      {/* Calibration (k) - Col 2 */}
      <td className="p-0 border">
        <input
          ref={setInputRef(index, 2)}
          className={inputClassName}
          data-gold-col={2}
          data-gold-row={index}
          disabled={!isEditing}
          readOnly={!isEditing}
          style={numberInputStyle}
          type="number"
          value={detail.k || ""}
          onChange={(e) =>
            updateGoldDetail(index, {
              k: e.target.value ? parseFloat(e.target.value) : undefined,
            })
          }
          onKeyDown={(e) => onKeyDown(e, index, 2)}
          onWheel={(e) => e.currentTarget.blur()}
        />
      </td>

      {/* Calibrated Weight (g_weight) - Col 3 */}
      <td className="p-0 border">
        <input
          ref={setInputRef(index, 3)}
          className={inputClassName}
          data-gold-col={3}
          data-gold-row={index}
          disabled={!isEditing}
          readOnly={!isEditing}
          style={numberInputStyle}
          type="number"
          value={detail.g_weight || ""}
          onChange={(e) =>
            updateGoldDetail(index, {
              g_weight: e.target.value ? parseFloat(e.target.value) : undefined,
            })
          }
          onKeyDown={(e) => onKeyDown(e, index, 3)}
          onWheel={(e) => e.currentTarget.blur()}
        />
      </td>

      {/* Wage Rate (work_amt) - Col 4 */}
      <td className="p-0 border">
        <input
          ref={setInputRef(index, 4)}
          className={inputClassName}
          data-gold-col={4}
          data-gold-row={index}
          disabled={!isEditing}
          readOnly={!isEditing}
          step="0.01"
          style={numberInputStyle}
          type="number"
          value={detail.work_amt || ""}
          onChange={(e) =>
            updateGoldDetail(index, {
              work_amt: e.target.value ? parseFloat(e.target.value) : undefined,
            })
          }
          onKeyDown={(e) => onKeyDown(e, index, 4)}
          onWheel={(e) => e.currentTarget.blur()}
        />
      </td>

      {/* Wages (total_work) - Col 5 - Readonly/Calculated */}
      <td className="p-0 border">
        <input
          className={`${inputClassName} bg-yellow-50`}
          disabled
          readOnly
          step="0.01"
          style={numberInputStyle}
          title="يُحسب تلقائياً من: معدل الأجور × الوزن القائم"
          type="number"
          value={detail.total_work || ""}
        />
      </td>

      {/* Box - Col 6 */}
      <td className="p-0 border">
        <BoxSelectCell
          index={index}
          isEditing={isEditing}
          options={boxOptions}
          value={boxValue}
          placeholder={boxPlaceholder}
          onChange={onBoxChange}
          onKeyDown={onKeyDown}
          setInputRef={setInputRef}
          focusNextField={focusNextField}
        />
      </td>

      {/* Notes - Col 7 */}
      <td className="p-0 border">
        <input
          ref={setInputRef(index, 7)}
          className={inputClassName}
          data-gold-col={7}
          data-gold-row={index}
          disabled={!isEditing}
          readOnly={!isEditing}
          type="text"
          value={detail.notes || ""}
          onChange={(e) => updateGoldDetail(index, { notes: e.target.value })}
          onKeyDown={(e) => onKeyDown(e, index, 7)}
        />
      </td>

      {/* Caliber Difference (diff) - Col 8 */}
      <td className="p-0 border">
        <input
          ref={setInputRef(index, 8)}
          className={inputClassName}
          data-gold-col={8}
          data-gold-row={index}
          disabled={!isEditing}
          readOnly={!isEditing}
          style={numberInputStyle}
          type="number"
          value={detail.diff || ""}
          onChange={(e) =>
            updateGoldDetail(index, {
              diff: e.target.value ? parseFloat(e.target.value) : undefined,
            })
          }
          onKeyDown={(e) => onKeyDown(e, index, 8)}
          onWheel={(e) => e.currentTarget.blur()}
        />
      </td>

      {/* Sealing Amount (close_amt) - Col 9 */}
      <td className="p-0 border">
        <input
          ref={setInputRef(index, 9)}
          className={inputClassName}
          data-gold-col={9}
          data-gold-row={index}
          disabled={!isEditing}
          readOnly={!isEditing}
          style={numberInputStyle}
          type="number"
          value={detail.close_amt || ""}
          onChange={(e) =>
            updateGoldDetail(index, {
              close_amt: e.target.value
                ? parseFloat(e.target.value)
                : undefined,
            })
          }
          onKeyDown={(e) => onKeyDown(e, index, 9)}
          onWheel={(e) => e.currentTarget.blur()}
        />
      </td>

      {/* Sealing Weight (close_weight) - Col 10 */}
      <td className="p-0 border">
        <input
          ref={setInputRef(index, 10)}
          className={inputClassName}
          data-gold-col={10}
          data-gold-row={index}
          disabled={!isEditing}
          readOnly={!isEditing}
          style={numberInputStyle}
          type="number"
          value={detail.close_weight || ""}
          onChange={(e) =>
            updateGoldDetail(index, {
              close_weight: e.target.value
                ? parseFloat(e.target.value)
                : undefined,
            })
          }
          onKeyDown={(e) => onKeyDown(e, index, 10)}
          onWheel={(e) => e.currentTarget.blur()}
        />
      </td>

      {/* Invoice Number (inv_id) - Col 11 */}
      <td className="p-0 border">
        <input
          ref={setInputRef(index, 11)}
          className={inputClassName}
          data-gold-col={11}
          data-gold-row={index}
          disabled={!isEditing}
          min="0"
          readOnly={!isEditing}
          style={numberInputStyle}
          type="number"
          value={detail.inv_id || ""}
          onChange={(e) =>
            updateGoldDetail(index, {
              inv_id: e.target.value ? parseInt(e.target.value) : undefined,
            })
          }
          onKeyDown={(e) => onKeyDown(e, index, 11, { isLastCol: true })}
          onWheel={(e) => e.currentTarget.blur()}
        />
      </td>

      {/* Cost Center - Col 12 - TODO: Add CostCenterSelectCell */}
      {/* Cost Center - Col 12 */}
      <td className="p-0 border">
        <CostCenterSelectCell
          index={index}
          isEditing={isEditing}
          options={costCenterOptions}
          value={costCenterValue}
          onChange={onCostCenterChange}
          onKeyDown={onKeyDown}
          setInputRef={setInputRef}
          focusNextField={focusNextField}
        />
      </td>

      {/* Delete Button - Col 13 */}
      <td className="p-1 border">
        <button
          className="font-bold text-red-600 disabled:text-gray-400 disabled:cursor-not-allowed"
          disabled={!isEditing}
          type="button"
          onClick={() => onRemoveRow(index)}
        >
          ×
        </button>
      </td>
    </tr>
  );
};

export default memo(GoldRowTable);
