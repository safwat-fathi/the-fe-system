import type { Voucher, VoucherDetail, VoucherBox } from "@/types/voucher";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import {
  createVoucherAction,
  updateVoucherAction,
} from "@/app/actions/voucher.action";
import { searchAccountsAction } from "@/app/actions/accounts.action";
import { formatAmount } from "@/utilities/formatAmount";

interface UseCashReceiptVoucherFormProps {
  voucherData?: Voucher | null;
  voucherDetailsData?: VoucherDetail[];
  voucherBoxes?: VoucherBox[];
  isNewVoucher?: boolean;
  voucherRecordId?: number | string | null;
  accounts: any[];
  boxes: any[];
  costCenters: any[];
  voucherTypes: any[];
  voucherStatuses: any[];
  startInEditMode?: boolean;
  vouchType: number; // 1 للقبض، 2 للصرف
  formMode?: "new" | "edit" | "preview";
  initialVoucherNumber?: number;
}

export const useCashReceiptVoucherForm = ({
  voucherData,
  voucherDetailsData,
  voucherBoxes: initialVoucherBoxes = [],
  isNewVoucher = true,
  voucherRecordId,
  accounts: initialAccounts,
  boxes: initialBoxes,
  costCenters: initialCostCenters,
  voucherTypes: initialVoucherTypes,
  voucherStatuses: initialVoucherStatuses,
  startInEditMode = false,
  vouchType,
  formMode = "new",
  initialVoucherNumber = 1,
}: UseCashReceiptVoucherFormProps) => {
  const router = useRouter();

  // State Management
  const [voucher, setVoucher] = useState<Voucher>(() => {
    if (voucherData) {
      return {
        ...voucherData,
        cost_id: voucherData.cost_id ?? (voucherData as any).cost ?? null,
      };
    }

    return {
      vouch_id: initialVoucherNumber,
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
    };
  });

  const [currentTime, setCurrentTime] = useState("");
  const [isClient] = useState(() => typeof window !== "undefined");
  const [voucherBoxes, setVoucherBoxes] = useState<VoucherBox[]>(
    initialVoucherBoxes || [],
  );
  const [details, setDetails] = useState<VoucherDetail[]>(
    voucherDetailsData || [],
  );
  const [accounts, setAccounts] = useState<any[]>(initialAccounts);
  const [boxes] = useState<any[]>(initialBoxes);
  const [costCenters] = useState<any[]>(initialCostCenters);
  const [voucherTypes] = useState<any[]>(initialVoucherTypes);
  const [voucherStatuses, setVoucherStatuses] = useState<any[]>(
    initialVoucherStatuses || [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isEditing, setIsEditing] = useState(startInEditMode);
  const [originalDetails, setOriginalDetails] = useState<VoucherDetail[]>([]);
  const [originalBoxes, setOriginalBoxes] = useState<VoucherBox[]>([]);

  const hasLoadedVoucherBoxes = useRef(false);
  const previousVouchNotesRef = useRef<string>(voucher.vouch_notes || "");

  // Helper Functions - يجب تعريفها قبل useEffect
  // تحسين: استخدام useCallback لتقليل إنشاء الدالة في كل render
  const updateCurrentTime = useCallback(() => {
    const now = new Date();

    setCurrentTime(now.toLocaleTimeString("ar-EG"));
  }, []);

  // Initialize component
  useEffect(() => {
    updateCurrentTime();

    if (isNewVoucher) {
      if (voucherBoxes.length === 0) {
        setVoucherBoxes([
          {
            id: 0,
            vouch_id: 0,
            box_id: 0,
            amount: 0,
            vouch_notes: "",
            cost_id: voucher.cost_id ?? null,
            inv_id: undefined,
            cr_date: new Date().toISOString(),
          },
        ]);
      }
      if (details.length === 0) {
        setDetails([
          {
            id: 0,
            vouch_id: 0,
            acc_id: 0,
            acc_code: "",
            acc_name: "",
            debit: undefined,
            credit: undefined,
            debit_g: undefined,
            credit_g: undefined,
            gauge: 875,
            cost_id: voucher.cost_id ?? null,
            vouch_notes: "",
            cr_date: new Date().toISOString(),
          },
        ]);
      }
    } else if (!isNewVoucher) {
      setOriginalDetails(voucherDetailsData || []);
      setOriginalBoxes(initialVoucherBoxes || []);
      if (initialVoucherBoxes && initialVoucherBoxes.length > 0) {
        setVoucherBoxes(initialVoucherBoxes);
      }
    }
  }, []);

  useEffect(() => {
    const currentNotes = voucher.vouch_notes || "";
    const previousNotes = previousVouchNotesRef.current;

    if (currentNotes === previousNotes) {
      return;
    }

    previousVouchNotesRef.current = currentNotes;

    setDetails((prev) =>
      prev.map((detail) => {
        const existingNote = detail.vouch_notes || "";

        if (!existingNote || existingNote === previousNotes) {
          return {
            ...detail,
            vouch_notes: currentNotes,
          };
        }

        return detail;
      }),
    );

    setVoucherBoxes((prev) =>
      prev.map((box) => {
        const existingNote = box.vouch_notes || "";

        if (!existingNote || existingNote === previousNotes) {
          return {
            ...box,
            vouch_notes: currentNotes,
          };
        }

        return box;
      }),
    );
  }, [voucher.vouch_notes]);

  useEffect(() => {
    if (
      !isNewVoucher &&
      initialVoucherBoxes &&
      initialVoucherBoxes.length > 0 &&
      !hasLoadedVoucherBoxes.current
    ) {
      setVoucherBoxes(initialVoucherBoxes);
      hasLoadedVoucherBoxes.current = true;
    }
  }, [isNewVoucher, initialVoucherBoxes]);

  useEffect(() => {
    if (formMode === "preview") {
      setIsEditing(false);
    } else if (formMode === "new") {
      setIsEditing(true);
    } else if (formMode === "edit") {
      setIsEditing(startInEditMode !== false);
    }
  }, [formMode, startInEditMode]);

  useEffect(() => {
    if (initialVoucherStatuses && Array.isArray(initialVoucherStatuses)) {
      setVoucherStatuses(initialVoucherStatuses);
    }
  }, [initialVoucherStatuses]);

  useEffect(() => {
    if (!isClient) return;
    const interval = setInterval(updateCurrentTime, 1000);

    return () => clearInterval(interval);
  }, [isClient, updateCurrentTime]);

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

  const loadAccountOptions = async (search: string): Promise<any[]> => {
    try {
      const result = await searchAccountsAction(search);

      if (!result.success) return [];

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
        .sort((a: any, b: any) => {
          const aCode = a.codeMatch === -1 ? Infinity : a.codeMatch;
          const bCode = b.codeMatch === -1 ? Infinity : b.codeMatch;

          if (aCode !== bCode) return aCode - bCode;
          const aName = a.nameMatch === -1 ? Infinity : a.nameMatch;
          const bName = b.nameMatch === -1 ? Infinity : b.nameMatch;

          return aName - bName;
        })
        .map(({ value, label, account }: any) => ({ value, label, account }));

      return options;
    } catch (e) {
      console.error("Error loading account options:", e);

      return [];
    }
  };

  // تحسين: استخدام useCallback لتقليل إنشاء الدالة في كل render
  const getAccountSelectValue = useCallback(
    (detail: VoucherDetail) => {
      if (!detail.acc_id) return null;

      if (detail.acc_code && detail.acc_name) {
        return {
          value: detail.acc_id,
          label: `${detail.acc_code} - ${detail.acc_name}`,
        };
      }

      const account = accounts.find((acc) => acc.id === detail.acc_id);

      if (account) {
        return {
          value: detail.acc_id,
          label: `${account.acc_code ?? ""} - ${account.acc_name ?? ""}`,
        };
      }

      return null;
    },
    [accounts],
  );

  // Voucher Boxes Management
  const updateVoucherBox = (index: number, field: string, value: any) => {
    setVoucherBoxes((prev) => {
      const updated = prev.map((box, i) => {
        if (i === index) {
          const updatedBox = { ...box, [field]: value };

          if (field === "box_id" && (!value || value === 0)) {
            updatedBox.box = undefined;
          }

          return updatedBox;
        }

        return box;
      });

      return updated;
    });
  };

  const addVoucherBoxRow = () => {
    // التحقق مما إذا كان السطر الأخير فارغاً
    if (voucherBoxes.length > 0) {
      const lastBox = voucherBoxes[voucherBoxes.length - 1];
      const isEmpty =
        (!lastBox.box_id || lastBox.box_id === 0) &&
        (!lastBox.amount || lastBox.amount === 0);

      if (isEmpty) {
        return;
      }
    }

    setVoucherBoxes((prev) => [
      ...prev,
      {
        id: 0,
        vouch_id: voucher.id || 0,
        box_id: 0,
        amount: 0,
        vouch_notes: "",
        cost_id: voucher.cost_id ?? null,
        inv_id: undefined,
        cr_date: new Date().toISOString(),
      },
    ]);
  };

  const removeVoucherBoxRow = (index: number) => {
    setVoucherBoxes((prev) => prev.filter((_, i) => i !== index));
  };

  // Details Management
  const updateDetail = (index: number, field: string, value: any) => {
    setDetails((prev) => {
      const updated = prev.map((detail, i) => {
        if (i === index) {
          return { ...detail, [field]: value };
        }

        return detail;
      });

      return updated;
    });
  };

  const addDetailRow = () => {
    // التحقق مما إذا كان السطر الأخير فارغاً
    if (details.length > 0) {
      const lastDetail = details[details.length - 1];
      const isEmpty =
        (!lastDetail.acc_id || lastDetail.acc_id === 0) &&
        (!lastDetail.debit || lastDetail.debit === 0) &&
        (!lastDetail.credit || lastDetail.credit === 0);

      if (isEmpty) {
        return;
      }
    }

    setDetails((prev) => [
      ...prev,
      {
        id: 0,
        vouch_id: voucher.vouch_id || 0,
        acc_id: 0,
        acc_code: "",
        acc_name: "",
        debit: undefined,
        credit: undefined,
        debit_g: undefined,
        credit_g: undefined,
        gauge: 875,
        cost_id: voucher.cost_id ?? null,
        vouch_notes: "",
        cr_date: new Date().toISOString(),
      },
    ]);
  };

  const removeDetailRow = (index: number) => {
    setDetails((prev) => prev.filter((_, i) => i !== index));
  };

  // تحسين: استخدام useCallback لتقليل إنشاء الدالة في كل render
  const handleMasterCostChange = useCallback(
    (costId: number | null) => {
      const previousCost =
        voucher.cost_id !== undefined && voucher.cost_id !== null
          ? voucher.cost_id
          : null;

      setVoucher((prev) => ({
        ...prev,
        cost_id: costId ?? null,
      }));

      setDetails((prev) =>
        prev.map((detail) => {
          const detailCost =
            detail.cost_id !== undefined && detail.cost_id !== null
              ? detail.cost_id
              : 0;

          if (
            detailCost > 0 &&
            previousCost !== null &&
            detailCost !== previousCost
          ) {
            return detail;
          }

          return {
            ...detail,
            cost_id: costId ?? null,
          };
        }),
      );

      setVoucherBoxes((prev) =>
        prev.map((box) => {
          const boxCost =
            box.cost_id !== undefined && box.cost_id !== null ? box.cost_id : 0;

          if (
            boxCost > 0 &&
            previousCost !== null &&
            boxCost !== previousCost
          ) {
            return box;
          }

          return {
            ...box,
            cost_id: costId ?? null,
          };
        }),
      );
    },
    [voucher.cost_id],
  );

  // Calculate totals
  const totals = useMemo(() => {
    const totalBoxes = voucherBoxes.reduce(
      (sum, box) => sum + (box.amount || 0),
      0,
    );

    const totalDetails =
      vouchType === 1
        ? details.reduce((sum, detail) => sum + (detail.credit || 0), 0)
        : details.reduce((sum, detail) => sum + (detail.debit || 0), 0);

    return { totalBoxes, totalDetails };
  }, [voucherBoxes, details, vouchType]);

  const balance = totals.totalBoxes - totals.totalDetails;
  const isBalanced = Math.abs(balance) < 0.01;

  // Save voucher
  const saveVoucher = async () => {
    const voucherDate = new Date(voucher.vouch_date);
    const today = new Date();

    today.setHours(23, 59, 59, 999);

    if (voucherDate > today) {
      toast.error("لا يمكن إنشاء قيد بتاريخ أكبر من تاريخ اليوم");

      return;
    }

    if (!isBalanced) {
      toast.error(
        `غير متزن: إجمالي النقدية (${totals.totalBoxes.toFixed(2)}) يجب أن يساوي إجمالي التفاصيل (${totals.totalDetails.toFixed(2)})`,
      );

      return;
    }

    // إزالة الصفوف الفارغة من جدول النقدية
    let currentBoxes = [...voucherBoxes];

    if (currentBoxes.length > 0) {
      const lastBox = currentBoxes[currentBoxes.length - 1];
      const isEmpty =
        (!lastBox.box_id || lastBox.box_id === 0) &&
        (!lastBox.amount || lastBox.amount === 0);

      if (isEmpty) {
        currentBoxes.pop();
        setVoucherBoxes(currentBoxes);
      }
    }

    // إزالة جميع الصفوف الفارغة الأخرى من جدول النقدية
    currentBoxes = currentBoxes.filter((box) => {
      const hasBox = box.box_id && box.box_id > 0;
      const hasAmount = box.amount && box.amount > 0;

      return hasBox && hasAmount;
    });

    // إزالة الصفوف الفارغة من جدول الحسابات
    let currentDetails = [...details];

    if (currentDetails.length > 0) {
      const lastDetail = currentDetails[currentDetails.length - 1];
      const isEmpty =
        (!lastDetail.acc_id || lastDetail.acc_id === 0) &&
        (!lastDetail.debit || lastDetail.debit === 0) &&
        (!lastDetail.credit || lastDetail.credit === 0);

      if (isEmpty) {
        currentDetails.pop();
        setDetails(currentDetails);
      }
    }

    // إزالة جميع الصفوف الفارغة الأخرى من جدول الحسابات
    currentDetails = currentDetails.filter((detail) => {
      const hasAccount = detail.acc_id && detail.acc_id > 0;
      const hasDebit = detail.debit && detail.debit > 0;
      const hasCredit = detail.credit && detail.credit > 0;

      return hasAccount && (hasDebit || hasCredit);
    });

    if (currentBoxes.length === 0) {
      toast.error("يرجى إدخال صندوق واحد على الأقل");

      return;
    }

    if (currentDetails.length === 0) {
      toast.error("يرجى إدخال حساب واحد على الأقل");

      return;
    }

    const validBoxes = currentBoxes;
    const validDetails = currentDetails;

    setIsLoading(true);

    try {
      const masterCostId =
        voucher.cost_id !== undefined &&
        voucher.cost_id !== null &&
        voucher.cost_id > 0
          ? voucher.cost_id
          : null;

      const voucherData = {
        vouch_id: voucher.vouch_id,
        vouch_date: voucher.vouch_date,
        vouch_type: vouchType,
        vouch_amt: 0,
        vouch_notes: voucher.vouch_notes || "",
        vouch_status: voucher.vouch_status || 1,
        pay_type: voucher.pay_type,
        ref_no: voucher.ref_no || "",
        opps_vouch: voucher.opps_vouch || 0,
        cost_id: masterCostId,
      };

      const boxesData = validBoxes.map((box) => ({
        id: box.id || 0,
        box_id: box.box_id,
        amount: box.amount,
        vouch_notes: box.vouch_notes || "",
        cost_id:
          box.cost_id !== undefined && box.cost_id !== null && box.cost_id > 0
            ? box.cost_id
            : masterCostId,
        inv_id: box.inv_id || null,
      }));

      const detailsData = validDetails.map((detail) => ({
        id: detail.id || 0,
        vouch_id: voucher.vouch_id,
        acc_id: detail.acc_id,
        debit: vouchType === 2 ? detail.debit || 0 : 0,
        credit: vouchType === 1 ? detail.credit || 0 : 0,
        debit_g: 0,
        credit_g: 0,
        gauge: detail.gauge || 875,
        vouch_notes: detail.vouch_notes || "",
        cost_id:
          detail.cost_id !== undefined &&
          detail.cost_id !== null &&
          detail.cost_id > 0
            ? detail.cost_id
            : masterCostId,
      }));

      const currentDetailIds = detailsData
        .map((d) => d.id)
        .filter((id) => id > 0);
      const originalDetailIds = originalDetails
        .map((d) => d.id)
        .filter((id) => id && id > 0) as number[];
      const deletedDetailIds = originalDetailIds.filter(
        (id) => !currentDetailIds.includes(id),
      );

      const currentBoxIds = boxesData.map((b) => b.id).filter((id) => id > 0);
      const originalBoxIds = originalBoxes
        .map((b) => b.id)
        .filter((id) => id && id > 0) as number[];
      const deletedBoxIds = originalBoxIds.filter(
        (id) => !currentBoxIds.includes(id),
      );

      const result =
        formMode === "edit"
          ? await updateVoucherAction(
              voucherData,
              detailsData,
              deletedDetailIds,
              voucherRecordId as number | undefined,
              boxesData,
              deletedBoxIds,
            )
          : await createVoucherAction(voucherData, detailsData, boxesData);

      if (result.success && result.data) {
        const realId = result.data.id;
        const savedVouchId = result.data.vouch_id || voucher.vouch_id;

        setVoucher((prev) => ({
          ...prev,
          commit: true,
          id: realId,
          vouch_id: savedVouchId,
        }));

        toast.success(result.message);

        const basePath =
          vouchType === 1 ? "/forms/cash-receipt" : "/forms/payment-receipt";

        // استخدام vouch_id في URL بدلاً من id
        if (savedVouchId && Number(savedVouchId) > 0) {
          router.push(`${basePath}/${savedVouchId}?mode=preview`);
        } else if (realId) {
          // Fallback إلى id إذا لم يكن vouch_id متاحاً
          router.push(`${basePath}/${realId}?mode=preview`);
        }
      } else {
        toast.error(result.message || "حدث خطأ أثناء الحفظ");
      }
    } catch (error) {
      console.error("Error saving voucher:", error);
      toast.error("حدث خطأ أثناء الحفظ");
    } finally {
      setIsLoading(false);
    }
  };

  // Print voucher (simplified - HTML will be in component)
  const printVoucher = async () => {
    setIsPrinting(true);
    try {
      const printWindow = window.open("", "_blank");

      if (printWindow) {
        const formattedDate = voucher.vouch_date
          ? new Date(voucher.vouch_date).toLocaleDateString("ar-SA", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "";

        const validBoxes = voucherBoxes.filter(
          (b) => b.box_id && b.box_id > 0 && b.amount && b.amount > 0,
        );
        const validDetails = details.filter((d) => d.acc_id && d.acc_id > 0);

        const voucherTypeName = vouchType === 1 ? "سند قبض" : "سند صرف";

        // Note: Full HTML/CSS will be moved to a separate utility function
        // to reduce hook size
        printWindow.document.write(`
          <html dir="rtl">
            <head>
              <meta charset="UTF-8">
              <title>${voucherTypeName} - ${voucher.vouch_id}</title>
              <style>
                @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap');
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Cairo', sans-serif; font-size: 13px; padding: 40px 30px; }
                .header { text-align: center; margin-bottom: 35px; padding-bottom: 25px; border-bottom: 3px solid #e2e8f0; }
                .header h1 { font-size: 28px; font-weight: 700; color: #1a202c; margin-bottom: 15px; }
                table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                th { padding: 14px 10px; text-align: center; font-weight: 600; font-size: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; }
                td { padding: 12px 10px; text-align: center; border: 1px solid #e2e8f0; }
                .totals { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); font-weight: 700; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>${voucherTypeName}</h1>
                <div>رقم السند: ${voucher.vouch_id || "-"}</div>
                <div>التاريخ: ${formattedDate}</div>
              </div>
              <div>عدد الصناديق: ${validBoxes.length}</div>
              <div>عدد الحسابات: ${validDetails.length}</div>
              <div>الإجمالي: ${formatAmount(totals.totalBoxes)}</div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
        setVoucher((prev) => ({ ...prev, print: true }));
      }
    } catch (error) {
      toast.error(
        `حدث خطأ أثناء الطباعة: ${error instanceof Error ? error.message : "خطأ غير معروف"}`,
      );
    } finally {
      setIsPrinting(false);
    }
  };

  return {
    // State
    voucher,
    setVoucher,
    voucherBoxes,
    setVoucherBoxes,
    details,
    accounts,
    setAccounts,
    boxes,
    costCenters,
    voucherTypes,
    voucherStatuses,
    isLoading,
    isEditing,
    setIsEditing,
    isPrinting,
    currentTime,
    isClient,
    defaultAccountOptions,

    // Totals and balance
    totals,
    balance,
    isBalanced,

    // Functions
    updateCurrentTime,
    loadAccountOptions,

    getAccountSelectValue,
    updateVoucherBox,
    addVoucherBoxRow,
    removeVoucherBoxRow,
    updateDetail,
    addDetailRow,
    removeDetailRow,
    handleMasterCostChange,
    saveVoucher,
    printVoucher,
  };
};
