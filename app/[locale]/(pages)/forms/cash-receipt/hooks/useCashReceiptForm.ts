import type { Voucher, VoucherBox, VoucherDetail } from "@/types/voucher";
import type {
  VoucherDetailData,
  VoucherBoxData,
  SaveVoucherData,
} from "@/app/actions/voucher/types";

import { useCallback, useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import {
  createVoucherAction,
  updateVoucherAction,
} from "@/app/actions/voucher.action";
import { formatAmount } from "@/utilities/formatAmount";

// Define the shape of props for the hook
interface UseCashReceiptFormProps {
  voucherData?: Voucher | null;
  voucherDetailsData?: VoucherDetail[];
  voucherBoxes?: VoucherBox[];
  initialVoucherNumber: number | undefined;
  formMode: "new" | "edit" | "preview";
  vouchType?: number; // 1: Receipt (قبض), 2: Payment (صرف)
}

// Initial state for a new voucher
const getInitialVoucher = (
  vouchType: number,
  initialVoucherNumber: number | undefined,
): any => ({
  vouch_id: initialVoucherNumber ?? 0,
  vouch_date: new Date().toISOString(),
  vouch_type: vouchType,
  vouch_amt: 0,
  pay_type: 1, // 1: Cash
  cr_date: new Date().toISOString(),
  vouch_status: 1, // 1: New/Draft
  commit: false,
  post: false,
  print: false,
  opps_vouch: 0,
  cost_id: null,
});

export const useCashReceiptForm = ({
  voucherData,
  voucherDetailsData,
  voucherBoxes: initialVoucherBoxes = [],
  initialVoucherNumber,
  formMode,
  vouchType = 1,
}: UseCashReceiptFormProps) => {
  const router = useRouter();

  // --- State Initialization ---

  const [voucher, setVoucher] = useState<Voucher>(() => {
    if (voucherData) {
      return {
        ...voucherData,
        // Ensure cost_id is correctly mapped from potential 'cost' property if needed
        cost_id: voucherData.cost_id ?? (voucherData as any).cost ?? null,
      };
    }

    return getInitialVoucher(vouchType, initialVoucherNumber);
  });

  const [details, setDetails] = useState<VoucherDetail[]>(() => {
    if (voucherDetailsData && voucherDetailsData.length > 0) {
      return voucherDetailsData;
    }

    // Initialize with one empty row
    return [
      {
        id: 1, // Temporary client-side ID
        acc_id: 0,
        debit: 0,
        credit: 0,
        cost_id: voucher.cost_id ?? null,
        cr_date: new Date().toISOString(),
        vouch_id: voucher.vouch_id,
        vouch_notes: "",
      },
    ];
  });

  const [voucherBoxes, setVoucherBoxes] = useState<VoucherBox[]>(() => {
    if (initialVoucherBoxes && initialVoucherBoxes.length > 0) {
      return initialVoucherBoxes;
    }

    // Initialize with one empty row
    return [
      {
        id: 1, // Temporary client-side ID
        amount: 0,
        box_id: 0,
        cost_id: voucher.cost_id ?? null,
        cr_date: new Date().toISOString(),
        vouch_id: voucher.vouch_id,
        vouch_notes: "",
      },
    ];
  });

  const [isEditing, setIsEditing] = useState(
    formMode === "edit" || formMode === "new",
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Keep track of original data for identifying deletions in edit mode
  const [originalDetails, setOriginalDetails] = useState<VoucherDetail[]>([]);
  const [originalBoxes, setOriginalBoxes] = useState<VoucherBox[]>([]);

  // --- Effects ---

  useEffect(() => {
    setIsEditing(formMode === "edit" || formMode === "new");
  }, [formMode]);

  // Set original data when editing
  useEffect(() => {
    if (formMode === "edit" && voucherData) {
      if (voucherDetailsData) setOriginalDetails(voucherDetailsData);
      if (initialVoucherBoxes) setOriginalBoxes(initialVoucherBoxes);
    }
  }, [formMode, voucherData, voucherDetailsData, initialVoucherBoxes]);

  // --- Handlers ---

  const handleMasterCostChange = useCallback(
    (costId: number | null) => {
      const previousCost = voucher.cost_id;

      setVoucher((prev) => ({
        ...prev,
        cost_id: costId ?? null,
      }));

      // Update details cost_id if it matched the previous master cost or was empty
      setDetails((prev) =>
        prev.map((detail) => {
          const detailCost = detail.cost_id;

          // If detail has a specific cost different from previous master, keep it.
          // Otherwise update to new master cost.
          if (
            detailCost &&
            previousCost &&
            detailCost !== previousCost &&
            detailCost !== 0
          ) {
            return detail;
          }

          return {
            ...detail,
            cost_id: costId ?? null,
          };
        }),
      );

      // Update boxes cost_id similarly
      setVoucherBoxes((prev) =>
        prev.map((box) => {
          const boxCost = box.cost_id;

          if (
            boxCost &&
            previousCost &&
            boxCost !== previousCost &&
            boxCost !== 0
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

  const handleAddCashBox = useCallback(() => {
    setVoucherBoxes((prev) => {
      return [
        ...prev,
        {
          id: prev.length > 0 ? Math.max(...prev.map((b) => b.id || 0)) + 1 : 1,
          amount: 0,
          box_id: 0,
          cost_id: voucher.cost_id ?? null,
          cr_date: new Date().toISOString(),
          vouch_id: voucher.vouch_id,
          vouch_notes: "",
        },
      ];
    });
  }, [voucher.cost_id, voucher.vouch_id]);

  const handleAddDetail = useCallback(() => {
    setDetails((prev) => {
      return [
        ...prev,
        {
          id: prev.length > 0 ? Math.max(...prev.map((d) => d.id || 0)) + 1 : 1,
          acc_id: 0,
          debit: 0,
          credit: 0,
          cost_id: voucher.cost_id ?? null,
          cr_date: new Date().toISOString(),
          vouch_id: voucher.vouch_id,
          vouch_notes: "",
        },
      ];
    });
  }, [voucher.cost_id, voucher.vouch_id]);

  const removeCashBox = useCallback((index: number) => {
    setVoucherBoxes((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const removeDetail = useCallback((index: number) => {
    setDetails((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateVoucherBox = useCallback(
    (index: number, changes: Partial<VoucherBox>) => {
      setVoucherBoxes((prev) => {
        const newBoxes = [...prev];

        if (newBoxes[index]) {
          newBoxes[index] = { ...newBoxes[index], ...changes };
        }

        return newBoxes;
      });
    },
    [],
  );

  const updateDetail = useCallback(
    (index: number, changes: Partial<VoucherDetail> & { amount?: number }) => {
      setDetails((prev) => {
        const newDetails = [...prev];

        if (newDetails[index]) {
          const updatedDetail = { ...newDetails[index], ...changes };

          // Handle 'amount' helper updates (mapping to credit/debit based on vouchType)
          if (changes.amount !== undefined) {
            const amount = changes.amount;

            if (vouchType === 1) {
              updatedDetail.credit = amount;
              updatedDetail.debit = 0;
            } else {
              updatedDetail.debit = amount;
              updatedDetail.credit = 0;
            }
          }
          // Note: `amount` prop is ephemeral and not part of VoucherDetail, so we don't save it directly.
          // The logic above ensures the correct field is set.

          newDetails[index] = updatedDetail;
        }

        return newDetails;
      });
    },
    [vouchType],
  );

  // --- Calculations ---

  const totals = useMemo(() => {
    const totalBoxes = voucherBoxes.reduce(
      (sum, box) => sum + (Number(box.amount) || 0),
      0,
    );

    const totalDetails =
      vouchType === 1
        ? details.reduce((sum, detail) => sum + (Number(detail.credit) || 0), 0)
        : details.reduce((sum, detail) => sum + (Number(detail.debit) || 0), 0);

    return { totalBoxes, totalDetails };
  }, [voucherBoxes, details, vouchType]);

  const balance = totals.totalBoxes - totals.totalDetails;
  const isBalanced = Math.abs(balance) < 0.01;

  // --- Actions ---

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

    // Filter out empty rows
    const validBoxes = voucherBoxes.filter(
      (box) => box.box_id && box.box_id > 0 && box.amount && box.amount > 0,
    );

    const validDetails = details.filter((detail) => {
      const hasAccount = detail.acc_id && detail.acc_id > 0;
      const hasDebit = detail.debit && detail.debit > 0;
      const hasCredit = detail.credit && detail.credit > 0;

      return hasAccount && (hasDebit || hasCredit);
    });

    if (validBoxes.length === 0) {
      toast.error("يرجى إدخال صندوق واحد على الأقل");

      return;
    }

    if (validDetails.length === 0) {
      toast.error("يرجى إدخال حساب واحد على الأقل");

      return;
    }

    setIsLoading(true);

    try {
      const masterCostId =
        voucher.cost_id !== undefined &&
        voucher.cost_id !== null &&
        voucher.cost_id > 0
          ? voucher.cost_id
          : null;

      const voucherDataPayload: SaveVoucherData = {
        vouch_id: voucher.vouch_id,
        vouch_date: voucher.vouch_date,
        vouch_type: vouchType,
        vouch_amt: 0, // Calculated by server or ignored
        vouch_notes: voucher.vouch_notes || "",
        vouch_status: voucher.vouch_status || 1,
        pay_type: voucher.pay_type,
        ref_no: voucher.ref_no || "",
        opps_vouch: voucher.opps_vouch || 0,
        cost_id: masterCostId,
      };

      const boxesData: VoucherBoxData[] = validBoxes.map((box) => ({
        id: box.id && box.id > 0 ? box.id : 0, // 0 for new
        box_id: box.box_id,
        amount: box.amount,
        vouch_notes: box.vouch_notes || "",
        cost_id: box.cost_id && box.cost_id > 0 ? box.cost_id : masterCostId,
        inv_id: box.inv_id || null,
      }));

      const detailsData: VoucherDetailData[] = validDetails.map((detail) => ({
        id: detail.id && detail.id > 0 ? detail.id : 0, // 0 for new
        vouch_id: voucher.vouch_id,
        acc_id: detail.acc_id,
        // Strict logic for debit/credit based on type
        debit: vouchType === 2 ? detail.debit || 0 : 0,
        credit: vouchType === 1 ? detail.credit || 0 : 0,
        debit_g: 0,
        credit_g: 0,
        gauge: detail.gauge || 875,
        vouch_notes: detail.vouch_notes || "",
        cost_id:
          detail.cost_id && detail.cost_id > 0 ? detail.cost_id : masterCostId,
      }));

      // Calculate deleted items for update
      const currentDetailIds = detailsData
        .map((d) => d.id)
        .filter((id): id is number => !!id && id > 0);
      const originalDetailIds = originalDetails
        .map((d) => d.id)
        .filter((id): id is number => !!id && id > 0);
      const deletedDetailIds = originalDetailIds.filter(
        (id) => !currentDetailIds.includes(id),
      );

      const currentBoxIds = boxesData
        .map((b) => b.id)
        .filter((id): id is number => !!id && id > 0);
      const originalBoxIds = originalBoxes
        .map((b) => b.id)
        .filter((id): id is number => !!id && id > 0);
      const deletedBoxIds = originalBoxIds.filter(
        (id) => !currentBoxIds.includes(id),
      );

      const result =
        formMode === "edit"
          ? await updateVoucherAction(
              voucherDataPayload,
              detailsData,
              deletedDetailIds,
              voucher.id as number | undefined,
              boxesData,
              deletedBoxIds,
            )
          : await createVoucherAction(
              voucherDataPayload,
              detailsData,
              boxesData,
            );

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

        if (savedVouchId && Number(savedVouchId) > 0) {
          router.push(`${basePath}/${savedVouchId}?mode=preview`);
        } else if (realId) {
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
    voucher,
    setVoucher,
    isEditing,
    isLoading,
    saveVoucher,
    isPrinting,
    printVoucher,
    handleMasterCostChange,
    handleAddCashBox,
    handleAddDetail,
    removeCashBox,
    removeDetail,
    details,
    voucherBoxes,
    updateVoucherBox,
    updateDetail,
    totals,
    balance,
    isBalanced,
  };
};

export default useCashReceiptForm;
