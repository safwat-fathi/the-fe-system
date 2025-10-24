"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { VoucherContainer } from "./components";

import { Voucher, VoucherDetail } from "@/types/voucher";
import {
  voucherService,
  accountService,
  costCenterService,
} from "@/services/api";
import { createVoucherAction } from "@/app/actions/voucher.action";

import "bootstrap-icons/font/bootstrap-icons.css";

export default function VoucherEntryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vouchId = searchParams.get("id");

  // State Management
  const [voucher, setVoucher] = useState<Voucher>({
    vouch_id: 0,
    vouch_date: new Date().toISOString(),
    vouch_type: 3, // قيد تسوية
    vouch_amt: 0,
    pay_type: 1,
    cr_date: new Date().toISOString(),
    vouch_status: 1,
  });

  const [currentTime, setCurrentTime] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [details, setDetails] = useState<VoucherDetail[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [costCenters, setCostCenters] = useState<any[]>([]);
  const [voucherTypes, setVoucherTypes] = useState<any[]>([]);
  const [voucherStatuses, setVoucherStatuses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
  const [vouchersList, setVouchersList] = useState<any[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Initialize component
  useEffect(() => {
    setIsClient(true);
    updateCurrentTime();
    loadInitialData();
  }, []);

  useEffect(() => {
    if (vouchId) {
      loadVoucher(parseInt(vouchId));
    } else {
      generateNextVoucherNumber();
      addDetailRow();
    }
  }, [vouchId]);

  useEffect(() => {
    if (!isClient) return;
    const interval = setInterval(updateCurrentTime, 60000);

    return () => clearInterval(interval);
  }, [isClient]);

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

  // دالة تحديث الحسابات المحملة عند اختيار حساب جديد
  const updateAccountsList = (newAccount: any) => {
    if (!accounts.find((acc) => acc.id === newAccount.id)) {
      setAccounts([...accounts, newAccount]);
    }
  };

  const loadInitialData = async () => {
    try {
      setIsLoading(true);

      // استخدام النظام الجديد من services
      const [
        accountsResponse,
        costCentersResponse,
        voucherTypesResponse,
        voucherStagesResponse,
      ] = await Promise.all([
        accountService.getAllAccounts(),
        costCenterService.getAllCostCenters(),
        voucherService.getVoucherTypes(),
        voucherService.getVoucherStages(),
      ]);

      // معالجة الحسابات
      if (accountsResponse && Array.isArray(accountsResponse)) {
        const level5Accounts = accountsResponse.filter(
          (account: any) => account.acc_level === 5,
        );

        setAccounts(level5Accounts);
      } else {
        setAccounts([]);
      }

      // معالجة مراكز التكلفة
      if (costCentersResponse && Array.isArray(costCentersResponse)) {
        setCostCenters(costCentersResponse);
      } else {
        setCostCenters([]);
      }

      // معالجة أنواع السندات
      if (voucherTypesResponse.success && voucherTypesResponse.data) {
        setVoucherTypes(
          Array.isArray(voucherTypesResponse.data)
            ? voucherTypesResponse.data
            : [],
        );
      } else {
        setVoucherTypes([]);
      }

      // معالجة حالات السندات
      if (voucherStagesResponse.success && voucherStagesResponse.data) {
        setVoucherStatuses(
          Array.isArray(voucherStagesResponse.data)
            ? voucherStagesResponse.data
            : [],
        );
      } else {
        setVoucherStatuses([]);
      }

      await loadVouchersList();
    } catch (error) {
      // Silent error
    } finally {
      setIsLoading(false);
    }
  };

  const loadVouchersList = async () => {
    try {
      const vouchersResponse = await voucherService.getAll();

      if (vouchersResponse.success && vouchersResponse.data) {
        const vouchers = Array.isArray(vouchersResponse.data)
          ? vouchersResponse.data
          : [];

        setVouchersList(vouchers);
        setTotalRecords(vouchers.length);
      } else {
        setVouchersList([]);
        setTotalRecords(0);
      }
    } catch (error) {
      setVouchersList([]);
      setTotalRecords(0);
    }
  };

  const generateNextVoucherNumber = async () => {
    try {
      // استخدام getNextNumber من voucherService مباشرة
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

      // جلب السند
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
        }
      }

      // جلب تفاصيل السند
      const detailsResponse = await voucherService.getDetails(id);

      if (
        detailsResponse.success &&
        detailsResponse.data &&
        Array.isArray(detailsResponse.data)
      ) {
        const formattedDetails = detailsResponse.data.map((detail: any) => {
          // البحث عن بيانات الحساب في قائمة الحسابات المحملة
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

  // تجهيز البيانات للمعاينة
  const getPayloadPreview = useCallback(() => {
    const voucherPayload = {
      vouch_id: voucher.vouch_id,
      vouch_date: voucher.vouch_date,
      vouch_type: voucher.vouch_type,
      vouch_amt: totals.totalDebit,
      vouch_notes: voucher.vouch_notes || "",
      vouch_status: voucher.vouch_status || 1,
      pay_type: voucher.pay_type,
      ref_no: voucher.ref_no || "",
      com: 1,
      year: 1,
    };

    const detailsPayload = details
      .filter((detail) => detail.acc_id && detail.acc_id > 0)
      .map((detail) => ({
        vouch: "سيتم تعيينه من id الجدول", // id من جدول vouchers
        acc: detail.acc_id, // رقم الحساب فقط
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
        com: 1,
        year: 1,
      }));

    return {
      voucher: voucherPayload,
      details: detailsPayload,
      totals: {
        totalDebit: totals.totalDebit,
        totalCredit: totals.totalCredit,
        balance: balance,
        isBalanced: isBalanced,
      },
    };
  }, [voucher, details, totals, balance, isBalanced]);

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
        await loadVouchersList();

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

  const createFromPrevious = () => {
    if (!selectedVoucher) {
      alert("يرجى اختيار قيد سابق");

      return;
    }
    setIsModalOpen(false);
    router.push(`/forms/voucher?copy=${selectedVoucher.vouch_id}&type=${selectedVoucher.vouch_type}`);
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

  if (!isClient) {
    return (
      <div className="flex justify-center items-center h-screen">
        جاري التحميل...
      </div>
    );
  }

  return (
    <>
      {/* معاينة البيانات المُرسلة - للاختبار */}
      <div className="bg-gray-900 text-green-400 p-4 font-mono text-xs mb-4 rounded-lg overflow-auto max-h-96">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-white font-bold text-sm">
            📤 معاينة البيانات (POST Payload Preview)
          </h3>
          <button
            className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
            onClick={() => {
              navigator.clipboard.writeText(
                JSON.stringify(getPayloadPreview(), null, 2),
              );
              alert("تم النسخ!");
            }}
            type="button"
          >
            📋 نسخ JSON
          </button>
        </div>
        <pre className="whitespace-pre-wrap">
          {JSON.stringify(getPayloadPreview(), null, 2)}
        </pre>
      </div>

      <VoucherContainer
        accounts={accounts}
        costCenters={costCenters}
        currentRecord={currentRecord}
        currentTime={currentTime}
        details={details}
        isBalanced={isBalanced}
        isLoading={isLoading}
        isModalOpen={isModalOpen}
        isPrinting={isPrinting}
        searchTerm={searchTerm}
        totalRecords={totalRecords}
        voucher={voucher}
        voucherStatuses={voucherStatuses}
        voucherTypes={voucherTypes}
        vouchersList={vouchersList}
        onAddRow={addDetailRow}
        onCreateFromPrevious={() => setIsModalOpen(true)}
        onEdit={() => router.push("/forms/voucher")}
        onModalClose={() => setIsModalOpen(false)}
        onNavigate={navigateToVoucher}
        onNew={() => router.push("/forms/voucher")}
        onPrint={printVoucher}
        onRemoveRow={removeDetailRow}
        onSave={saveVoucher}
        onSearch={handleSearch}
        onSearchChange={setSearchTerm}
        onSelectVoucher={(voucher) => {
          setSelectedVoucher(voucher);
          createFromPrevious();
        }}
        onUpdateAccountsList={updateAccountsList}
        onUpdateDetail={updateDetail}
        onVoucherChange={(field, value) =>
          setVoucher((prev) => ({ ...prev, [field]: value }))
        }
        onVoucherTypeChange={updateVoucherType}
      />
    </>
  );
}
