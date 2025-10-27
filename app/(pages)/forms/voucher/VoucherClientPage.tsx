"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AsyncCreatableSelect from "react-select/async-creatable";

import { Voucher, VoucherDetail } from "@/types/voucher";
import {
  voucherService,
  accountService,
  costCenterService,
} from "@/services/api";
import { createVoucherAction } from "@/app/actions/voucher.action";
import { searchAccountsAction } from "@/app/actions/accounts.action";
import { RiyalIcon } from "@/components/RiyalIcon";
import { formatAmount } from "@/utilities/formatAmount";

import "bootstrap-icons/font/bootstrap-icons.css";

interface VoucherClientPageProps {
  voucherData?: Voucher | null;
  voucherDetailsData?: VoucherDetail[];
  isNewVoucher?: boolean;
  voucherRecordId?: number | string | null;
  accounts: any[];
  costCenters: any[];
  voucherTypes: any[];
  voucherStatuses: any[];
  startInEditMode?: boolean;
  vouchType?: number;
  formMode?: "new" | "edit" | "preview";
  newVoucherHref?: string;
}

export default function VoucherClientPage({
  voucherData,
  voucherDetailsData,
  isNewVoucher = true,
  voucherRecordId,
  accounts: initialAccounts,
  costCenters: initialCostCenters,
  voucherTypes: initialVoucherTypes,
  voucherStatuses: initialVoucherStatuses,
  startInEditMode = false,
  vouchType = 3, // قيد تسوية
  formMode = "new",
  newVoucherHref,
}: VoucherClientPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vouchId = searchParams.get("id");

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
    }
  );

  const [currentTime, setCurrentTime] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [details, setDetails] = useState<VoucherDetail[]>(
    voucherDetailsData || []
  );
  const [accounts, setAccounts] = useState<any[]>(initialAccounts);
  const [costCenters, setCostCenters] = useState<any[]>(initialCostCenters);
  const [voucherTypes, setVoucherTypes] = useState<any[]>(initialVoucherTypes);
  const [voucherStatuses, setVoucherStatuses] = useState<any[]>(initialVoucherStatuses);
  const [isLoading, setIsLoading] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
  const [vouchersList, setVouchersList] = useState<any[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(startInEditMode);

  // Initialize component
  useEffect(() => {
    setIsClient(true);
    updateCurrentTime();
    if (isNewVoucher) {
      generateNextVoucherNumber();
      if (details.length === 0) {
        addDetailRow();
      }
    }
  }, []);

  useEffect(() => {
    if (vouchId && !voucherData) {
      loadVoucher(parseInt(vouchId));
    }
  }, [vouchId]);

  useEffect(() => {
    if (!isClient) return;
    const interval = setInterval(updateCurrentTime, 60000);
    return () => clearInterval(interval);
  }, [isClient]);

  // Load vouchers when modal opens
  useEffect(() => {
    if (isModalOpen) {
      loadVouchersList();
    }
  }, [isModalOpen]);

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

  const loadVouchersList = async () => {
    try {
      const response = await voucherService.getAll();
      if (response.success && response.data && Array.isArray(response.data)) {
        setVouchersList(response.data);
      }
    } catch (error) {
      console.error("Error loading vouchers:", error);
    }
  };

  const generateNextVoucherNumber = async () => {
    try {
      const nextId = await voucherService.getNextNumber(voucher.vouch_type);
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

  const loadVoucher = async (id: number) => {
    try {
      setIsLoading(true);
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

          setVoucher(formattedVoucher);
          const voucherIndex = vouchersResponse.data.findIndex(
            (v: any) => v.id === id,
          );
          setCurrentRecord(voucherIndex + 1);

          const voucherVouchId = targetVoucher.vouch_id || id;
          const detailsResponse = await voucherService.getDetails(voucherVouchId);
          
          if (
            detailsResponse.success &&
            detailsResponse.data &&
            Array.isArray(detailsResponse.data)
          ) {
            const formattedDetails = detailsResponse.data.map((detail: any) => {
              const account = accounts.find(
                (acc) => acc.id === (detail.acc_id || detail.acc),
              );

              return {
                ...detail,
                acc_id: detail.acc_id || detail.acc || 0,
                acc_code: account?.acc_code || detail.acc_code || "",
                acc_name: account?.acc_name || detail.acc_name || "",
                cost_id: detail.cost_id || 0,
                debit: detail.debit || 0,
                credit: detail.credit || 0,
                debit_g: detail.debit_g || 0,
                credit_g: detail.credit_g || 0,
                gauge: detail.gauge || 875,
                tax: detail.tax || 0,
                tax_prc: detail.tax_prc || 0,
                vat_no: detail.vat_no || 0,
                vouch_notes: detail.vouch_notes || "",
              };
            });

            setDetails(formattedDetails);
          } else {
            setDetails([]);
          }
        }
      }
    } catch (error) {
      // Silent error
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToVoucher = (direction: "first" | "prev" | "next" | "last") => {
    if (vouchersList.length === 0) return;

    let targetIndex = 0;
    const currentIndex = vouchersList.findIndex(
      (v) => v.vouch_id === voucher.vouch_id || v.id === voucher.id,
    );

    switch (direction) {
      case "first":
        targetIndex = 0;
        break;
      case "prev":
        targetIndex = currentIndex > 0 ? currentIndex - 1 : 0;
        break;
      case "next":
        targetIndex =
          currentIndex < vouchersList.length - 1
            ? currentIndex + 1
            : vouchersList.length - 1;
        break;
      case "last":
        targetIndex = vouchersList.length - 1;
        break;
    }

    const targetVoucher = vouchersList[targetIndex];
    if (targetVoucher) {
      router.push(`/forms/voucher/${targetVoucher.vouch_id || targetVoucher.id}`);
    }
  };

  const addDetailRow = () => {
    const newDetail: VoucherDetail = {
      id: 0,
      vouch_id: voucher.vouch_id,
      acc_id: 0,
      acc_code: "",
      acc_name: "",
      debit: 0,
      credit: 0,
      debit_g: 0,
      credit_g: 0,
      gauge: 875,
      cost_id: 0,
      vouch_notes: "",
      tax: 0,
      tax_prc: 0,
      vat_no: 0,
      cr_date: new Date().toISOString(),
    };
    setDetails((prev) => [...prev, newDetail]);
  };

  const removeDetailRow = (index: number) => {
    setDetails((prev) => prev.filter((_, i) => i !== index));
  };

  const updateDetail = (
    index: number,
    field: keyof VoucherDetail,
    value: any,
  ) => {
    setDetails((prev) => {
      const updated = prev.map((detail, i) =>
        i === index ? { ...detail, [field]: value } : detail,
      );
      return updated;
    });
  };

  const updateVoucherType = async (newType: number) => {
    setVoucher((prev) => ({ ...prev, vouch_type: newType }));
    await generateNextVoucherNumber();
  };

  const calculateTotals = useCallback(() => {
    const totals = details.reduce(
      (totals, detail) => {
        const debit = parseFloat(String(detail.debit || 0)) || 0;
        const credit = parseFloat(String(detail.credit || 0)) || 0;
        const debitG = parseFloat(String(detail.debit_g || 0)) || 0;
        const creditG = parseFloat(String(detail.credit_g || 0)) || 0;
        const tax = parseFloat(String(detail.tax || 0)) || 0;
        const taxPrc = parseFloat(String(detail.tax_prc || 0)) || 0;

        return {
          totalDebit: totals.totalDebit + debit,
          totalCredit: totals.totalCredit + credit,
          totalDebitG: totals.totalDebitG + debitG,
          totalCreditG: totals.totalCreditG + creditG,
          totalTax: totals.totalTax + tax,
          totalTaxPrc: totals.totalTaxPrc + taxPrc,
        };
      },
      {
        totalDebit: 0,
        totalCredit: 0,
        totalDebitG: 0,
        totalCreditG: 0,
        totalTax: 0,
        totalTaxPrc: 0,
      },
    );
    return totals;
  }, [details]);

  const totals = calculateTotals();
  const balance = totals.totalDebit - totals.totalCredit;
  const isBalanced = Math.abs(balance) < 0.01;

  const saveVoucher = async () => {
    if (!isBalanced) {
      alert("يجب أن يكون إجمالي المدين مساوي لإجمالي الدائن");
      return;
    }

    if (details.length === 0) {
      alert("يجب إضافة تفاصيل للقيد");
      return;
    }

    if (
      !voucher.vouch_id ||
      voucher.vouch_id <= 0 ||
      !isFinite(voucher.vouch_id)
    ) {
      alert("خطأ: رقم القيد غير صحيح. يرجى إعادة تحميل الصفحة.");
      return;
    }

    setIsLoading(true);
    try {
      const voucherData = {
        vouch_id: voucher.vouch_id,
        vouch_date: voucher.vouch_date,
        vouch_type: voucher.vouch_type,
        vouch_amt: totals.totalDebit,
        vouch_notes: voucher.vouch_notes || "",
        vouch_status: voucher.vouch_status || 1,
        pay_type: voucher.pay_type,
        ref_no: voucher.ref_no || "",
      };

      const detailsData = details
        .filter((detail) => detail.acc_id && detail.acc_id > 0)
        .map((detail) => ({
          id: 0,
          vouch_id: voucher.vouch_id,
          acc_id: detail.acc_id,
          debit: detail.debit || 0,
          credit: detail.credit || 0,
          debit_g: detail.debit_g || 0,
          credit_g: detail.credit_g || 0,
          gauge: detail.gauge || 875,
          vouch_notes: detail.vouch_notes || "",
          cost_id: detail.cost_id || null,
          tax: detail.tax || 0,
          tax_prc: detail.tax_prc || 0,
          vat_no: detail.vat_no || 0,
        }));

      const result = await createVoucherAction(voucherData, detailsData);

      if (result.success && result.data) {
        const masterId = result.data.vouch_id;
        setVoucher((prev) => ({ ...prev, commit: true, id: masterId }));
        alert(result.message);
        if (masterId) {
          router.push(`/forms/voucher/${masterId}`);
        }
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert(
        `حدث خطأ أثناء حفظ القيد: ${error instanceof Error ? error.message : "خطأ غير معروف"}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const printVoucher = async () => {
    setIsPrinting(true);
    try {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html dir="rtl">
            <head>
              <title>قيد تسوية - ${voucher.vouch_id}</title>
              <style>
                body { font-family: 'Cairo', sans-serif; margin: 20px; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
                th { background-color: #f5f5f5; }
                .header { text-align: center; margin-bottom: 20px; }
                .totals { font-weight: bold; background-color: #f0f0f0; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>قيد تسوية</h1>
                <p>رقم القيد: ${voucher.vouch_id}</p>
                <p>التاريخ: ${voucher.vouch_date}</p>
                <p>البيان: ${voucher.vouch_notes || ""}</p>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>رقم الحساب</th>
                    <th>اسم الحساب</th>
                    <th>مدين</th>
                    <th>دائن</th>
                    <th>مدين ذهب</th>
                    <th>دائن ذهب</th>
                    <th>المعايرة</th>
                    <th>البيان</th>
                  </tr>
                </thead>
                <tbody>
                  ${details
                    .map((detail) => {
                      const account = accounts.find(
                        (acc) => acc.id === detail.acc_id,
                      );
                      return `
                      <tr>
                        <td>${account?.acc_code || ""}</td>
                        <td>${account?.acc_name || ""}</td>
                        <td>${detail.debit || 0}</td>
                        <td>${detail.credit || 0}</td>
                        <td>${detail.debit_g || 0}</td>
                        <td>${detail.credit_g || 0}</td>
                        <td>${detail.gauge || 875}</td>
                        <td>${detail.vouch_notes || ""}</td>
                      </tr>
                    `;
                    })
                    .join("")}
                  <tr class="totals">
                    <td colspan="2">الإجمالي</td>
                    <td>${totals.totalDebit}</td>
                    <td>${totals.totalCredit}</td>
                    <td>${totals.totalDebitG}</td>
                    <td>${totals.totalCreditG}</td>
                    <td></td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
        setVoucher((prev) => ({ ...prev, print: true }));
      }
    } catch (error) {
      alert(
        `حدث خطأ أثناء الطباعة: ${error instanceof Error ? error.message : "خطأ غير معروف"}`,
      );
    } finally {
      setIsPrinting(false);
    }
  };

  const handleSearch = () => {
    if (searchTerm) {
      const foundVoucher = vouchersList.find(
        (v) => v.vouch_id?.toString() === searchTerm || v.id?.toString() === searchTerm,
      );
      if (foundVoucher) {
        router.push(`/forms/voucher/${foundVoucher.vouch_id || foundVoucher.id}`);
      }
    }
  };

  const createFromPrevious = async () => {
    if (!selectedVoucher) {
      alert("يرجى اختيار قيد سابق");
      return;
    }

    try {
      setIsModalOpen(false);
      setIsLoading(true);

      // جلب تفاصيل القيد المحدد
      const detailsResponse = await voucherService.getDetails(selectedVoucher.id);
      
      if (detailsResponse.success && detailsResponse.data && Array.isArray(detailsResponse.data)) {
        // تحديث بيانات القيد
        setVoucher({
          ...selectedVoucher,
          vouch_id: 0, // رقم جديد
          vouch_date: new Date().toISOString(),
          cr_date: new Date().toISOString(),
          commit: false,
          post: false,
          print: false,
        });

        // نسخ التفاصيل
        const formattedDetails = detailsResponse.data.map((detail: any) => ({
          id: 0, // جديد
          vouch_id: 0,
          acc_id: detail.acc_id || detail.acc || 0,
          acc_code: detail.acc_code || "",
          acc_name: detail.acc_name || "",
          cost_id: detail.cost_id || 0,
          debit: parseFloat(detail.debit) || 0,
          credit: parseFloat(detail.credit) || 0,
          debit_g: parseFloat(detail.debit_g) || 0,
          credit_g: parseFloat(detail.credit_g) || 0,
          gauge: parseFloat(detail.gauge) || 875,
          tax: parseFloat(detail.tax) || 0,
          tax_prc: parseFloat(detail.tax_prc) || 0,
          vat_no: detail.vat_no || 0,
          vouch_notes: detail.vouch_notes || "",
          cr_date: new Date().toISOString(),
        }));

        setDetails(formattedDetails);

        // توليد رقم قيد جديد
        const nextId = await voucherService.getNextNumber(selectedVoucher.vouch_type);
        setVoucher((prev) => ({
          ...prev,
          vouch_id: nextId,
        }));

        // إعادة تعيين البحث
        setSearchTerm("");
        setSelectedVoucher(null);
      } else {
        alert("حدث خطأ أثناء تحميل تفاصيل القيد");
      }
    } catch (error) {
      console.error("Error creating from previous voucher:", error);
      alert("حدث خطأ أثناء نسخ القيد");
    } finally {
      setIsLoading(false);
    }
  };

  const allowEditing = formMode === "edit" || isNewVoucher;

  useEffect(() => {
    if (allowEditing && (startInEditMode || formMode === "edit")) {
      setIsEditing(true);
    }
  }, [allowEditing, formMode, startInEditMode]);

  if (!isClient) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // دالة تحميل خيارات الحسابات مع البحث
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

  // دالة الحصول على قيمة الحساب المحدد
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

  return (
    <>
      <div className="p-3 max-w-[1500px] mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
        {/* رأس القيد المرتب مثل الفواتير */}
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-3 mb-4 border border-slate-200">
          {/* الصف الأول: معلومات القيد */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-4">
                  <span>
                    {voucherTypes.find((t) => t.id === voucher.vouch_type)?.name ||
                      "قيد تسوية"}
                  </span>
                  <span className="text-slate-600 font-medium">
                    #{voucher.vouch_id &&
                    voucher.vouch_id > 0 &&
                    isFinite(voucher.vouch_id)
                      ? voucher.vouch_id
                      : voucher.id
                        ? `DB-${voucher.id}`
                        : "جاري الترقيم..."}
                  </span>
                  <span className="text-sm text-slate-600 font-medium flex items-center gap-1">
                    <i className="bi bi-calendar3 w-4 h-4 text-slate-500" />
                    {new Date(voucher.vouch_date).toLocaleString("ar-EG")}
                  </span>
                </h1>
              </div>
            </div>

            {/* البحث */}
            <div className="flex items-center gap-2">
              <input
                className="w-32 h-7 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2"
                placeholder="بحث برقم القيد..."
                type="number"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                className="h-7 px-2 text-xs bg-slate-600 text-white hover:bg-slate-700 border border-slate-600 rounded-md shadow-sm"
                onClick={handleSearch}
              >
                <i className="bi bi-search w-4 h-4" />
              </button>
            </div>
          </div>

          {/* الصف الثاني: الأزرار والحالة */}
          <div className="flex items-center justify-between">
            {/* الأزرار من اليسار لليمين */}
            <div className="flex items-center gap-2">
              <button
                className="h-7 px-3 text-xs bg-emerald-600 text-white hover:bg-emerald-700 border border-emerald-600 rounded-md shadow-sm disabled:opacity-50"
                disabled={isLoading}
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

              {!isEditing && allowEditing && (
                <button
                  className="h-7 px-3 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm"
                  onClick={() => setIsEditing(true)}
                >
                  <i className="bi bi-pencil-square w-4 h-4 text-slate-500 me-1" />
                  تعديل
                </button>
              )}

              <button
                className="h-7 px-3 text-xs bg-blue-600 text-white hover:bg-blue-700 border border-blue-600 rounded-md shadow-sm"
                onClick={() => router.push("/forms/voucher")}
              >
                <i className="bi bi-plus-circle w-4 h-4 me-1" />
                جديد
              </button>

              <button
                className="h-7 px-3 text-xs bg-slate-600 text-white hover:bg-slate-700 border border-slate-600 rounded-md shadow-sm disabled:opacity-50"
                disabled={isPrinting}
                onClick={printVoucher}
              >
                {isPrinting ? (
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    طباعة...
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <i className="bi bi-printer w-4 h-4 me-1" />
                    طباعة
                  </span>
                )}
              </button>

              <button
                className="h-7 px-3 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm"
                onClick={() => setIsModalOpen(true)}
              >
                <i className="bi bi-files w-4 h-4 text-slate-500 me-1" />
                انشاء من قيد سابق
              </button>

              {/* أزرار التنقل */}
              <div className="flex items-center gap-1 mr-2">
                <button
                  className="h-7 w-7 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm flex items-center justify-center"
                  onClick={() => navigateToVoucher("first")}
                >
                  <i className="bi bi-chevron-double-right w-4 h-4" />
                </button>
                <button
                  className="h-7 w-7 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm flex items-center justify-center"
                  onClick={() => navigateToVoucher("prev")}
                >
                  <i className="bi bi-chevron-right w-4 h-4" />
                </button>
                <span className="text-xs text-slate-600 px-2 font-medium">
                  {currentRecord} من {totalRecords}
                </span>
                <button
                  className="h-7 w-7 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm flex items-center justify-center"
                  onClick={() => navigateToVoucher("next")}
                >
                  <i className="bi bi-chevron-left w-4 h-4" />
                </button>
                <button
                  className="h-7 w-7 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm flex items-center justify-center"
                  onClick={() => navigateToVoucher("last")}
                >
                  <i className="bi bi-chevron-double-left w-4 h-4" />
                </button>
              </div>
            </div>

            {/* حالة القيد */}
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

        {/* نموذج بيانات القيد */}
        <div className="bg-white rounded-lg border border-slate-200 mb-4">
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* رقم المرجع */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">
                  رقم المرجع
                </label>
                <input
                  className="text-sm border border-slate-300 rounded-md px-3 py-2 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                  placeholder="أدخل رقم المرجع"
                  value={voucher.ref_no || ""}
                  onChange={(e) => setVoucher((prev) => ({ ...prev, ref_no: e.target.value }))}
                />
              </div>

              {/* تاريخ ووقت القيد */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">
                  تاريخ ووقت القيد
                </label>
                <input
                  type="datetime-local"
                  className="text-sm border border-slate-300 rounded-md px-3 py-2 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                  value={voucher.vouch_date ? new Date(voucher.vouch_date).toISOString().slice(0, 16) : ""}
                  onChange={(e) => setVoucher((prev) => ({ ...prev, vouch_date: e.target.value }))}
                />
              </div>

              {/* حالة القيد */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">
                  حالة القيد
                </label>
                <select
                  className="text-sm border border-slate-300 rounded-md px-3 py-2 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                  value={voucher.vouch_status || 1}
                  onChange={(e) =>
                    setVoucher((prev) => ({ ...prev, vouch_status: parseInt(e.target.value) }))
                  }
                >
                  {voucherStatuses.map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* نوع القيد */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">
                  نوع القيد
                </label>
                <select
                  className="text-sm border border-slate-300 rounded-md px-3 py-2 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                  value={voucher.vouch_type || 3}
                  onChange={(e) => updateVoucherType(parseInt(e.target.value))}
                >
                  {voucherTypes && voucherTypes.length > 0 ? (
                    voucherTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.type_name || type.name || `نوع ${type.id}`}
                      </option>
                    ))
                  ) : (
                    <option value="">لا توجد أنواع</option>
                  )}
                </select>
              </div>

              {/* البيان */}
              <div className="flex flex-col gap-1 lg:col-span-2">
                <label className="text-sm font-medium text-slate-700">البيان</label>
                <input
                  className="text-sm border border-slate-300 rounded-md px-3 py-2 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                  placeholder="أدخل بيان القيد"
                  value={voucher.vouch_notes || ""}
                  onChange={(e) => setVoucher((prev) => ({ ...prev, vouch_notes: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* جدول تفاصيل القيد */}
        <div className="bg-white rounded-lg border border-slate-200 mb-4">
          <div className="p-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-800">تفاصيل القيد</h3>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-2 py-1 rounded-full font-bold ${
                  isBalanced
                    ? "bg-emerald-200 text-emerald-900"
                    : "bg-red-200 text-red-900"
                }`}
              >
                <i
                  className={`bi ${isBalanced ? "bi-check-circle" : "bi-exclamation-triangle"} me-1`}
                />
                {isBalanced ? "متوازن" : "غير متوازن"}
              </span>
            </div>
          </div>

          <div className="p-2">
            <div className="flex justify-between mb-2">
              <button
                type="button"
                className="btn"
                onClick={addDetailRow}
              >
                + صف
              </button>
            </div>
            <div className="overflow-x-auto mb-3 max-w-full">
              <table className="min-w-[1200px] border text-sm text-center table-fixed">
                <thead className="bg-gray-100 text-xs font-bold">
                  <tr>
                    <th
                      className="w-64 p-0.5 font-bold text-slate-700 border"
                      rowSpan={2}
                    >
                      الحساب
                    </th>
                    <th
                      className="w-40 p-0.5 font-bold text-slate-700 border"
                      colSpan={2}
                    >
                      نقدي
                    </th>
                    <th
                      className="w-40 p-0.5 font-bold text-slate-700 border"
                      colSpan={2}
                    >
                      ذهب
                    </th>
                    <th
                      className="w-20 p-0.5 font-bold text-slate-700 border"
                      rowSpan={2}
                    >
                      المعايرة
                    </th>
                    <th
                      className="w-20 p-0.5 font-bold text-slate-700 border"
                      rowSpan={2}
                    >
                      الضريبة
                    </th>
                    <th
                      className="w-20 p-0.5 font-bold text-slate-700 border"
                      rowSpan={2}
                    >
                      نسبة الضريبة
                    </th>
                    <th
                      className="w-20 p-0.5 font-bold text-slate-700 border"
                      rowSpan={2}
                    >
                      الرقم الضريبي
                    </th>
                    {costCenters.length > 0 && (
                      <th
                        className="w-40 p-0.5 font-bold text-slate-700 border"
                        rowSpan={2}
                      >
                        مركز التكلفة
                      </th>
                    )}
                    <th
                      className="w-48 p-0.5 font-bold text-slate-700 border"
                      rowSpan={2}
                    >
                      البيان
                    </th>
                    <th
                      className="w-12 p-0.5 font-bold text-slate-700 border"
                      rowSpan={2}
                    >
                      حذف
                    </th>
                  </tr>
                  <tr>
                    <th className="w-20 p-0.5 font-bold text-slate-700 border">
                      مدين
                    </th>
                    <th className="w-20 p-0.5 font-bold text-slate-700 border">
                      دائن
                    </th>
                    <th className="w-20 p-0.5 font-bold text-slate-700 border">
                      مدين
                    </th>
                    <th className="w-20 p-0.5 font-bold text-slate-700 border">
                      دائن
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {details.map((detail, index) => (
                    <tr
                      key={index}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="p-0.5 border">
                        <AsyncCreatableSelect
                          isClearable
                          isSearchable
                          className="text-xs"
                          classNamePrefix="select"
                          components={{ IndicatorSeparator: () => null }}
                          formatCreateLabel={(inputValue) =>
                            `إضافة حساب جديد: "${inputValue}"`
                          }
                          instanceId={`account-select-${index}`}
                          loadOptions={loadAccountOptions}
                          menuPortalTarget={
                            typeof window !== "undefined" ? document.body : null
                          }
                          menuPosition="fixed"
                          placeholder="اختر الحساب..."
                          styles={{
                            control: (base) => ({
                              ...base,
                              minHeight: 30,
                              height: 30,
                            }),
                            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                          }}
                          value={getAccountSelectValue(detail)}
                          onChange={(selectedOption: any) => {
                            const opt: any = selectedOption;
                            const selected =
                              opt?.account ||
                              accounts.find((acc) => acc.id === opt?.value);

                            if (!selected) return;

                            // cache option in accounts list if not already present
                            if (!accounts.find((a) => a.id === selected.id)) {
                              updateAccountsList(selected);
                            }

                            // تحديث جميع بيانات الحساب
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

                      <td className="p-0.5 border">
                        <input
                          className="border w-full p-0.5 text-xs text-center appearance-none"
                          placeholder="0.00"
                          step="0.01"
                          type="number"
                          value={String(detail.debit || 0)}
                          onChange={(e) =>
                            updateDetail(
                              index,
                              "debit",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                        />
                      </td>

                      <td className="p-0.5 border">
                        <input
                          className="border w-full p-0.5 text-xs text-center appearance-none"
                          placeholder="0.00"
                          step="0.01"
                          type="number"
                          value={String(detail.credit || 0)}
                          onChange={(e) =>
                            updateDetail(
                              index,
                              "credit",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                        />
                      </td>

                      <td className="p-1 border">
                        <input
                          className="border w-full p-1 text-xs text-center appearance-none"
                          placeholder="0.00"
                          step="0.01"
                          type="number"
                          value={String(detail.debit_g || 0)}
                          onChange={(e) =>
                            updateDetail(
                              index,
                              "debit_g",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                        />
                      </td>

                      <td className="p-0.5 border">
                        <input
                          className="border w-full p-0.5 text-xs text-center appearance-none"
                          placeholder="0.00"
                          step="0.01"
                          type="number"
                          value={String(detail.credit_g || 0)}
                          onChange={(e) =>
                            updateDetail(
                              index,
                              "credit_g",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                        />
                      </td>

                      <td className="p-0.5 border">
                        <input
                          className="border w-full p-0.5 text-xs text-center appearance-none"
                          placeholder="875"
                          type="number"
                          value={String(detail.gauge || 875)}
                          onChange={(e) =>
                            updateDetail(
                              index,
                              "gauge",
                              parseInt(e.target.value) || 875,
                            )
                          }
                        />
                      </td>

                      <td className="p-0.5 border">
                        <input
                          className="border w-full p-0.5 text-xs text-center appearance-none"
                          placeholder="0.00"
                          step="0.01"
                          type="number"
                          value={String(detail.tax || 0)}
                          onChange={(e) =>
                            updateDetail(
                              index,
                              "tax",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                        />
                      </td>

                      <td className="p-0.5 border">
                        <input
                          className="border w-full p-0.5 text-xs text-center appearance-none"
                          placeholder="0.00"
                          step="0.01"
                          type="number"
                          value={String(detail.tax_prc || 0)}
                          onChange={(e) =>
                            updateDetail(
                              index,
                              "tax_prc",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                        />
                      </td>

                      <td className="p-1 border">
                        <input
                          className="border w-full p-1 text-xs text-center appearance-none"
                          placeholder="0"
                          type="number"
                          value={String(detail.vat_no || 0)}
                          onChange={(e) =>
                            updateDetail(
                              index,
                              "vat_no",
                              parseInt(e.target.value) || 0,
                            )
                          }
                        />
                      </td>

                      {costCenters.length > 0 && (
                        <td className="p-1 border">
                          <select
                            className="w-full text-xs border border-slate-300 rounded px-2 py-1 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
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
                                {center.name}
                              </option>
                            ))}
                          </select>
                        </td>
                      )}

                      <td className="p-1 border">
                        <input
                          className="border w-full p-1 text-xs text-center appearance-none"
                          placeholder="البيان"
                          type="text"
                          value={detail.vouch_notes || ""}
                          onChange={(e) =>
                            updateDetail(index, "vouch_notes", e.target.value)
                          }
                        />
                      </td>

                      <td className="p-1 border">
                        <button
                          className="text-red-600 font-bold"
                          tabIndex={-1}
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

        {/* شريط الإجماليات */}
        <div className="mt-1 bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="flex flex-wrap items-center justify-between gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-700 font-medium">إجمالي المدين:</span>
              <span className="font-semibold text-emerald-700 flex items-center gap-1">
                {formatAmount(totals.totalDebit)}
                <RiyalIcon color="currentColor" />
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-gray-700 font-medium">إجمالي الدائن:</span>
              <span className="font-semibold text-red-700 flex items-center gap-1">
                {formatAmount(totals.totalCredit)}
                <RiyalIcon color="currentColor" />
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-gray-700 font-medium">
                إجمالي المدين المعاير:
              </span>
              <span className="font-semibold text-emerald-700 flex items-center gap-1">
                {formatAmount(totals.totalDebitG)}
                <span className="text-xs text-emerald-700">جم</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-gray-700 font-medium">
                إجمالي الدائن المعاير:
              </span>
              <span className="font-semibold text-red-700 flex items-center gap-1">
                {formatAmount(totals.totalCreditG)}
                <span className="text-xs text-red-700">جم</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-gray-700 font-medium">إجمالي الضريبة:</span>
              <span className="font-semibold text-green-700 flex items-center gap-1">
                {formatAmount(totals.totalTax)}
                <RiyalIcon color="currentColor" />
              </span>
            </div>
          </div>
        </div>

        {/* نافذة القيود السابقة */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[80vh] overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 p-4">
                <h3 className="text-lg font-semibold text-slate-800">
                  اختر قيد سابق
                </h3>
              </div>

              <div className="p-4">
                <input
                  className="w-full mb-4 text-sm border border-slate-300 rounded-md px-3 py-2 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                  placeholder="بحث في القيود..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />

                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-right p-2 font-medium text-slate-700">
                          رقم القيد
                        </th>
                        <th className="text-right p-2 font-medium text-slate-700">
                          التاريخ
                        </th>
                        <th className="text-right p-2 font-medium text-slate-700">
                          النوع
                        </th>
                        <th className="text-right p-2 font-medium text-slate-700">
                          المبلغ
                        </th>
                        <th className="text-right p-2 font-medium text-slate-700">
                          الحالة
                        </th>
                        <th className="text-right p-2 font-medium text-slate-700">
                          إجراء
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {vouchersList
                        .filter(
                          (v) =>
                            v.vouch_id.toString().includes(searchTerm) ||
                            v.vouch_date.includes(searchTerm) ||
                            v.vouch_notes?.includes(searchTerm),
                        )
                        .map((v, index) => (
                          <tr
                            key={v.id || `${v.vouch_id}-${v.vouch_type}-${index}`}
                            className="border-b border-slate-100 hover:bg-slate-50"
                          >
                            <td className="p-2 text-slate-800">{v.vouch_id}</td>
                            <td className="p-2 text-slate-600">{v.vouch_date}</td>
                            <td className="p-2 text-slate-600">
                              {voucherTypes.find((t) => t.id === v.vouch_type)
                                ?.name || "غير محدد"}
                            </td>
                            <td className="p-2 text-slate-800">
                              {formatAmount(v.vouch_amt || 0)}
                            </td>
                            <td className="p-2">
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${
                                  v.vouch_status === 2
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {voucherStatuses.find((s) => s.id === v.vouch_status)
                                  ?.name || "غير محدد"}
                              </span>
                            </td>
                            <td className="p-2">
                              <button
                                className="h-6 px-2 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300 rounded-md shadow-sm"
                                onClick={() => {
                                  setSelectedVoucher(v);
                                  createFromPrevious();
                                }}
                              >
                                اختر
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <button
                    className="h-8 px-4 text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm font-medium"
                    onClick={() => setIsModalOpen(false)}
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
