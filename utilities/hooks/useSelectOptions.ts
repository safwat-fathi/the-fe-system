import type { Account } from "@/types/models/account";
import type { Box } from "@/types/models/box";
import type { CostCenter } from "@/types/voucher-form";

import { useMemo } from "react";

import { loadAccounts, type AccountOption } from "@/utilities/account.actions";
import { loadBoxes, type BoxOption } from "@/utilities/box.actions";
import {
  loadCostCenters,
  type CostCenterOption,
} from "@/utilities/costCenter.actions";

interface UseSelectOptionsInput {
  accounts?: Account[];
  boxes?: Box[];
  costCenters?: CostCenter[];
}

interface UseSelectOptionsResult {
  accountOptions: AccountOption[];
  boxOptions: BoxOption[];
  costCenterOptions: CostCenterOption[];
}

/**
 * Memoizes the transformation of raw model arrays into react-select option arrays.
 * Pass only the arrays you need; unused arrays default to [].
 */
export function useSelectOptions({
  accounts = [],
  boxes = [],
  costCenters = [],
}: UseSelectOptionsInput): UseSelectOptionsResult {
  const accountOptions = useMemo(() => loadAccounts(accounts), [accounts]);
  const boxOptions = useMemo(() => loadBoxes(boxes), [boxes]);
  const costCenterOptions = useMemo(
    () => loadCostCenters(costCenters),
    [costCenters],
  );

  return { accountOptions, boxOptions, costCenterOptions };
}
