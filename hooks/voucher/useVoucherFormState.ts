/**
 * Hook for managing voucher form state
 * إدارة الحالة الأساسية للنموذج
 */

import type { Voucher } from "@/types/voucher";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface UseVoucherFormStateProps {
  voucherData?: Voucher | null;
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
  const [isClient] = useState(() => typeof window !== "undefined");
  const [accounts, setAccounts] = useState<any[]>(initialAccounts);
  const [costCenters] = useState<any[]>(initialCostCenters);
  const [voucherTypes] = useState<any[]>(initialVoucherTypes);
  const [voucherStatuses, setVoucherStatuses] = useState<any[]>(
    initialVoucherStatuses || [],
  );
  const [caratTypes] = useState<any[]>(initialCaratTypes);
  const [isLoading, setIsLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isEditing, setIsEditing] = useState(
    formMode === "new" ? true : startInEditMode,
  );
  
  // استخدام ref لتتبع آخر تحديث محلي (لتجنب تجاوز القيم المحدثة)
  const lastLocalUpdateRef = useRef<{ id?: number; commit?: boolean } | null>(null);

  // Helper Functions - يجب تعريفها قبل useEffect
  // تحسين: استخدام useCallback لتقليل إنشاء الدالة في كل render
  const updateCurrentTime = useCallback(() => {
    const now = new Date();

    setCurrentTime(
      now.toLocaleTimeString("ar-SA", {
        hour12: true,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    );
  }, []);

  // Initialize component
  useEffect(() => {
    updateCurrentTime();
  }, [updateCurrentTime]);

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

  // Update voucher when voucherData changes (e.g., after router.refresh())
  // لكن لا نتجاوز القيم المحدثة محلياً (commit = true و id موجود)
  useEffect(() => {
    if (voucherData) {
      setVoucher((prev) => {
        // إذا كان commit = true و id موجود في الـ state الحالي، لا نتجاوزهما
        // إلا إذا كان voucherData يحتوي على commit = true أيضاً (محدث من الخادم)
        const hasLocalCommit = prev.id && prev.commit === true;
        const serverHasCommit = voucherData.id && voucherData.commit === true;
        
        console.log("[useVoucherFormState] voucherData changed:", {
          prevId: prev.id,
          prevCommit: prev.commit,
          serverId: voucherData.id,
          serverCommit: voucherData.commit,
          hasLocalCommit,
          serverHasCommit,
        });
        
        // إذا كان هناك commit محلي و voucherData لا يحتوي على commit = true، نحافظ على القيم المحلية
        if (hasLocalCommit && !serverHasCommit) {
          console.log("[useVoucherFormState] Preserving local commit=true");
          return {
            ...prev,
            ...voucherData,
            // الحفاظ على القيم المحدثة محلياً
            id: prev.id,
            commit: prev.commit,
            // تحديث باقي القيم من voucherData
            vouch_id: voucherData.vouch_id || prev.vouch_id,
            post: voucherData.post !== undefined ? voucherData.post : prev.post,
            print: voucherData.print !== undefined ? voucherData.print : prev.print,
          };
        }
        
        // استخدام voucherData (إما لا يوجد commit محلي، أو voucherData محدث)
        console.log("[useVoucherFormState] Using server data");
        return {
          ...prev,
          ...voucherData,
          // الحفاظ على القيم المحدثة محلياً إذا كانت موجودة
          id: voucherData.id || prev.id,
          vouch_id: voucherData.vouch_id || prev.vouch_id,
          commit: voucherData.commit !== undefined ? voucherData.commit : prev.commit,
          post: voucherData.post !== undefined ? voucherData.post : prev.post,
          print: voucherData.print !== undefined ? voucherData.print : prev.print,
        };
      });
    }
  }, [voucherData]);

  // تحسين: استخدام useMemo بدلاً من useEffect + useState لتقليل re-renders
  const defaultAccountOptions = useMemo(() => {
    if (accounts.length === 0) {
      return [];
    }

    return accounts.slice(0, 50).map((acc) => ({
      value: acc.id,
      label: `${acc.acc_code ?? acc.code ?? ""} - ${acc.acc_name ?? acc.name ?? ""}`,
      account: acc,
    }));
  }, [accounts]);

  // تحسين: استخدام useCallback لتقليل إنشاء الدالة في كل render
  const updateAccountsList = useCallback(
    (newAccount: any) => {
      if (!accounts.find((acc) => acc.id === newAccount.id)) {
        setAccounts([...accounts, newAccount]);
      }
    },
    [accounts],
  );

  // Wrapper function لـ setVoucher لتتبع التحديثات المحلية
  const setVoucherWithTracking = useCallback(
    (updater: Voucher | ((prev: Voucher) => Voucher)) => {
      setVoucher((prev) => {
        const newVoucher = typeof updater === "function" ? updater(prev) : updater;
        
        // تتبع التحديثات المحلية (commit = true و id موجود)
        if (newVoucher.commit && newVoucher.id) {
          lastLocalUpdateRef.current = {
            id: newVoucher.id,
            commit: newVoucher.commit,
          };
        }
        
        return newVoucher;
      });
    },
    [],
  );

  return {
    // State
    voucher,
    setVoucher: setVoucherWithTracking,
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
