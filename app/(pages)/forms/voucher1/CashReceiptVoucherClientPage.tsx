"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import AsyncCreatableSelect from "react-select/async-creatable";
import toast from "react-hot-toast";

import { Voucher, VoucherDetail, VoucherBox } from "@/types/voucher";
import { voucherService } from "@/services/api";
import {
  createVoucherAction,
  updateVoucherAction,
} from "@/app/actions/voucher.action";
import { searchAccountsAction } from "@/app/actions/accounts.action";
import { RiyalIcon } from "@/components/RiyalIcon";
import { formatAmount } from "@/utilities/formatAmount";

import "bootstrap-icons/font/bootstrap-icons.css";

interface CashReceiptVoucherClientPageProps {
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
}

export default function CashReceiptVoucherClientPage({
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
}: CashReceiptVoucherClientPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
    },
  );

  const [currentTime, setCurrentTime] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [voucherBoxes, setVoucherBoxes] = useState<VoucherBox[]>(
    initialVoucherBoxes || [],
  );
  const [details, setDetails] = useState<VoucherDetail[]>(
    voucherDetailsData || [],
  );
  const [accounts, setAccounts] = useState<any[]>(initialAccounts);
  const [boxes, setBoxes] = useState<any[]>(initialBoxes);
  const [costCenters, setCostCenters] = useState<any[]>(initialCostCenters);
  const [voucherTypes, setVoucherTypes] = useState<any[]>(initialVoucherTypes);
  const [voucherStatuses, setVoucherStatuses] = useState<any[]>(
    initialVoucherStatuses,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isEditing, setIsEditing] = useState(startInEditMode);
  const [originalDetails, setOriginalDetails] = useState<VoucherDetail[]>([]);
  const [originalBoxes, setOriginalBoxes] = useState<VoucherBox[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Initialize component
  useEffect(() => {
    setIsClient(true);
    updateCurrentTime();

    if (isNewVoucher) {
      generateNextVoucherNumber();
      // إضافة صف فارغ واحد على الأقل لكل جدول
      if (voucherBoxes.length === 0) {
        setVoucherBoxes([
          {
            id: 0,
            vouch_id: 0,
            box_id: 0,
            amount: 0,
            vouch_notes: "",
            cost_id: null,
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
            cost_id: null,
            vouch_notes: "",
            tax: undefined,
            tax_prc: undefined,
            vat_no: undefined,
            cr_date: new Date().toISOString(),
          },
        ]);
      }
    } else {
      setOriginalDetails(voucherDetailsData || []);
      setOriginalBoxes(initialVoucherBoxes || []);
    }
  }, []);

  useEffect(() => {
    if (formMode === "preview") {
      setIsEditing(false);
    } else if (formMode === "new") {
      setIsEditing(true);
    } else if (formMode === "edit") {
      setIsEditing(startInEditMode !== false);
    }
  }, [formMode, startInEditMode]);

  const updateCurrentTime = () => {
    const now = new Date();

    setCurrentTime(now.toLocaleTimeString("ar-EG"));
  };

  useEffect(() => {
    const interval = setInterval(updateCurrentTime, 1000);

    return () => clearInterval(interval);
  }, []);

  const generateNextVoucherNumber = async () => {
    try {
      const nextId = await voucherService.getNextNumber(vouchType);

      setVoucher((prev) => ({
        ...prev,
        vouch_id: nextId,
        vouch_date: new Date().toISOString(),
        cr_date: new Date().toISOString(),
      }));
    } catch (error) {
      setVoucher((prev) => ({
        ...prev,
        vouch_id: 1,
        vouch_date: new Date().toISOString(),
        cr_date: new Date().toISOString(),
      }));
    }
  };

  // Update voucher box
  const updateVoucherBox = (index: number, field: string, value: any) => {
    setVoucherBoxes((prev) => {
      const updated = prev.map((box, i) => {
        if (i === index) {
          return { ...box, [field]: value };
        }

        return box;
      });

      return updated;
    });
  };

  // Add voucher box row
  const addVoucherBoxRow = () => {
    setVoucherBoxes((prev) => [
      ...prev,
      {
        id: 0,
        vouch_id: voucher.id || 0,
        box_id: 0,
        amount: 0,
        vouch_notes: "",
        cost_id: null,
        inv_id: undefined,
        cr_date: new Date().toISOString(),
      },
    ]);
  };

  // Remove voucher box row
  const removeVoucherBoxRow = (index: number) => {
    setVoucherBoxes((prev) => prev.filter((_, i) => i !== index));
  };

  // Update detail
  const updateDetail = (index: number, field: string, value: any) => {
    setDetails((prev) => {
      const updated = prev.map((detail, i) => {
        if (i === index) {
          const newDetail = { ...detail, [field]: value };

          return newDetail;
        }

        return detail;
      });

      return updated;
    });
  };

  // Add detail row
  const addDetailRow = () => {
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
        cost_id: null,
        vouch_notes: "",
        tax: undefined,
        tax_prc: undefined,
        vat_no: undefined,
        cr_date: new Date().toISOString(),
      },
    ]);
  };

  // Remove detail row
  const removeDetailRow = (index: number) => {
    setDetails((prev) => prev.filter((_, i) => i !== index));
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
          const accountCode = (acc.acc_code ?? acc.code ?? "").toLowerCase();
          const accountName = (acc.acc_name ?? acc.name ?? "").toLowerCase();
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

    const account = accounts.find((acc) => acc.id === detail.acc_id);

    if (account) {
      return {
        value: detail.acc_id,
        label: `${account.acc_code ?? ""} - ${account.acc_name ?? ""}`,
      };
    }

    return null;
  };

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

  const isBalanced = Math.abs(totals.totalBoxes - totals.totalDetails) < 0.01;

  // Save voucher
  const saveVoucher = async () => {
    // التحقق من التاريخ
    const voucherDate = new Date(voucher.vouch_date);
    const today = new Date();

    today.setHours(23, 59, 59, 999);

    if (voucherDate > today) {
      toast.error("لا يمكن إنشاء قيد بتاريخ أكبر من تاريخ اليوم");

      return;
    }

    // التحقق من التوازن
    if (!isBalanced) {
      toast.error(
        `غير متزن: إجمالي النقدية (${totals.totalBoxes.toFixed(2)}) يجب أن يساوي إجمالي التفاصيل (${totals.totalDetails.toFixed(2)})`,
      );

      return;
    }

    // التحقق من وجود صناديق صالحة
    const validBoxes = voucherBoxes.filter(
      (box) => box.box_id && box.box_id > 0 && box.amount && box.amount > 0,
    );

    if (validBoxes.length === 0) {
      toast.error("يرجى إدخال صندوق واحد على الأقل");

      return;
    }

    // التحقق من وجود تفاصيل صالحة
    const validDetails = details.filter(
      (detail) => detail.acc_id && detail.acc_id > 0,
    );

    if (validDetails.length === 0) {
      toast.error("يرجى إدخال حساب واحد على الأقل");

      return;
    }

    setIsLoading(true);

    try {
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
      };

      // تحضير بيانات الصناديق
      const boxesData = validBoxes.map((box) => ({
        id: box.id || 0,
        box_id: box.box_id,
        amount: box.amount,
        vouch_notes: box.vouch_notes || "",
        cost_id: box.cost_id || null,
        inv_id: box.inv_id || null,
      }));

      // تحضير بيانات التفاصيل
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
        cost_id: detail.cost_id || null,
        tax: 0,
        tax_prc: 0,
        vat_no: 0,
      }));

      // تحديد التفاصيل والصناديق المحذوفة
      const currentDetailIds = detailsData
        .map((d) => d.id)
        .filter((id) => id > 0);
      const originalDetailIds = originalDetails
        .map((d) => d.id)
        .filter((id) => id && id > 0) as number[];
      const deletedDetailIds = originalDetailIds.filter(
        (id) => !currentDetailIds.includes(id),
      );

      const currentBoxIds = boxesData
        .map((b) => b.id)
        .filter((id) => id > 0);
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

        setVoucher((prev) => ({
          ...prev,
          commit: true,
          id: realId,
          vouch_id: result.data.vouch_id || voucher.vouch_id,
        }));

        toast.success(result.message);

        // التوجيه إلى preview mode
        const basePath =
          vouchType === 1 ? "/forms/voucher1" : "/forms/voucher2";

        if (realId) {
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

  // Print voucher
  const printVoucher = async () => {
    setIsPrinting(true);
    try {
      const printWindow = window.open("", "_blank");

      if (printWindow) {
        // تنسيق التاريخ
        const formattedDate = voucher.vouch_date
          ? new Date(voucher.vouch_date).toLocaleDateString("ar-SA", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "";

        // فلترة الصناديق والتفاصيل الصالحة
        const validBoxes = voucherBoxes.filter(
          (b) => b.box_id && b.box_id > 0 && b.amount && b.amount > 0,
        );
        const validDetails = details.filter((d) => d.acc_id && d.acc_id > 0);

        // الحصول على اسماء الصناديق
        const getBoxName = (boxId: number) => {
          const box = boxes.find((b) => b.id === boxId);
          return box?.cust_name || box?.name || `صندوق ${boxId}`;
        };

        // الحصول على اسم مركز التكلفة
        const getCostCenterName = (costId: number | null | undefined) => {
          if (!costId || costId === 0) return "-";
          const center = costCenters.find((c) => c.id === costId);
          return center?.name || center?.cost_name || `مركز ${costId}`;
        };

        // تحديد نوع السند
        const voucherTypeName = vouchType === 1 ? "سند قبض" : "سند صرف";

        printWindow.document.write(`
          <html dir="rtl">
            <head>
              <meta charset="UTF-8">
              <title>${voucherTypeName} - ${voucher.vouch_id}</title>
              <style>
                @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap');
                
                * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
                }
                
                body {
                  font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
                  font-size: 13px;
                  line-height: 1.6;
                  color: #2d3748;
                  background: #ffffff;
                  padding: 40px 30px;
                }
                
                .header {
                  text-align: center;
                  margin-bottom: 35px;
                  padding-bottom: 25px;
                  border-bottom: 3px solid #e2e8f0;
                }
                
                .header h1 {
                  font-size: 28px;
                  font-weight: 700;
                  color: #1a202c;
                  margin-bottom: 15px;
                  letter-spacing: 0.5px;
                }
                
                .header-info {
                  display: flex;
                  justify-content: center;
                  gap: 40px;
                  margin-top: 15px;
                  flex-wrap: wrap;
                }
                
                .header-info-item {
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  gap: 5px;
                }
                
                .header-info-label {
                  font-size: 11px;
                  color: #718096;
                  font-weight: 500;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                }
                
                .header-info-value {
                  font-size: 15px;
                  color: #2d3748;
                  font-weight: 600;
                }
                
                .voucher-notes {
                  margin-top: 20px;
                  padding: 12px 20px;
                  background: #f7fafc;
                  border-right: 4px solid #4299e1;
                  border-radius: 6px;
                  font-size: 13px;
                  color: #4a5568;
                }
                
                .table-section {
                  margin: 25px 0;
                }
                
                .table-section-title {
                  font-size: 16px;
                  font-weight: 600;
                  color: #2d3748;
                  margin-bottom: 15px;
                  padding-bottom: 8px;
                  border-bottom: 2px solid #e2e8f0;
                }
                
                table {
                  width: 100%;
                  border-collapse: separate;
                  border-spacing: 0;
                  margin: 15px 0;
                  background: #ffffff;
                  border-radius: 8px;
                  overflow: hidden;
                  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
                }
                
                thead {
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                }
                
                th {
                  padding: 14px 10px;
                  text-align: center;
                  font-weight: 600;
                  font-size: 12px;
                  color: #ffffff;
                  text-transform: uppercase;
                  letter-spacing: 0.3px;
                  border: none;
                  white-space: nowrap;
                }
                
                tbody tr {
                  transition: background-color 0.2s;
                }
                
                tbody tr:nth-child(even) {
                  background-color: #f8fafc;
                }
                
                tbody tr:hover {
                  background-color: #edf2f7;
                }
                
                td {
                  padding: 12px 10px;
                  text-align: center;
                  border-bottom: 1px solid #e2e8f0;
                  border-left: 1px solid #e2e8f0;
                  font-size: 12.5px;
                  color: #4a5568;
                }
                
                td:first-child {
                  border-right: none;
                }
                
                .account-code {
                  font-weight: 600;
                  color: #2d3748;
                  font-family: 'Courier New', monospace;
                }
                
                .account-name {
                  text-align: right;
                  color: #4a5568;
                }
                
                .amount {
                  font-family: 'Courier New', monospace;
                  font-weight: 500;
                  color: #2d3748;
                }
                
                .amount-cash {
                  color: #059669;
                  font-weight: 600;
                }
                
                .totals {
                  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                  font-weight: 700;
                  border-top: 2px solid #f59e0b;
                  border-bottom: 2px solid #f59e0b;
                }
                
                .totals td {
                  padding: 16px 10px;
                  font-size: 13.5px;
                  color: #92400e;
                  border: none;
                }
                
                .totals td:first-child {
                  font-size: 14px;
                  text-align: right;
                  padding-right: 20px;
                }
                
                .balance-status {
                  margin-top: 25px;
                  padding: 15px 20px;
                  background: ${isBalanced ? "#d1fae5" : "#fee2e2"};
                  border: 2px solid ${isBalanced ? "#10b981" : "#ef4444"};
                  border-radius: 8px;
                  text-align: center;
                  font-weight: 600;
                  font-size: 14px;
                  color: ${isBalanced ? "#065f46" : "#991b1b"};
                }
                
                .footer {
                  margin-top: 40px;
                  padding-top: 20px;
                  border-top: 2px solid #e2e8f0;
                  text-align: center;
                  color: #718096;
                  font-size: 11px;
                }
                
                @media print {
                  body {
                    padding: 20px 15px;
                  }
                  
                  .header {
                    margin-bottom: 25px;
                    padding-bottom: 20px;
                  }
                  
                  table {
                    margin: 20px 0;
                  }
                  
                  tbody tr:hover {
                    background-color: inherit;
                  }
                  
                  @page {
                    margin: 1cm;
                    size: A4;
                  }
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>${voucherTypeName}</h1>
                <div class="header-info">
                  <div class="header-info-item">
                    <span class="header-info-label">رقم السند</span>
                    <span class="header-info-value">${voucher.vouch_id || "-"}</span>
                  </div>
                  <div class="header-info-item">
                    <span class="header-info-label">التاريخ</span>
                    <span class="header-info-value">${formattedDate}</span>
                  </div>
                  <div class="header-info-item">
                    <span class="header-info-label">عدد الصناديق</span>
                    <span class="header-info-value">${validBoxes.length}</span>
                  </div>
                  <div class="header-info-item">
                    <span class="header-info-label">عدد الحسابات</span>
                    <span class="header-info-value">${validDetails.length}</span>
                  </div>
                </div>
                ${
                  voucher.vouch_notes
                    ? `
                <div class="voucher-notes">
                  <strong>البيان:</strong> ${voucher.vouch_notes}
                </div>
                `
                    : ""
                }
              </div>
              
              <!-- جدول النقدية -->
              <div class="table-section">
                <div class="table-section-title">النقدية</div>
                <table>
                  <thead>
                    <tr>
                      <th>المبلغ</th>
                      <th>الصندوق</th>
                      <th>البيان</th>
                      <th>مركز التكلفة</th>
                      <th>رقم الفاتورة</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${validBoxes
                      .map((box) => {
                        const boxName = getBoxName(box.box_id);
                        const costName = getCostCenterName(box.cost_id);

                        return `
                        <tr>
                          <td class="amount amount-cash">${formatAmount(box.amount || 0)}</td>
                          <td style="text-align: right;">${boxName}</td>
                          <td style="text-align: right; font-size: 11px; color: #718096;">${box.vouch_notes || "-"}</td>
                          <td style="text-align: right; font-size: 11px;">${costName}</td>
                          <td>${box.inv_id || "-"}</td>
                        </tr>
                      `;
                      })
                      .join("")}
                    <tr class="totals">
                      <td class="amount amount-cash">${formatAmount(totals.totalBoxes)}</td>
                      <td colspan="4" style="text-align: right; padding-right: 20px; font-weight: 700;">إجمالي النقدية</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <!-- جدول التفاصيل -->
              <div class="table-section">
                <div class="table-section-title">الحسابات</div>
                <table>
                  <thead>
                    <tr>
                      <th>رقم الحساب</th>
                      <th>اسم الحساب</th>
                      <th>المبلغ</th>
                      <th>البيان</th>
                      <th>مركز التكلفة</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${validDetails
                      .map((detail) => {
                        const account = accounts.find(
                          (acc) => acc.id === detail.acc_id,
                        );
                        const amount =
                          vouchType === 1
                            ? detail.credit || 0
                            : detail.debit || 0;
                        const costName = getCostCenterName(detail.cost_id);

                        return `
                        <tr>
                          <td class="account-code">${account?.acc_code || "-"}</td>
                          <td class="account-name">${account?.acc_name || "-"}</td>
                          <td class="amount amount-cash">${amount > 0 ? formatAmount(amount) : "-"}</td>
                          <td style="text-align: right; font-size: 11px; color: #718096;">${detail.vouch_notes || "-"}</td>
                          <td style="text-align: right; font-size: 11px;">${costName}</td>
                        </tr>
                      `;
                      })
                      .join("")}
                    <tr class="totals">
                      <td colspan="2" style="text-align: right; padding-right: 20px; font-weight: 700;">إجمالي التفاصيل</td>
                      <td class="amount amount-cash">${formatAmount(totals.totalDetails)}</td>
                      <td colspan="2"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div class="balance-status">
                الحالة: ${isBalanced ? "متزن ✓" : "غير متزن ✗"}
              </div>
              
              <div class="footer">
                <p>تم طباعة هذا السند بتاريخ ${new Date().toLocaleDateString("ar-SA")} - نظام NafeesWeb</p>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
        setIsPrinting(false);
        setVoucher((prev) => ({ ...prev, print: true }));
      }
    } catch (error) {
      toast.error(
        `حدث خطأ أثناء الطباعة: ${error instanceof Error ? error.message : "خطأ غير معروف"}`,
      );
      setIsPrinting(false);
    }
  };

  // Handle search
  const handleSearch = async () => {
    if (!searchTerm || searchTerm.trim() === "") {
      toast.error("يرجى إدخال رقم السند للبحث");

      return;
    }

    const searchValue = searchTerm.trim();

    try {
      // البحث في السندات بنفس النوع (قبض أو صرف)
      const vouchersResponse = await voucherService.getAll({
        xvouch_type: vouchType.toString(), // 1 للقبض، 2 للصرف
        xvouch_id: searchValue,
        xcom_id: "1",
        xyear_id: "0", // كل السنوات
      });

      if (vouchersResponse.success && vouchersResponse.data) {
        const vouchers = Array.isArray(vouchersResponse.data)
          ? vouchersResponse.data
          : [];

        // البحث في النتائج - مطابقة دقيقة أولاً
        let foundVoucher = vouchers.find(
          (v: any) =>
            v.vouch_id?.toString() === searchValue ||
            v.id?.toString() === searchValue,
        );

        // إذا لم نجد مطابقة دقيقة، نبحث عن سندات تحتوي على الرقم
        if (!foundVoucher) {
          foundVoucher = vouchers.find(
            (v: any) =>
              v.vouch_id?.toString().includes(searchValue) ||
              v.id?.toString().includes(searchValue),
          );
        }

        if (foundVoucher) {
          // استخدام id الحقيقي (primary key) للانتقال إلى صفحة السند
          const targetId = foundVoucher.id || foundVoucher.vouch_id;

          if (targetId) {
            const basePath = vouchType === 1 ? "/forms/voucher1" : "/forms/voucher2";
            router.push(`${basePath}/${targetId}?mode=preview`);
            setSearchTerm(""); // مسح حقل البحث

            return;
          }
        }
      }

      // إذا لم نجد في السندات من نفس النوع، نبحث في جميع أنواع السندات
      console.log("لم يتم العثور على سند من نفس النوع، البحث في جميع السندات...");
      const allVouchersResponse = await voucherService.getAll({
        xvouch_type: "0", // جميع الأنواع
        xvouch_id: searchValue,
        xcom_id: "1",
        xyear_id: "0",
      });

      if (allVouchersResponse.success && allVouchersResponse.data) {
        const allVouchers = Array.isArray(allVouchersResponse.data)
          ? allVouchersResponse.data
          : [];

        const foundAny = allVouchers.find(
          (v: any) =>
            v.vouch_id?.toString() === searchValue ||
            v.id?.toString() === searchValue,
        );

        if (foundAny) {
          // التحقق من نوع السند
          if (foundAny.vouch_type !== vouchType) {
            const voucherTypeName = vouchType === 1 ? "سند قبض" : "سند صرف";
            toast.error(
              `السند الموجود (${foundAny.vouch_id}) ليس من نوع ${voucherTypeName}`,
            );

            return;
          }

          const targetId = foundAny.id || foundAny.vouch_id;

          if (targetId) {
            const basePath = vouchType === 1 ? "/forms/voucher1" : "/forms/voucher2";
            router.push(`${basePath}/${targetId}?mode=preview`);
            setSearchTerm("");

            return;
          }
        }
      }

      // إذا لم نجد السند نهائياً
      const voucherTypeName = vouchType === 1 ? "سند قبض" : "سند صرف";
      toast.error(`لم يتم العثور على ${voucherTypeName} برقم: ${searchValue}`);
    } catch (error) {
      console.error("Error searching voucher:", error);
      toast.error("حدث خطأ أثناء البحث. يرجى المحاولة مرة أخرى");
    }
  };

  // Handle edit click
  const handleEditClick = () => {
    setVoucher((prev) => ({
      ...prev,
      commit: false,
    }));

    if (pathname && voucherRecordId) {
      const basePath = vouchType === 1 ? "/forms/voucher1" : "/forms/voucher2";
      router.push(`${basePath}/${voucherRecordId}?mode=edit`);
    }
  };

  if (!isClient) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  const voucherTypeName =
    voucherTypes.find((t) => (t.Id || t.id) === vouchType)?.name ||
    (vouchType === 1 ? "سند قبض" : "سند صرف");

  return (
    <div className="p-3 max-w-[1500px] mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-3 mb-4 border border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-4">
              <span>{voucherTypeName}</span>
              <span className="text-slate-600 font-medium">
                #
                {voucher.vouch_id && voucher.vouch_id > 0
                  ? voucher.vouch_id
                  : "جاري الترقيم..."}
              </span>
              <span className="text-sm text-slate-600 font-medium flex items-center gap-1">
                <i className="bi bi-calendar3 w-4 h-4 text-slate-500" />
                {new Date(voucher.vouch_date).toLocaleString("ar-EG")}
              </span>
            </h1>
          </div>

          {/* البحث */}
          <div className="flex items-center gap-2">
            <input
              className="w-32 h-7 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2"
              placeholder="بحث برقم السند..."
              type="number"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
            />
            <button
              className="h-7 px-2 text-xs bg-slate-600 text-white hover:bg-slate-700 border border-slate-600 rounded-md shadow-sm"
              onClick={handleSearch}
            >
              <i className="bi bi-search w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              className="h-7 px-3 text-xs bg-emerald-600 text-white hover:bg-emerald-700 border border-emerald-600 rounded-md shadow-sm disabled:opacity-50"
              disabled={isLoading || !isEditing}
              onClick={saveVoucher}
            >
              {isLoading ? (
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  حفظ...
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <i className="bi bi-check-circle w-4 h-4" />
                  حفظ
                </span>
              )}
            </button>

            <button
              className={`h-7 px-3 text-xs border rounded-md shadow-sm ${
                formMode === "new" || isEditing
                  ? "bg-gray-400 text-white border-gray-400 cursor-not-allowed opacity-50"
                  : "bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
              }`}
              disabled={formMode === "new" || isEditing || isLoading}
              onClick={handleEditClick}
            >
              <i className="bi bi-pencil-square w-4 h-4 me-1" />
              تعديل
            </button>

            <button
              className="h-7 px-3 text-xs bg-slate-600 text-white hover:bg-slate-700 border border-slate-600 rounded-md shadow-sm disabled:opacity-50"
              disabled={isPrinting}
              onClick={printVoucher}
            >
              <i className="bi bi-printer w-4 h-4 me-1" />
              طباعة
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <input
                readOnly
                checked={voucher.commit}
                className="w-3 h-3 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500"
                type="checkbox"
              />
              <span className="text-xs text-slate-600">حُفظ</span>
            </div>

            <div className="flex items-center gap-1">
              <input
                readOnly
                checked={voucher.post}
                className="w-3 h-3 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                type="checkbox"
              />
              <span className="text-xs text-slate-600">مرحل</span>
            </div>

            <div className="flex items-center gap-1">
              <input
                readOnly
                checked={voucher.print}
                className="w-3 h-3 text-yellow-600 bg-gray-100 border-gray-300 rounded focus:ring-yellow-500"
                type="checkbox"
              />
              <span className="text-xs text-slate-600">طُبع</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            رقم المرجع
          </label>
          <input
            className="w-full h-8 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2"
            disabled={!isEditing}
            readOnly={!isEditing}
            type="text"
            value={voucher.ref_no || ""}
            onChange={(e) =>
              setVoucher((prev) => ({ ...prev, ref_no: e.target.value }))
            }
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            التاريخ والوقت
          </label>
          <input
            className="w-full h-8 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2"
            disabled={!isEditing}
            readOnly={!isEditing}
            type="datetime-local"
            value={
              voucher.vouch_date
                ? new Date(voucher.vouch_date).toISOString().slice(0, 16)
                : ""
            }
            onChange={(e) =>
              setVoucher((prev) => ({
                ...prev,
                vouch_date: new Date(e.target.value).toISOString(),
              }))
            }
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            البيان
          </label>
          <input
            className="w-full h-8 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2"
            disabled={!isEditing}
            readOnly={!isEditing}
            type="text"
            value={voucher.vouch_notes || ""}
            onChange={(e) =>
              setVoucher((prev) => ({ ...prev, vouch_notes: e.target.value }))
            }
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            الحالة
          </label>
          <select
            className="w-full h-8 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2"
            disabled={!isEditing}
            value={voucher.vouch_status || 1}
            onChange={(e) =>
              setVoucher((prev) => ({
                ...prev,
                vouch_status: parseInt(e.target.value),
              }))
            }
          >
            {voucherStatuses.map((status) => (
              <option key={status.id || status.Id} value={status.id || status.Id}>
                {status.name || status["Code Desc"] || "غير محدد"}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cash Table */}
      <div className="bg-white rounded-lg border border-slate-200 mb-4">
        <div className="p-3 border-b border-slate-200 bg-slate-50">
          <h3 className="text-base font-semibold text-slate-800">النقدية</h3>
        </div>
        <div className="p-2">
          <div className="flex justify-between mb-2">
            <button
              className="btn"
              disabled={!isEditing}
              type="button"
              onClick={addVoucherBoxRow}
            >
              + صف
            </button>
          </div>
          <div className="overflow-x-auto mb-3 max-w-full">
            <table className="min-w-[1200px] border text-sm text-center table-fixed">
            <thead className="bg-gray-100 text-xs font-bold">
              <tr>
                <th className="w-32 p-2 border">المبلغ</th>
                <th className="w-48 p-2 border">الصندوق</th>
                <th className="w-80 p-2 border">البيان</th>
                <th className="w-48 p-2 border">مركز التكلفة</th>
                <th className="w-32 p-2 border">رقم الفاتورة</th>
                <th className="w-12 p-2 border">حذف</th>
              </tr>
            </thead>
            <tbody>
              {voucherBoxes.map((box, index) => (
                <tr key={index} className="border-b">
                  <td className="p-0 border">
                    <input
                      className="w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0"
                      disabled={!isEditing}
                      min="0"
                      readOnly={!isEditing}
                      style={{
                        MozAppearance: "textfield",
                        WebkitAppearance: "none",
                        appearance: "none",
                      }}
                      type="number"
                      value={box.amount || ""}
                      onChange={(e) =>
                        updateVoucherBox(
                          index,
                          "amount",
                          e.target.value ? parseFloat(e.target.value) : 0,
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                          e.preventDefault();
                        }
                      }}
                      onWheel={(e) => e.currentTarget.blur()}
                    />
                  </td>
                  <td className="p-0 border">
                    <select
                      className="w-full h-full text-xs border-0 rounded-none focus:outline-none focus:ring-0"
                      disabled={!isEditing}
                      value={box.box_id || ""}
                      onChange={(e) =>
                        updateVoucherBox(
                          index,
                          "box_id",
                          e.target.value ? parseInt(e.target.value) : 0,
                        )
                      }
                    >
                      <option value="">اختر الصندوق</option>
                      {boxes.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.cust_name || b.name || `صندوق ${b.id}`}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-0 border">
                    <input
                      className="w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0"
                      disabled={!isEditing}
                      readOnly={!isEditing}
                      type="text"
                      value={box.vouch_notes || ""}
                      onChange={(e) =>
                        updateVoucherBox(index, "vouch_notes", e.target.value)
                      }
                    />
                  </td>
                  <td className="p-0 border">
                    <select
                      className="w-full h-full text-xs border-0 rounded-none focus:outline-none focus:ring-0"
                      disabled={!isEditing}
                      value={box.cost_id || ""}
                      onChange={(e) =>
                        updateVoucherBox(
                          index,
                          "cost_id",
                          e.target.value ? parseInt(e.target.value) : null,
                        )
                      }
                    >
                      <option value="">مركز التكلفة</option>
                      {costCenters.map((center) => (
                        <option key={center.id} value={center.id}>
                          {center.name || center.cost_name || `مركز ${center.id}`}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-0 border">
                    <input
                      className="w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0"
                      disabled={!isEditing}
                      min="0"
                      readOnly={!isEditing}
                      style={{
                        MozAppearance: "textfield",
                        WebkitAppearance: "none",
                        appearance: "none",
                      }}
                      type="number"
                      value={box.inv_id || ""}
                      onChange={(e) =>
                        updateVoucherBox(
                          index,
                          "inv_id",
                          e.target.value ? parseInt(e.target.value) : undefined,
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                          e.preventDefault();
                        }
                      }}
                      onWheel={(e) => e.currentTarget.blur()}
                    />
                  </td>
                  <td className="p-1 border">
                    <button
                      className="font-bold text-red-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                      disabled={!isEditing}
                      onClick={() => removeVoucherBoxRow(index)}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      {/* Details Table */}
      <div className="bg-white rounded-lg border border-slate-200 mb-4">
        <div className="p-3 border-b border-slate-200 bg-slate-50">
          <h3 className="text-base font-semibold text-slate-800">الحسابات</h3>
        </div>
        <div className="p-2">
          <div className="flex justify-between mb-2">
            <button
              className="btn"
              disabled={!isEditing}
              type="button"
              onClick={addDetailRow}
            >
              + صف
            </button>
          </div>
          <div className="overflow-x-auto mb-3 max-w-full">
            <table className="min-w-[1200px] border text-sm text-center table-fixed">
            <thead className="bg-gray-100 text-xs font-bold">
              <tr>
                <th className="w-80 p-2 border">الحساب</th>
                <th className="w-32 p-2 border">المبلغ</th>
                <th className="w-80 p-2 border">البيان</th>
                <th className="w-48 p-2 border">مركز التكلفة</th>
                <th className="w-12 p-2 border">حذف</th>
              </tr>
            </thead>
            <tbody>
              {details.map((detail, index) => (
                <tr key={index} className="border-b">
                  <td className="p-0 border">
                    <AsyncCreatableSelect
                      isClearable
                      isSearchable
                      className="text-xs"
                      classNamePrefix="select"
                      components={{ IndicatorSeparator: () => null }}
                      instanceId={`account-select-${index}`}
                      isDisabled={!isEditing}
                      loadOptions={loadAccountOptions}
                      menuPortalTarget={
                        typeof window !== "undefined" ? document.body : null
                      }
                      menuPosition="fixed"
                      placeholder="اختر الحساب..."
                      styles={{
                        control: (base, state) => ({
                          ...base,
                          minHeight: "100%",
                          height: "100%",
                          border: "none",
                          borderRadius: 0,
                          boxShadow: "none",
                          cursor: !isEditing ? "not-allowed" : base.cursor,
                          backgroundColor: "transparent",
                          "&:hover": {
                            border: "none",
                            boxShadow: "none",
                          },
                        }),
                        valueContainer: (base) => ({
                          ...base,
                          padding: "0.125rem 0.25rem",
                          height: "100%",
                        }),
                        input: (base) => ({
                          ...base,
                          margin: 0,
                          padding: 0,
                        }),
                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                      }}
                      value={getAccountSelectValue(detail)}
                      onChange={(selectedOption: any) => {
                        if (!isEditing) return;
                        const opt: any = selectedOption;
                        const selected =
                          opt?.account ||
                          accounts.find((acc) => acc.id === opt?.value);

                        if (!selected) return;

                        updateDetail(index, "acc_id", selected.id ?? null);
                        updateDetail(
                          index,
                          "acc_code",
                          selected.acc_code ?? selected.code ?? "",
                        );
                        updateDetail(
                          index,
                          "acc_name",
                          selected.acc_name ?? selected.name ?? "",
                        );
                      }}
                    />
                  </td>
                  <td className="p-0 border">
                    <input
                      className="w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0"
                      disabled={!isEditing}
                      min="0"
                      placeholder="0.00"
                      readOnly={!isEditing}
                      style={{
                        MozAppearance: "textfield",
                        WebkitAppearance: "none",
                        appearance: "none",
                      }}
                      type="number"
                      value={
                        vouchType === 1
                          ? detail.credit || ""
                          : detail.debit || ""
                      }
                      onChange={(e) => {
                        const val = e.target.value;

                        if (!val || parseFloat(val) >= 0) {
                          if (vouchType === 1) {
                            // سند قبض: المبلغ في credit
                            updateDetail(index, "credit", val ? parseFloat(val) : undefined);
                            updateDetail(index, "debit", undefined);
                          } else {
                            // سند صرف: المبلغ في debit
                            updateDetail(index, "debit", val ? parseFloat(val) : undefined);
                            updateDetail(index, "credit", undefined);
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                          e.preventDefault();
                        }
                      }}
                      onWheel={(e) => e.currentTarget.blur()}
                    />
                  </td>
                  <td className="p-0 border">
                    <input
                      className="w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0"
                      disabled={!isEditing}
                      readOnly={!isEditing}
                      type="text"
                      value={detail.vouch_notes || ""}
                      onChange={(e) =>
                        updateDetail(index, "vouch_notes", e.target.value)
                      }
                    />
                  </td>
                  <td className="p-0 border">
                    <select
                      className="w-full h-full text-xs border-0 rounded-none focus:outline-none focus:ring-0"
                      disabled={!isEditing}
                      value={detail.cost_id || ""}
                      onChange={(e) =>
                        updateDetail(
                          index,
                          "cost_id",
                          e.target.value ? parseInt(e.target.value) : null,
                        )
                      }
                    >
                      <option value="">مركز التكلفة</option>
                      {costCenters.map((center) => (
                        <option key={center.id} value={center.id}>
                          {center.name ||
                            center.cost_name ||
                            `مركز ${center.id}`}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-1 border">
                    <button
                      className="font-bold text-red-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                      disabled={!isEditing}
                      onClick={() => removeDetailRow(index)}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      {/* Totals */}
      <div className="mt-4 bg-gray-50 rounded-lg p-3 border border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-700 font-medium">إجمالي النقدية:</span>
            <span className="font-semibold text-blue-700 flex items-center gap-1">
              {formatAmount(totals.totalBoxes)}
              <RiyalIcon color="currentColor" />
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-700 font-medium">إجمالي التفاصيل:</span>
            <span className="font-semibold text-green-700 flex items-center gap-1">
              {formatAmount(totals.totalDetails)}
              <RiyalIcon color="currentColor" />
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-700 font-medium">الحالة:</span>
            <span
              className={`font-semibold ${
                isBalanced ? "text-green-700" : "text-red-700"
              }`}
            >
              {isBalanced ? "متزن" : "غير متزن"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

