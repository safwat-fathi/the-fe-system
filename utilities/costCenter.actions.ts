import type { CostCenter } from "@/types/voucher-form";
import type { VoucherDetail } from "@/types/voucher";

export interface CostCenterOption {
  label: string;
  value: number;
  costCenter: CostCenter;
}

export const loadCostCenters = (
  costCenters: CostCenter[] = [],
): CostCenterOption[] => {
  return (costCenters || []).map((costCenter) => ({
    label: `${costCenter.id} - ${costCenter.cost_name || costCenter.cost_name_e || ""}`,
    value: costCenter.id,
    costCenter: costCenter,
  }));
};

export const getCostCenterSelectValue = (
  detail: VoucherDetail,
  costCenters: CostCenter[] = [],
): CostCenterOption | null => {
  if (!detail.cost_id) {
    return null;
  }

  const costCenter = (costCenters || []).find((cc) => cc.id === detail.cost_id);

  if (costCenter) {
    return {
      label: `${costCenter.id} - ${costCenter.cost_name || costCenter.cost_name_e || ""}`,
      value: costCenter.id,
      costCenter: costCenter,
    };
  }

  return null;
};
