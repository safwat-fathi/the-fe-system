"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Voucher, VoucherDetail } from "@/types/voucher";
import { API_ENDPOINTS, fetchData, apiFetch } from "@/utilities/api";
import { getCurrDate } from "@/utilities/getCurrDate";
import { getNextVoucherNumber } from "@/utilities/numbering";
import { VoucherContainer } from "./components";

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
      console.log("Creating new voucher, getting next ID...");
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
    setCurrentTime(now.toLocaleTimeString("ar-SA", {
      hour12: true,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }));
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
      
      const accountsResponse = await fetchData(API_ENDPOINTS.ACCOUNTS_LIST);
      if (accountsResponse && Array.isArray(accountsResponse)) {
        const level5Accounts = accountsResponse.filter(account => account.acc_level === 5);
        setAccounts(level5Accounts);
      }

      try {
        const costCentersResponse = await fetchData(API_ENDPOINTS.COST_CENTERS_LIST);
        if (costCentersResponse && Array.isArray(costCentersResponse)) {
          setCostCenters(costCentersResponse);
        } else {
          setCostCenters([]);
        }
      } catch (costCenterError) {
        setCostCenters([]);
      }

      const voucherTypesResponse = await fetchData(API_ENDPOINTS.VoucherTypeList);
      if (voucherTypesResponse && Array.isArray(voucherTypesResponse)) {
        setVoucherTypes(voucherTypesResponse);
      }

      const voucherStatusesResponse = await fetchData(API_ENDPOINTS.VoucherStageList);
      if (voucherStatusesResponse && Array.isArray(voucherStatusesResponse)) {
        setVoucherStatuses(voucherStatusesResponse);
      }

      await loadVouchersList();
      
    } catch (error) {
      console.error("خطأ في تحميل البيانات الأولية:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadVouchersList = async () => {
    try {
      const vouchersResponse = await fetchData(API_ENDPOINTS.VOUCHERS_LIST);
      if (vouchersResponse && Array.isArray(vouchersResponse)) {
        setVouchersList(vouchersResponse);
        setTotalRecords(vouchersResponse.length);
      }
    } catch (error) {
      console.error("خطأ في تحميل قائمة القيود:", error);
    }
  };

  const generateNextVoucherNumber = async () => {
    try {
      const nextId = await getNextVoucherNumber(voucher.vouch_type);
      setVoucher(prev => ({ 
        ...prev, 
        vouch_id: nextId,
        vouch_date: new Date().toISOString(),
        cr_date: new Date().toISOString()
      }));
    } catch (error) {
      console.error("خطأ في الحصول على رقم القيد التالي:", error);
      setVoucher(prev => ({ 
        ...prev, 
        vouch_id: 1,
        vouch_date: new Date().toISOString(),
        cr_date: new Date().toISOString()
      }));
    }
  };

  const loadVoucher = async (id: number) => {
    try {
      setIsLoading(true);
      
      const vouchersResponse = await fetchData(API_ENDPOINTS.VOUCHERS_LIST);
      
      if (vouchersResponse && Array.isArray(vouchersResponse)) {
        const targetVoucher = vouchersResponse.find((v: any) => v.id === id);
        
        if (targetVoucher) {
          const formattedVoucher = {
            ...targetVoucher,
            vouch_date: targetVoucher.vouch_date ? targetVoucher.vouch_date : new Date().toISOString(),
            cr_date: targetVoucher.cr_date || new Date().toISOString(),
            vouch_id: targetVoucher.vouch_id || 0,
            ref_no: targetVoucher.ref_no || "",
            vouch_notes: targetVoucher.vouch_notes || "",
            vouch_status: targetVoucher.vouch_status || 1,
            pay_type: targetVoucher.pay_type || 1,
          };
          
          setVoucher(formattedVoucher);
          const voucherIndex = vouchersResponse.findIndex((v: any) => v.id === id);
          setCurrentRecord(voucherIndex + 1);
        }
      }

      const detailsResponse = await fetchData(API_ENDPOINTS.VOUCHER_DETAILS(id));
      
      if (detailsResponse && Array.isArray(detailsResponse)) {
        const formattedDetails = detailsResponse.map(detail => {
          // البحث عن بيانات الحساب في قائمة الحسابات المحملة
          const account = accounts.find(acc => acc.id === (detail.acc_id || detail.acc));
          
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
        
        console.log("تفاصيل القيد المحملة:", formattedDetails);
        setDetails(formattedDetails);
      } else {
        setDetails([]);
      }
      
    } catch (error) {
      console.error("خطأ في تحميل القيد:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToVoucher = (direction: 'first' | 'prev' | 'next' | 'last') => {
    if (vouchersList.length === 0) return;

    let targetIndex = 0;
    const currentIndex = vouchersList.findIndex(v => v.id === voucher.id);

    switch (direction) {
      case 'first':
        targetIndex = 0;
        break;
      case 'prev':
        targetIndex = currentIndex > 0 ? currentIndex - 1 : 0;
        break;
      case 'next':
        targetIndex = currentIndex < vouchersList.length - 1 ? currentIndex + 1 : vouchersList.length - 1;
        break;
      case 'last':
        targetIndex = vouchersList.length - 1;
        break;
    }

    const targetVoucher = vouchersList[targetIndex];
    if (targetVoucher) {
      router.push(`/dashboard/forms/voucher?id=${targetVoucher.id}`);
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
    setDetails(prev => [...prev, newDetail]);
  };

  const removeDetailRow = (index: number) => {
    setDetails(prev => prev.filter((_, i) => i !== index));
  };

  const updateDetail = (index: number, field: keyof VoucherDetail, value: any) => {
    console.log(`تحديث الصف ${index}, الحقل ${field}, القيمة:`, value);
    
    setDetails(prev => {
      const updated = prev.map((detail, i) =>
        i === index ? { ...detail, [field]: value } : detail
      );
      
      console.log(`الصف ${index} بعد التحديث:`, updated[index]);
      return updated;
    });
  };

  const updateVoucherType = async (newType: number) => {
    setVoucher(prev => ({ ...prev, vouch_type: newType }));
    await generateNextVoucherNumber();
  };

  const calculateTotals = useCallback(() => {
    const totals = details.reduce((totals, detail) => {
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
    }, {
      totalDebit: 0,
      totalCredit: 0,
      totalDebitG: 0,
      totalCreditG: 0,
      totalTax: 0,
      totalTaxPrc: 0,
    });

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

    if (!voucher.vouch_id || voucher.vouch_id <= 0 || !isFinite(voucher.vouch_id)) {
      console.error("Invalid voucher ID:", voucher.vouch_id);
      alert("خطأ: رقم القيد غير صحيح. يرجى إعادة تحميل الصفحة.");
      return;
    }

    setIsLoading(true);
    try {
      const voucherData: any = {
        vouch_id: voucher.vouch_id,
        vouch_date: voucher.vouch_date,
        vouch_type: voucher.vouch_type,
        vouch_amt: totals.totalDebit,
        vouch_notes: voucher.vouch_notes || "",
        vouch_status: voucher.vouch_status || 1,
        pay_type: voucher.pay_type,
        ref_no: voucher.ref_no || "",
        cr_date: new Date().toISOString(),
      };

      const voucherResponse = await apiFetch(API_ENDPOINTS.CREATE_VOUCHER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(voucherData),
      });

      if (!voucherResponse.ok) {
        const errorText = await voucherResponse.text();
        throw new Error(`خطأ في حفظ رأس القيد: ${errorText}`);
      }

      const savedVoucher = await voucherResponse.json();
      const masterId = savedVoucher.id;

      if (!masterId || !isFinite(masterId) || masterId <= 0) {
        throw new Error(`لم يتم الحصول على معرف القيد الصحيح من الخادم: ${masterId}`);
      }

      for (const detail of details) {
        if (!detail.acc_id || detail.acc_id === 0) {
          continue;
        }
        
        const detailData = {
          vouch: masterId,
          acc: detail.acc_id,
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
          cr_date: new Date().toISOString(),
        };

        const detailResponse = await apiFetch(API_ENDPOINTS.CREATE_VOUCHER_DTL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(detailData),
        });

        if (!detailResponse.ok) {
          const errorText = await detailResponse.text();
          throw new Error(`خطأ في حفظ تفصيل القيد: ${errorText}`);
        }
      }

      setVoucher(prev => ({ ...prev, commit: true, id: masterId }));
      
      alert("تم حفظ القيد بنجاح");
      await loadVouchersList();
      
      if (masterId) {
        router.push(`/dashboard/forms/voucher?id=${masterId}`);
      }
    } catch (error) {
      alert(`حدث خطأ أثناء حفظ القيد: ${error instanceof Error ? error.message : "خطأ غير معروف"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const printVoucher = async () => {
    setIsPrinting(true);
    try {
      const printWindow = window.open('', '_blank');
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
                <p>البيان: ${voucher.vouch_notes || ''}</p>
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
                  ${details.map(detail => {
                    const account = accounts.find(acc => acc.id === detail.acc_id);
                    return `
                      <tr>
                        <td>${account?.acc_code || ''}</td>
                        <td>${account?.acc_name || ''}</td>
                        <td>${detail.debit || 0}</td>
                        <td>${detail.credit || 0}</td>
                        <td>${detail.debit_g || 0}</td>
                        <td>${detail.credit_g || 0}</td>
                        <td>${detail.gauge || 875}</td>
                        <td>${detail.vouch_notes || ''}</td>
                      </tr>
                    `;
                  }).join('')}
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
        
        setVoucher(prev => ({ ...prev, print: true }));
      }
    } catch (error) {
      alert(`حدث خطأ أثناء الطباعة: ${error instanceof Error ? error.message : "خطأ غير معروف"}`);
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
    router.push(`/dashboard/forms/voucher?id=${selectedVoucher.vouch_id}&copy=true`);
  };

  const handleSearch = () => {
    if (searchTerm) {
      const foundVoucher = vouchersList.find(v => v.id.toString() === searchTerm);
      if (foundVoucher) {
        router.push(`/dashboard/forms/voucher?id=${foundVoucher.id}`);
      }
    }
  };

  if (!isClient) {
    return <div className="flex justify-center items-center h-screen">جاري التحميل...</div>;
  }

  return (
    <VoucherContainer
      voucher={voucher}
      details={details}
      currentTime={currentTime}
      isLoading={isLoading}
      isPrinting={isPrinting}
      isBalanced={isBalanced}
      accounts={accounts}
      costCenters={costCenters}
      voucherTypes={voucherTypes}
      voucherStatuses={voucherStatuses}
      vouchersList={vouchersList}
      currentRecord={currentRecord}
      totalRecords={totalRecords}
      searchTerm={searchTerm}
      isModalOpen={isModalOpen}
      onVoucherChange={(field, value) => setVoucher(prev => ({ ...prev, [field]: value }))}
      onVoucherTypeChange={updateVoucherType}
      onUpdateDetail={updateDetail}
      onAddRow={addDetailRow}
      onRemoveRow={removeDetailRow}
      onSave={saveVoucher}
      onEdit={() => router.push("/dashboard/forms/voucher")}
      onNew={() => router.push("/dashboard/forms/voucher")}
      onPrint={printVoucher}
      onCreateFromPrevious={() => setIsModalOpen(true)}
      onNavigate={navigateToVoucher}
      onSearchChange={setSearchTerm}
      onSearch={handleSearch}
      onModalClose={() => setIsModalOpen(false)}
      onSelectVoucher={(voucher) => {
        setSelectedVoucher(voucher);
        createFromPrevious();
      }}
      onUpdateAccountsList={updateAccountsList}
    />
  );
}
