import type { Box } from "@/types/models/box";
import type { VoucherBox } from "@/types/voucher";

export interface BoxOption {
  label: string;
  value: number;
  box: Box;
}

export const loadBoxes = (boxes: Box[] = []): BoxOption[] => {
  return (boxes || []).map((box) => ({
    label: box.cust_name || `صندوق ${box.id}`,
    value: box.id,
    box: box,
  }));
};

export const getBoxSelectValue = (
  voucherBox: VoucherBox,
  boxes: Box[] = [],
): BoxOption | null => {
  if (!voucherBox || !voucherBox.box_id) {
    return null;
  }

  const box = (boxes || []).find((b) => b.id === voucherBox.box_id);

  if (box) {
    return {
      label: box.cust_name || `صندوق ${box.id}`,
      value: box.id,
      box: box,
    };
  }

  return null;
};
