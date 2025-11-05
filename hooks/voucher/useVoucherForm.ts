/**
 * Main voucher form hook - combines all sub-hooks
 * Hook الرئيسي للنموذج - يجمع جميع الـ hooks الفرعية
 */

import { useRef, useEffect, useState } from "react";
import type { Voucher, VoucherDetail } from "@/types/voucher";
import { voucherService } from "@/services/api";
import { useVoucherFormState } from "./useVoucherFormState";
import { useVoucherDetails } from "./useVoucherDetails";
import { useVoucherActions } from "./useVoucherActions";
import { useVoucherNavigation } from "./useVoucherNavigation";
import { searchAccountsAction } from "@/app/actions/accounts.action";

export interface UseVoucherFormProps {
  voucherData?: Voucher | null;
  voucherDetailsData?: VoucherDetail[];
  isNewVoucher?: boolean;
  voucherRecordId?: number | string | null;
  accounts: any[];
  costCenters: any[];
  voucherTypes: any[];
  voucherStatuses: any[];
  caratTypes?: any[];
  startInEditMode?: boolean;
  vouchType?: number;
  formMode?: "new" | "edit" | "preview";
  newVoucherHref?: string;
}

export const useVoucherForm = ({
  voucherData,
  voucherDetailsData,
  isNewVoucher = true,
  voucherRecordId,
  accounts: initialAccounts,
  costCenters: initialCostCenters,
  voucherTypes: initialVoucherTypes,
  voucherStatuses: initialVoucherStatuses,
  caratTypes: initialCaratTypes = [],
  startInEditMode = false,
  vouchType = 2,
  formMode = "new",
  newVoucherHref,
}: UseVoucherFormProps) => {
  const hasGeneratedVoucherNumber = useRef(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vouchersList, setVouchersList] = useState<any[]>([]);
  const [isCreatedFromPrevious, setIsCreatedFromPrevious] = useState(false);
  const [originalVoucherData, setOriginalVoucherData] = useState<Voucher | null>(null);
  const [originalDetailsData, setOriginalDetailsData] = useState<VoucherDetail[]>([]);

  // State management
  const state = useVoucherFormState({
    voucherData,
    voucherDetailsData,
    isNewVoucher,
    vouchType,
    formMode,
    startInEditMode,
    initialAccounts,
    initialCostCenters,
    initialVoucherTypes,
    initialVoucherStatuses,
    initialCaratTypes,
  });

  // Details management
  const details = useVoucherDetails({
    initialDetails: voucherDetailsData,
    isNewVoucher,
    voucherId: state.voucher.vouch_id,
    accounts: state.accounts,
    caratTypes: state.caratTypes,
  });

  // Actions
  const actions = useVoucherActions({
    voucher: state.voucher,
    setVoucher: state.setVoucher,
    details: details.details,
    originalDetails: details.originalDetails,
    formMode,
    voucherRecordId,
    accounts: state.accounts,
    totals: details.totals,
    isCashBalanced: details.isCashBalanced,
    isGoldBalanced: details.isGoldBalanced,
  });

  // Navigation
  const navigation = useVoucherNavigation({
    vouchersList,
    currentVoucher: state.voucher,
    vouchType,
  });

  // Load vouchers list when modal opens
  useEffect(() => {
    if (isModalOpen) {
      const fetchVouchers = async () => {
        try {
          state.setIsLoading(true);
          // Load vouchers of the same type as current voucher
          const response = await voucherService.getAll({
            xvouch_type: vouchType.toString(),
            xcom_id: "1",
            xyear_id: "0",
          });

          if (response.success && response.data && Array.isArray(response.data)) {
            const filteredVouchers = response.data.filter(
              (v: any) => v.vouch_type === vouchType,
            );
            setVouchersList(filteredVouchers || []);
          } else {
            setVouchersList([]);
          }
        } catch (error) {
          console.error("Error loading vouchers list:", error);
          setVouchersList([]);
        } finally {
          state.setIsLoading(false);
        }
      };
      fetchVouchers();
    }
  }, [isModalOpen, vouchType]);

  // Generate next voucher number for new vouchers
  useEffect(() => {
    if (isNewVoucher && !hasGeneratedVoucherNumber.current) {
      hasGeneratedVoucherNumber.current = true;
      generateNextVoucherNumber();
    }
  }, [isNewVoucher, state.voucher.vouch_type]);

  const generateNextVoucherNumber = async () => {
    try {
      const nextId = await voucherService.getNextNumber(state.voucher.vouch_type);
      state.setVoucher((prev) => ({
        ...prev,
        vouch_id: nextId,
        vouch_date: new Date().toISOString(),
        cr_date: new Date().toISOString(),
      }));
    } catch (error) {
      state.setVoucher((prev) => ({
        ...prev,
        vouch_id: 1,
        vouch_date: new Date().toISOString(),
        cr_date: new Date().toISOString(),
      }));
    }
  };

  // Load voucher by ID
  const loadVoucher = async (id: number) => {
    try {
      state.setIsLoading(true);
      const vouchersResponse = await voucherService.getAll();

      if (
        vouchersResponse.success &&
        vouchersResponse.data &&
        Array.isArray(vouchersResponse.data)
      ) {
        const targetVoucher = vouchersResponse.data.find(
          (v: any) => v.id === id,
        );

        if (targetVoucher) {
          const formattedVoucher = {
            ...targetVoucher,
            vouch_date: targetVoucher.vouch_date
              ? targetVoucher.vouch_date
              : new Date().toISOString(),
            cr_date: targetVoucher.cr_date || new Date().toISOString(),
            vouch_id: targetVoucher.vouch_id || 0,
            ref_no: targetVoucher.ref_no || "",
            vouch_notes: targetVoucher.vouch_notes || "",
            vouch_status: targetVoucher.vouch_status || 1,
            pay_type: targetVoucher.pay_type || 1,
          };

          state.setVoucher(formattedVoucher);
          const voucherIndex = vouchersResponse.data.findIndex(
            (v: any) => v.id === id,
          );

          navigation.setCurrentRecord(voucherIndex + 1);

          const voucherVouchId = targetVoucher.vouch_id || id;
          const detailsResponse =
            await voucherService.getDetails(voucherVouchId);

          if (
            detailsResponse.success &&
            detailsResponse.data &&
            Array.isArray(detailsResponse.data)
          ) {
            const formattedDetails = detailsResponse.data.map((detail: any) => {
              const account = state.accounts.find(
                (acc) => acc.id === (detail.acc_id || detail.acc),
              );

              return {
                ...detail,
                acc_id: detail.acc_id || detail.acc || 0,
                acc_code: (account as any)?.acc_code || detail.acc_code || "",
                acc_name: (account as any)?.acc_name || detail.acc_name || "",
                cost_id: detail.cost_id || 0,
                debit:
                  detail.debit !== undefined && detail.debit !== null
                    ? Number(detail.debit)
                    : undefined,
                credit:
                  detail.credit !== undefined && detail.credit !== null
                    ? Number(detail.credit)
                    : undefined,
                g_debit:
                  detail.g_debit !== undefined && detail.g_debit !== null
                    ? Number(detail.g_debit)
                    : (detail.debit_g !== undefined && detail.debit_g !== null
                      ? Number(detail.debit_g)
                      : undefined),
                g_credit:
                  detail.g_credit !== undefined && detail.g_credit !== null
                    ? Number(detail.g_credit)
                    : (detail.credit_g !== undefined && detail.credit_g !== null
                      ? Number(detail.credit_g)
                      : undefined),
                debit_base: detail.debit_base !== undefined && detail.debit_base !== null
                  ? Number(detail.debit_base)
                  : (detail.debit !== undefined && detail.debit !== null ? Number(detail.debit) : undefined),
                credit_base: detail.credit_base !== undefined && detail.credit_base !== null
                  ? Number(detail.credit_base)
                  : (detail.credit !== undefined && detail.credit !== null ? Number(detail.credit) : undefined),
                g_debit_base: detail.g_debit_base !== undefined && detail.g_debit_base !== null
                  ? Number(detail.g_debit_base)
                  : undefined,
                g_credit_base: detail.g_credit_base !== undefined && detail.g_credit_base !== null
                  ? Number(detail.g_credit_base)
                  : undefined,
                gauge: Number(detail.gauge) || 875,
                vouch_notes: detail.vouch_notes || "",
              };
            });

            details.setDetails(formattedDetails);
            details.setOriginalDetails(formattedDetails);
            navigation.setTotalRecords(vouchersResponse.data.length);
          }
        }
      }
    } catch (error) {
      console.error("Error loading voucher:", error);
    } finally {
      state.setIsLoading(false);
    }
  };

  // Update voucher type
  const updateVoucherType = async (newType: number) => {
    state.setVoucher((prev) => ({ ...prev, vouch_type: newType }));
    await generateNextVoucherNumber();
  };

  // Load account options
  const loadAccountOptions = async (search: string): Promise<any[]> => {
    try {
      const result = await searchAccountsAction(search);

      if (!result.success) {
        return [];
      }

      const filteredAccounts = result.data;
      const term = search.toLowerCase();

      const options = filteredAccounts
        .map((acc: any) => {
          const accountCode = String(
            acc.acc_code ?? acc.code ?? "",
          ).toLowerCase();
          const accountName = String(
            acc.acc_name ?? acc.name ?? "",
          ).toLowerCase();
          const codeMatch = accountCode.indexOf(term);
          const nameMatch = accountName.indexOf(term);

          return {
            value: acc.id,
            label: `${acc.acc_code ?? acc.code ?? "غير معروف"} - ${acc.acc_name ?? acc.name ?? ""}`,
            account: acc,
            codeMatch,
            nameMatch,
          };
        })
        .filter((entry) => entry.codeMatch !== -1 || entry.nameMatch !== -1)
        .sort((a, b) => {
          const aCode = a.codeMatch === -1 ? Infinity : a.codeMatch;
          const bCode = b.codeMatch === -1 ? Infinity : b.codeMatch;

          if (aCode !== bCode) return aCode - bCode;
          const aName = a.nameMatch === -1 ? Infinity : a.nameMatch;
          const bName = b.nameMatch === -1 ? Infinity : b.nameMatch;

          return aName - bName;
        })
        .map(({ value, label, account }) => ({ value, label, account }));

      return options;
    } catch (e) {
      console.error("Error loading account options:", e);
      return [];
    }
  };

  // Get account select value
  const getAccountSelectValue = (detail: VoucherDetail) => {
    if (!detail.acc_id) return null;

    if (detail.acc_code && detail.acc_name) {
      return {
        value: detail.acc_id,
        label: `${detail.acc_code} - ${detail.acc_name}`,
      };
    }

    const account = state.accounts.find((acc) => acc.id === detail.acc_id);

    if (account) {
      return {
        value: detail.acc_id,
        label: `${account.acc_code ?? ""} - ${account.acc_name ?? ""}`,
      };
    }

    return null;
  };

  // Create from previous voucher
  const createFromPrevious = async (voucher?: any) => {
    const voucherToUse = voucher || navigation.selectedVoucher;

    if (!voucherToUse || !voucherToUse.id) {
      return;
    }

    try {
      state.setIsLoading(true);

      // Save original data before creating from previous
      setOriginalVoucherData({ ...state.voucher });
      setOriginalDetailsData([...details.details]);

      const detailsResponse = await voucherService.getDetails(voucherToUse.id);

      if (
        detailsResponse.success &&
        detailsResponse.data &&
        Array.isArray(detailsResponse.data)
      ) {
        state.setVoucher({
          ...voucherToUse,
          vouch_id: 0,
          vouch_date: new Date().toISOString(),
          cr_date: new Date().toISOString(),
          commit: false,
          post: false,
          print: false,
        });

        const formattedDetails = detailsResponse.data.map((detail: any) => ({
          id: 0,
          vouch_id: 0,
          acc_id: detail.acc_id || detail.acc || 0,
          acc_code: detail.acc_code || "",
          acc_name: detail.acc_name || "",
          cost_id: detail.cost_id || 0,
          debit: Number(detail.debit) || 0,
          credit: Number(detail.credit) || 0,
          debit_base: detail.debit_base !== undefined ? Number(detail.debit_base) : (Number(detail.debit) || 0),
          credit_base: detail.credit_base !== undefined ? Number(detail.credit_base) : (Number(detail.credit) || 0),
          g_debit: detail.g_debit !== undefined ? Number(detail.g_debit) : (Number(detail.debit_g) || 0),
          g_credit: detail.g_credit !== undefined ? Number(detail.g_credit) : (Number(detail.credit_g) || 0),
          g_debit_base: detail.g_debit_base !== undefined ? Number(detail.g_debit_base) : 0,
          g_credit_base: detail.g_credit_base !== undefined ? Number(detail.g_credit_base) : 0,
          gauge: Number(detail.gauge) || 875,
          vouch_notes: detail.vouch_notes || "",
          cr_date: new Date().toISOString(),
        }));

        details.setDetails(formattedDetails);
        const nextId = await voucherService.getNextNumber(
          voucherToUse.vouch_type,
        );

        state.setVoucher((prev) => ({
          ...prev,
          vouch_id: nextId,
        }));
        navigation.setSearchTerm("");
        navigation.setSelectedVoucher(null);
        
        // Mark as created from previous and close modal
        setIsCreatedFromPrevious(true);
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error("Error creating from previous voucher:", error);
    } finally {
      state.setIsLoading(false);
    }
  };

  // Reset to new state
  const resetToNew = async () => {
    try {
      if (originalVoucherData && originalDetailsData.length >= 0) {
        // Restore original data
        state.setVoucher(originalVoucherData);
        details.setDetails(originalDetailsData);
        setIsCreatedFromPrevious(false);
        setOriginalVoucherData(null);
        setOriginalDetailsData([]);
      } else {
        // If no original data, create a completely new voucher
        const nextId = await voucherService.getNextNumber(vouchType);
        state.setVoucher({
          vouch_id: nextId,
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
          ref_no: "",
          vouch_notes: "",
        });
        details.setDetails([]);
        setIsCreatedFromPrevious(false);
        setOriginalVoucherData(null);
        setOriginalDetailsData([]);
      }
    } catch (error) {
      console.error("Error resetting to new:", error);
    }
  };

  return {
    // State
    voucher: state.voucher,
    setVoucher: state.setVoucher,
    details: details.details,
    setDetails: details.setDetails,
    accounts: state.accounts,
    costCenters: state.costCenters,
    voucherTypes: state.voucherTypes,
    voucherStatuses: state.voucherStatuses,
    caratTypes: state.caratTypes,
    isLoading: actions.isLoading,
    isEditing: state.isEditing,
    setIsEditing: state.setIsEditing,
    isPrinting: actions.isPrinting,
    showValidationErrors: details.showValidationErrors,
    setShowValidationErrors: details.setShowValidationErrors,
    currentTime: state.currentTime,
    isClient: state.isClient,
    currentRecord: navigation.currentRecord,
    totalRecords: navigation.totalRecords,
    searchTerm: navigation.searchTerm,
    setSearchTerm: navigation.setSearchTerm,
    selectedVoucher: navigation.selectedVoucher,
    setSelectedVoucher: navigation.setSelectedVoucher,
    vouchersList,
    isModalOpen,
    setIsModalOpen,
    defaultAccountOptions: state.defaultAccountOptions,
    originalDetails: details.originalDetails,

    // Totals and balances
    totals: details.totals,
    cashBalance: details.cashBalance,
    goldBalance: details.goldBalance,
    isCashBalanced: details.isCashBalanced,
    isGoldBalanced: details.isGoldBalanced,
    isBalanced: details.isBalanced,

    // Functions
    updateCurrentTime: state.updateCurrentTime,
    updateAccountsList: state.updateAccountsList,
    loadVouchersList: navigation.loadVouchersList,
    generateNextVoucherNumber,
    loadVoucher,
    navigateToVoucher: navigation.navigateToVoucher,
    addDetailRow: details.addDetailRow,
    removeDetailRow: details.removeDetailRow,
    updateDetail: details.updateDetail,
    updateVoucherType,
    saveVoucher: actions.saveVoucher,
    printVoucher: actions.printVoucher,
    handleSearch: navigation.handleSearch,
    createFromPrevious,
    resetToNew,
    isCreatedFromPrevious,
    loadAccountOptions,
    getAccountSelectValue,
  };
};

