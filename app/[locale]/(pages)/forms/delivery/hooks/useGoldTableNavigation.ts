import type { GVoucherDetail, VoucherBox } from "@/types/voucher";

import { useMemo } from "react";

import { useTableNavigation } from "./useTableNavigation";

interface UseGoldTableNavigationParams {
  goldDetails: GVoucherDetail[];
  voucherBoxes: VoucherBox[];
  addGoldDetailRow: () => void;
  addVoucherBoxRow: () => void;
}

export function useGoldTableNavigation({
  goldDetails,
  voucherBoxes,
  addGoldDetailRow,
  addVoucherBoxRow,
}: UseGoldTableNavigationParams) {
  const tables = useMemo(
    () => [
      {
        name: "gold",
        rows: goldDetails,
        lastCol: 12,
        addRow: addGoldDetailRow,
        onLastRow: () => {
          const isEmpty =
            goldDetails.length > 0 &&
            !goldDetails[goldDetails.length - 1]?.item_id &&
            !goldDetails[goldDetails.length - 1]?.weight;

          if (isEmpty && voucherBoxes.length === 0) {
            addVoucherBoxRow();
          }
        },
      },
      {
        name: "box",
        rows: voucherBoxes,
        lastCol: 4,
        addRow: addVoucherBoxRow,
      },
    ],
    [goldDetails, voucherBoxes, addGoldDetailRow, addVoucherBoxRow],
  );

  const nav = useTableNavigation({ tables });
  const goldHelpers = nav.createTableHelpers("gold");
  const boxHelpers = nav.createTableHelpers("box");

  return {
    setGoldInputRef: goldHelpers.setInputRef,
    setBoxInputRef: boxHelpers.setInputRef,
    handleGoldKeyDown: goldHelpers.handleKeyDown,
    handleBoxKeyDown: boxHelpers.handleKeyDown,
    focusNextGoldField: goldHelpers.focusNextField,
    focusNextBoxField: boxHelpers.focusNextField,
  };
}
