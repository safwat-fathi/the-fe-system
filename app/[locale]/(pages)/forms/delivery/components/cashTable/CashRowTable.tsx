import type { VoucherBox } from "@/types/voucher";

import { memo, type KeyboardEvent } from "react";

import BoxSelectCell from "./BoxSelectCell";
import CostCenterSelectCell from "./CostCenterSelectCell";

type BoxOption = {
  value: number;
  label: string;
};

type SelectOption = {
  value: string;
  label: string;
};

interface CashRowTableProps {
  index: number;
  isEditing: boolean;
  box: VoucherBox;
  cashBoxSelectOptions: BoxOption[];
  boxValue: BoxOption | null;
  costCenterOptions: SelectOption[];
  costCenterValue: SelectOption | null;
  setBoxInputRef: (
    index: number,
    col: number,
  ) => (input: HTMLInputElement | null) => void;
  updateVoucherBox: (
    index: number,
    field: keyof VoucherBox,
    value: unknown,
  ) => void;
  handleBoxKeyDown: (e: KeyboardEvent, index: number, col: number) => void;
  focusNextBoxField: (index: number, colIndex: number) => void;
  onRemoveRow: (index: number) => void;
}

const CashRowTable = ({
  index,
  isEditing,
  box,
  cashBoxSelectOptions,
  boxValue,
  costCenterOptions,
  costCenterValue,
  setBoxInputRef,
  updateVoucherBox,
  handleBoxKeyDown,
  focusNextBoxField,
  onRemoveRow,
}: CashRowTableProps) => {
  return (
    <tr>
      {/* Amount */}
      <td className="p-0 border">
        <input
          ref={setBoxInputRef(index, 0)}
          className="w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0"
          data-box-col={0}
          data-box-row={index}
          disabled={!isEditing}
          min="0"
          readOnly={!isEditing}
          style={{
            MozAppearance: "textfield",
            WebkitAppearance: "none",
            appearance: "none",
          }}
          type="number"
          value={box.amount || ""}
          onChange={(e) =>
            updateVoucherBox(
              index,
              "amount",
              e.target.value ? parseFloat(e.target.value) : 0,
            )
          }
          onKeyDown={(e) => handleBoxKeyDown(e, index, 0)}
          onWheel={(e) => e.currentTarget.blur()}
        />
      </td>
      {/* Box */}
      <td className="p-0 border">
        <BoxSelectCell
          focusNextField={focusNextBoxField}
          index={index}
          isEditing={isEditing}
          options={cashBoxSelectOptions}
          setInputRef={setBoxInputRef}
          value={boxValue}
          onChange={(idx, _field, val) => updateVoucherBox(idx, "box_id", val)}
          onKeyDown={handleBoxKeyDown}
        />
      </td>
      {/* Notes */}
      <td className="p-0 border">
        <input
          ref={setBoxInputRef(index, 2)}
          className="w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0"
          data-box-col={2}
          data-box-row={index}
          disabled={!isEditing}
          readOnly={!isEditing}
          type="text"
          value={box.vouch_notes || ""}
          onChange={(e) =>
            updateVoucherBox(index, "vouch_notes", e.target.value)
          }
          onKeyDown={(e) => handleBoxKeyDown(e, index, 2)}
        />
      </td>
      {/* Invoice */}
      <td className="p-0 border">
        <input
          ref={setBoxInputRef(index, 3)}
          className="w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0"
          data-box-col={3}
          data-box-row={index}
          disabled={!isEditing}
          readOnly={!isEditing}
          type="text"
          value={box.inv_id || ""}
          onChange={(e) => updateVoucherBox(index, "inv_id", e.target.value)}
          onKeyDown={(e) => handleBoxKeyDown(e, index, 3)}
        />
      </td>
      {/* Cost Center */}
      <td className="p-0 border">
        <CostCenterSelectCell
          focusNextField={focusNextBoxField}
          index={index}
          isEditing={isEditing}
          options={costCenterOptions}
          setInputRef={setBoxInputRef}
          value={costCenterValue}
          onChange={(idx, selectedOption) =>
            updateVoucherBox(
              idx,
              "cost_id",
              selectedOption ? Number(selectedOption.value) : undefined,
            )
          }
          onKeyDown={handleBoxKeyDown}
        />
      </td>
      {/* Delete */}
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

export default memo(CashRowTable);
