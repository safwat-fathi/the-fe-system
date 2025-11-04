"use client";

import { useState, useEffect, useCallback } from "react";
import { glTransactionService, accountService, genericService } from "@/services/api";
import { GLTransaction } from "@/types/models/gl-transaction";

interface UseGLTransactionsProps {
  vouchId: number;
  vouchType: number;
  refNo?: string;
}

interface UseGLTransactionsReturn {
  isGLModalOpen: boolean;
  setIsGLModalOpen: (open: boolean) => void;
  glTransactions: GLTransaction[];
  loadingGLTransactions: boolean;
  handleViewGLTransactions: () => Promise<void>;
  getAccountName: (accId: number | string | null | undefined) => string;
}

export function useGLTransactions({
  vouchId,
  vouchType,
  refNo,
}: UseGLTransactionsProps): UseGLTransactionsReturn {
  // State management
  const [isGLModalOpen, setIsGLModalOpen] = useState(false);
  const [glTransactions, setGlTransactions] = useState<GLTransaction[]>([]);
  const [loadingGLTransactions, setLoadingGLTransactions] = useState(false);
  const [accountsList, setAccountsList] = useState<any[]>([]);

  // جلب الحسابات عند فتح المودال
  useEffect(() => {
    if (isGLModalOpen && accountsList.length === 0) {
      const loadAccounts = async () => {
        try {
          const accountsData = await accountService.getAllAccounts();
          setAccountsList(accountsData || []);
        } catch (error) {
          console.error("Error loading accounts:", error);
        }
      };
      loadAccounts();
    }
  }, [isGLModalOpen, accountsList.length]);

  // دالة جلب القيد المحاسبي (فقط للحركة الحالية)
  const loadGLTransactions = useCallback(async () => {
    if (!vouchId || vouchId <= 0) {
      return;
    }

    setLoadingGLTransactions(true);
    try {
      // استخدام genericService أولاً (مثل gl-transaction.action.ts)
      // لأنه يعمل بشكل أفضل مع gl_transaction_list
      let response: any;
      
      try {
        const genericResponse = await genericService.getTableData("gl_transaction_list", {
          xcom_id: "1",
          xyear_id: "0",
          xfrom_date: "0",
          xto_date: "0",
          xtrans_id: "0", // 0 = جميع الحركات
          xtrans_type: "0", // 0 = جميع الأنواع
        });

        if (genericResponse.success && genericResponse.data && Array.isArray(genericResponse.data)) {
          response = {
            success: true,
            data: genericResponse.data,
          };
        } else {
          // المحاولة الثانية: استخدام glTransactionService مباشرة
          response = await glTransactionService.getAll({
            xcom_id: "1",
            xyear_id: "0",
            xfrom_date: "0",
            xto_date: "0",
          });
        }
      } catch (error) {
        console.error("Error in genericService, trying glTransactionService:", error);
        // المحاولة الثانية: استخدام glTransactionService مباشرة
        response = await glTransactionService.getAll({
          xcom_id: "1",
          xyear_id: "0",
          xfrom_date: "0",
          xto_date: "0",
        });
      }

      if (response.success && response.data) {
        const transactions = Array.isArray(response.data) ? response.data : [];
        // تصفية الحركات حسب vouchId و vouchType على Client side
        const filteredTransactions = transactions.filter(
          (trans: GLTransaction) =>
            Number(trans.trans_id) === vouchId && Number(trans.trans_type) === vouchType,
        );
        setGlTransactions(filteredTransactions);
      } else {
        setGlTransactions([]);
      }
    } catch (error) {
      console.error("Error loading GL transactions:", error);
      setGlTransactions([]);
    } finally {
      setLoadingGLTransactions(false);
    }
  }, [vouchId, vouchType]);

  // فتح المودال عند الضغط على الزر
  const handleViewGLTransactions = useCallback(async () => {
    setIsGLModalOpen(true);
    await loadGLTransactions();
  }, [loadGLTransactions]);

  // دالة للحصول على اسم الحساب
  const getAccountName = useCallback(
    (accId: number | string | null | undefined): string => {
      if (!accId) return "";
      const account = accountsList.find(
        (acc) => acc.id === Number(accId) || acc.acc_id === String(accId),
      );
      return account ? account.acc_name || "" : "";
    },
    [accountsList],
  );

  return {
    isGLModalOpen,
    setIsGLModalOpen,
    glTransactions,
    loadingGLTransactions,
    handleViewGLTransactions,
    getAccountName,
  };
}

