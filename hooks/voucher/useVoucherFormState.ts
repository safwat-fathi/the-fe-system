/**
 * Hook for managing voucher form state
 * إدارة الحالة الأساسية للنموذج
 */

import type { Voucher, VoucherDetail } from "@/types/voucher";

import { useEffect, useState } from "react";

interface UseVoucherFormStateProps {
  voucherData?: Voucher | null;
  voucherDetailsData?: VoucherDetail[];
  isNewVoucher?: boolean;
  vouchType?: number;
  formMode?: "new" | "edit" | "preview";
  startInEditMode?: boolean;
  initialAccounts: any[];
  initialCostCenters: any[];
  initialVoucherTypes: any[];
  initialVoucherStatuses: any[];
  initialCaratTypes?: any[];
}

export const useVoucherFormState = ({
  voucherData,
  voucherDetailsData,
  isNewVoucher = true,
  vouchType = 2,
  formMode = "new",
  startInEditMode = false,
  initialAccounts,
  initialCostCenters,
  initialVoucherTypes,
  initialVoucherStatuses,
  initialCaratTypes = [],
}: UseVoucherFormStateProps) => {
  // State Management
  const [voucher, setVoucher] = useState<Voucher>(
    voucherData || {
      vouch_id: 0,
      vouch_date: new Date().toISOString(),
      vouch_type: vouchType,
      vouch_amt: 0,
      pay_type: 1,
      cr_date: new Date().toISOString(),
      vouch_status: 1,
      commit: false,
      post: false,
      print: false,
      opps_vouch: 0,
      cost_id: null,
    },
  );

  const [currentTime, setCurrentTime] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [accounts, setAccounts] = useState<any[]>(initialAccounts);
  const [costCenters, setCostCenters] = useState<any[]>(initialCostCenters);
  const [voucherTypes, setVoucherTypes] = useState<any[]>(initialVoucherTypes);
  const [voucherStatuses, setVoucherStatuses] = useState<any[]>(
    initialVoucherStatuses || [],
  );
  const [caratTypes, setCaratTypes] = useState<any[]>(initialCaratTypes);
  const [isLoading, setIsLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isEditing, setIsEditing] = useState(
    formMode === "new" ? true : startInEditMode,
  );
  const [defaultAccountOptions, setDefaultAccountOptions] = useState<any[]>([]);

  // Initialize component
  useEffect(() => {
    setIsClient(true);
    updateCurrentTime();
  }, []);

  // Update voucher statuses when initialVoucherStatuses changes
  useEffect(() => {
    if (initialVoucherStatuses && Array.isArray(initialVoucherStatuses)) {
      setVoucherStatuses(initialVoucherStatuses);
    }
  }, [initialVoucherStatuses]);

  // Update editing mode based on formMode
  useEffect(() => {
    if (formMode === "preview") {
      setIsEditing(false);
    } else if (formMode === "new") {
      setIsEditing(true);
    } else if (formMode === "edit") {
      setIsEditing(startInEditMode !== false);
    }
  }, [formMode, startInEditMode]);

  // Load default account options
  useEffect(() => {
    const loadDefaultAccounts = () => {
      const options = accounts.slice(0, 50).map((acc) => ({
        value: acc.id,
        label: `${acc.acc_code ?? acc.code ?? ""} - ${acc.acc_name ?? acc.name ?? ""}`,
        account: acc,
      }));

      setDefaultAccountOptions(options);
    };

    if (accounts.length > 0) {
      loadDefaultAccounts();
    }
  }, [accounts]);

  // Helper Functions
  const updateCurrentTime = () => {
    const now = new Date();

    setCurrentTime(
      now.toLocaleTimeString("ar-SA", {
        hour12: true,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    );
  };

  const updateAccountsList = (newAccount: any) => {
    if (!accounts.find((acc) => acc.id === newAccount.id)) {
      setAccounts([...accounts, newAccount]);
    }
  };

  return {
    // State
    voucher,
    setVoucher,
    accounts,
    setAccounts,
    costCenters,
    voucherTypes,
    voucherStatuses,
    caratTypes,
    isLoading,
    setIsLoading,
    isEditing,
    setIsEditing,
    isPrinting,
    setIsPrinting,
    currentTime,
    isClient,
    defaultAccountOptions,

    // Functions
    updateCurrentTime,
    updateAccountsList,
  };
};
