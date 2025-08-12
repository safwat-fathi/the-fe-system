"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Button,
  Input,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Select,
  SelectItem,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Tooltip,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Checkbox,
} from "@heroui/react";
import {
  FaSave,
  FaPrint,
  FaSearch,
  FaPlus,
  FaTrash,
  FaEdit,
  FaCalculator,
  FaFolder,
  FaChevronLeft,
  FaChevronRight,
  FaStepForward,
  FaStepBackward,
  FaEye,
  FaCopy,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
import { Voucher, VoucherDetail } from "@/types/voucher";
import { API_ENDPOINTS, fetchData, apiFetch } from "@/utilities/api";
import { formatAmount } from "@/utilities/formatAmount";
import { getCurrDate } from "@/utilities/getCurrDate";
import { RiyalIcon } from "@/components/RiyalIcon";
import "bootstrap-icons/font/bootstrap-icons.css";

export default function VoucherEntryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vouchId = searchParams.get("id");
  const { isOpen, onOpen, onClose } = useDisclosure();

  // State Management
  const [voucher, setVoucher] = useState<Voucher>({
    vouch_id: 0,
    vouch_date: getCurrDate(),
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

  const inputRefs = useRef<(HTMLInputElement | null)[][]>([]);
  const tableRef = useRef<HTMLDivElement>(null);

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
      getNextVoucherNumber();
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

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      
      const accountsResponse = await fetchData(API_ENDPOINTS.ACCOUNTS_LIST);
      if (accountsResponse && Array.isArray(accountsResponse)) {
        const level5Accounts = accountsResponse.filter(account => account.acc_level === 5);
        setAccounts(level5Accounts);
      }

             // تحميل مراكز التكلفة - معالجة الخطأ إذا لم تكن متوفرة
       try {
         const costCentersResponse = await fetchData(API_ENDPOINTS.COST_CENTERS_LIST);
         if (costCentersResponse && Array.isArray(costCentersResponse)) {
           setCostCenters(costCentersResponse);
         } else {
           setCostCenters([]);
         }
       } catch (costCenterError) {
         // لا نطبع الخطأ في الكونسول لتجنب إرباك المستخدم
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
      
      console.log("=== انتهاء تحميل البيانات الأولية ===");
      console.log("Accounts loaded:", accounts.length);
      console.log("Sample account:", accounts[0]);
      console.log("Cost centers loaded:", costCenters.length);
      console.log("Sample cost center:", costCenters[0]);
      console.log("Voucher types loaded:", voucherTypes.length);
      console.log("Sample voucher type:", voucherTypes[0]);
      console.log("Voucher statuses loaded:", voucherStatuses.length);
      console.log("Sample voucher status:", voucherStatuses[0]);
      console.log("=====================================");
      
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

  const getNextVoucherNumber = async () => {
    try {
      console.log("=== الحصول على رقم القيد التالي ===");
      console.log("Current voucher type:", voucher.vouch_type);
      
      const vouchersResponse = await fetchData(API_ENDPOINTS.VOUCHERS_LIST);
      const vouchersCount = Array.isArray(vouchersResponse) ? vouchersResponse.length : 0;
      console.log("Total vouchers count:", vouchersCount);
      
      if (vouchersResponse && Array.isArray(vouchersResponse)) {
        // تصفية القيود حسب نوع القيد الحالي مع التحقق من صحة البيانات
        const sameTypeVouchers = vouchersResponse.filter((v: any) => {
          const isValidType = v.vouch_type === voucher.vouch_type;
          const hasValidId = v.vouch_id && isFinite(v.vouch_id) && v.vouch_id > 0;
          return isValidType && hasValidId;
        });
        
        console.log("Valid vouchers of same type:", sameTypeVouchers.length);
        
        if (sameTypeVouchers.length > 0) {
          // ترتيب الأرقام تصاعدياً للبحث عن الفجوات
          const sortedIds = sameTypeVouchers.map((v: any) => v.vouch_id).sort((a, b) => a - b);
          console.log("Sorted voucher IDs:", sortedIds);
          
          // البحث عن أول فجوة في التسلسل أو استخدام الرقم التالي
          let nextId = 1;
          for (let i = 0; i < sortedIds.length; i++) {
            if (sortedIds[i] !== i + 1) {
              nextId = i + 1;
              console.log("Found gap at position", i + 1, "using ID:", nextId);
              break;
            }
            nextId = sortedIds[i] + 1;
          }
          
          console.log("Calculated next voucher ID:", nextId);
          setVoucher(prev => ({ ...prev, vouch_id: nextId }));
        } else {
          // لا توجد قيود من نفس النوع، ابدأ من 1
          console.log("No vouchers of type", voucher.vouch_type, "found, starting with ID: 1");
          setVoucher(prev => ({ ...prev, vouch_id: 1 }));
        }
      } else {
        console.log("No vouchers found at all, starting with ID: 1");
        setVoucher(prev => ({ ...prev, vouch_id: 1 }));
      }
      
      console.log("=== انتهاء الحصول على رقم القيد التالي ===");
    } catch (error) {
      console.error("خطأ في الحصول على رقم القيد التالي:", error);
      // في حالة الخطأ، نبدأ من 1
      setVoucher(prev => ({ ...prev, vouch_id: 1 }));
    }
  };

  const loadVoucher = async (id: number) => {
    try {
      setIsLoading(true);
      
      console.log("=== تحميل القيد ===");
      console.log("Loading voucher with ID:", id);
      
      const vouchersResponse = await fetchData(API_ENDPOINTS.VOUCHERS_LIST);
      console.log("All vouchers:", vouchersResponse);
      
      if (vouchersResponse && Array.isArray(vouchersResponse)) {
        const targetVoucher = vouchersResponse.find((v: any) => v.id === id);
        console.log("Target voucher found:", targetVoucher);
        console.log("Raw voucher data:", {
          id: targetVoucher?.id,
          vouch_id: targetVoucher?.vouch_id,
          vouch_type: targetVoucher?.vouch_type,
          vouch_date: targetVoucher?.vouch_date,
          ref_no: targetVoucher?.ref_no,
          vouch_notes: targetVoucher?.vouch_notes,
          vouch_status: targetVoucher?.vouch_status,
          pay_type: targetVoucher?.pay_type,
        });
        
        if (targetVoucher) {
          // تحويل التاريخ إلى التنسيق المطلوب
          const formattedVoucher = {
            ...targetVoucher,
            vouch_date: targetVoucher.vouch_date ? targetVoucher.vouch_date.split('T')[0] : getCurrDate(),
            cr_date: targetVoucher.cr_date || new Date().toISOString(),
            // التأكد من أن vouch_id موجود
            vouch_id: targetVoucher.vouch_id || 0,
            // التأكد من أن البيانات النصية موجودة
            ref_no: targetVoucher.ref_no || "",
            vouch_notes: targetVoucher.vouch_notes || "",
            vouch_status: targetVoucher.vouch_status || 1,
            pay_type: targetVoucher.pay_type || 1,
          };
          
          console.log("Formatted voucher:", formattedVoucher);
          console.log("Voucher ID (sequential):", formattedVoucher.vouch_id);
          console.log("Voucher Type:", formattedVoucher.vouch_type);
          console.log("DB ID:", formattedVoucher.id);
          console.log("Reference Number:", formattedVoucher.ref_no);
          console.log("Notes:", formattedVoucher.vouch_notes);
          setVoucher(formattedVoucher);
          const voucherIndex = vouchersResponse.findIndex((v: any) => v.id === id);
          setCurrentRecord(voucherIndex + 1);
        }
      }

      console.log("Loading voucher details from:", API_ENDPOINTS.VOUCHER_DETAILS(id));
      const detailsResponse = await fetchData(API_ENDPOINTS.VOUCHER_DETAILS(id));
      console.log("Voucher details response:", detailsResponse);
      
      if (detailsResponse && Array.isArray(detailsResponse)) {
        console.log("Details count:", detailsResponse.length);
        console.log("Sample detail:", detailsResponse[0]);
        
        // تحسين البيانات المحملة
        const formattedDetails = detailsResponse.map(detail => ({
          ...detail,
          acc_id: detail.acc_id || detail.acc || 0,
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
        }));
        
        console.log("Formatted details for totals:", formattedDetails.map(d => ({
          debit: d.debit,
          credit: d.credit,
          debit_g: d.debit_g,
          credit_g: d.credit_g,
          tax: d.tax,
          tax_prc: d.tax_prc
        })));
        
        console.log("Formatted details:", formattedDetails);
        setDetails(formattedDetails);
      } else {
        console.log("No details found, setting empty array");
        setDetails([]);
      }
      
      console.log("=== انتهاء تحميل القيد ===");
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
    console.log("Adding detail row with voucher ID:", voucher.vouch_id);
    const newDetail: VoucherDetail = {
      id: 0,
      vouch_id: voucher.vouch_id,
      acc_id: 0,
      debit: 0,
      credit: 0,
      debit_g: 0,
      credit_g: 0,
      gauge: 875,
      cost_id: 0,
      vouch_notes: "",
      tax: 0,           // قيمة الضريبة
      tax_prc: 0,       // نسبة الضريبة
      vat_no: 0,        // الرقم الضريبي
      cr_date: new Date().toISOString(),
    };
    setDetails(prev => [...prev, newDetail]);
  };

  const removeDetailRow = (index: number) => {
    setDetails(prev => prev.filter((_, i) => i !== index));
  };

  const updateDetail = (index: number, field: keyof VoucherDetail, value: any) => {
    setDetails(prev => prev.map((detail, i) =>
      i === index ? { ...detail, [field]: value } : detail
    ));
  };

  // دالة لتحديث رقم القيد عند تغيير نوع القيد
  const updateVoucherType = async (newType: number) => {
    console.log("=== تحديث نوع القيد ===");
    console.log("Old type:", voucher.vouch_type);
    console.log("New type:", newType);
    
    setVoucher(prev => ({ ...prev, vouch_type: newType }));
    
    // الحصول على رقم قيد جديد للنوع الجديد
    await getNextVoucherNumber();
    
    console.log("=== انتهاء تحديث نوع القيد ===");
  };



  const duplicateDetailRow = (index: number) => {
    const detailToDuplicate = details[index];
    const newDetail: VoucherDetail = {
      ...detailToDuplicate,
      id: 0,
      cr_date: new Date().toISOString(),
    };
    setDetails(prev => [...prev, newDetail]);
  };

  const calculateTotals = useCallback(() => {
    console.log("=== حساب الإجماليات ===");
    console.log("Details for calculation:", details);
    
    const totals = details.reduce((totals, detail) => {
      const debit = parseFloat(String(detail.debit || 0)) || 0;
      const credit = parseFloat(String(detail.credit || 0)) || 0;
      const debitG = parseFloat(String(detail.debit_g || 0)) || 0;
      const creditG = parseFloat(String(detail.credit_g || 0)) || 0;
      const tax = parseFloat(String(detail.tax || 0)) || 0;
      const taxPrc = parseFloat(String(detail.tax_prc || 0)) || 0;
      
      console.log("Detail calculation:", {
        detail,
        debit, credit, debitG, creditG, tax, taxPrc
      });
      
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

    console.log("Calculated totals:", totals);
    console.log("Balance:", totals.totalDebit - totals.totalCredit);
    console.log("Is balanced:", Math.abs(totals.totalDebit - totals.totalCredit) < 0.01);
    console.log("=========================");

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

          console.log("=== بدء حفظ القيد ===");
      console.log("Voucher state:", voucher);
      console.log("DB ID (auto):", voucher.id);
      console.log("Voucher ID (sequential):", voucher.vouch_id);
      console.log("Voucher Type:", voucher.vouch_type);
      console.log("Details count:", details.length);
    
    setIsLoading(true);
    try {
      const voucherData: any = {
        vouch_id: voucher.vouch_id, // رقم القيد التسلسلي حسب النوع (1, 2, 3... لكل نوع)
        vouch_date: voucher.vouch_date,
        vouch_type: voucher.vouch_type, // نوع القيد (1=قبض, 2=صرف, 3=تسوية, 0=افتتاحي)
        vouch_amt: totals.totalDebit,
        vouch_notes: voucher.vouch_notes || "",
        vouch_status: voucher.vouch_status || 1,
        pay_type: voucher.pay_type,
        ref_no: voucher.ref_no || "",
        cr_date: new Date().toISOString(),
      };

      console.log("=== بيانات رأس القيد المرسلة ===");
      console.log("Current voucher ID:", voucher.vouch_id);
      console.log("Is new voucher:", voucher.vouch_id === 0);
      console.log("Voucher Data:", JSON.stringify(voucherData, null, 2));
      console.log("================================");

      const voucherResponse = await apiFetch(API_ENDPOINTS.CREATE_VOUCHER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(voucherData),
      });

      if (!voucherResponse.ok) {
        const errorText = await voucherResponse.text();
        console.error("Voucher save error response:", errorText);
        throw new Error(`خطأ في زر رأس القيد: ${errorText}`);
      }

      const savedVoucher = await voucherResponse.json();
      const masterId = savedVoucher.id; // المفتاح الأساسي الآلي من قاعدة البيانات

      console.log("=== استجابة حفظ رأس القيد ===");
      console.log("Response Status:", voucherResponse.status);
      console.log("Saved Voucher:", savedVoucher);
      console.log("Master ID (from DB):", masterId);
      console.log("Available fields:", Object.keys(savedVoucher));
      console.log("=============================");

      if (!masterId || !isFinite(masterId) || masterId <= 0) {
        console.error("Invalid master ID:", masterId);
        throw new Error(`لم يتم الحصول على معرف القيد الصحيح من الخادم: ${masterId}`);
      }

      for (const detail of details) {
        if (!detail.acc_id || detail.acc_id === 0) {
          console.log("Skipping detail with no account ID:", detail);
          continue;
        }
        
        const detailData = {
          vouch: masterId, // استخدام المفتاح الأساسي الآلي (id) للربط مع رأس القيد
          acc: detail.acc_id, // الخادم يتوقع acc بدلاً من acc_id
          debit: detail.debit || 0,
          credit: detail.credit || 0,
          debit_g: detail.debit_g || 0,
          credit_g: detail.credit_g || 0,
          gauge: detail.gauge || 875,
          vouch_notes: detail.vouch_notes || "",
          cost_id: detail.cost_id || null,
          tax: detail.tax || 0,           // قيمة الضريبة
          tax_prc: detail.tax_prc || 0,   // نسبة الضريبة
          vat_no: detail.vat_no || 0,     // الرقم الضريبي
          cr_date: new Date().toISOString(),
        };

        // فحص البيانات قبل الإرسال
        if (!detailData.vouch || !detailData.acc) {
          console.error("Invalid detail data:", detailData);
          throw new Error(`بيانات تفصيل القيد غير صحيحة: vouch=${detailData.vouch}, acc=${detailData.acc}`);
        }

        console.log("=== بيانات تفصيل القيد المرسلة ===");
        console.log("Detail Index:", details.indexOf(detail) + 1);
        console.log("Master ID being used:", masterId);
        console.log("Account ID:", detail.acc_id);
        console.log("Detail Data:", JSON.stringify(detailData, null, 2));
        console.log("===================================");

        const detailResponse = await apiFetch(API_ENDPOINTS.CREATE_VOUCHER_DTL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(detailData),
        });

        if (!detailResponse.ok) {
          const errorText = await detailResponse.text();
          console.error("Detail save error response:", errorText);
          console.error("Detail data that caused error:", detailData);
          throw new Error(`خطأ في حفظ تفصيل القيد: ${errorText}`);
        }

        console.log("=== استجابة حفظ تفصيل القيد ===");
        console.log("Detail Index:", details.indexOf(detail) + 1);
        console.log("Response Status:", detailResponse.status);
        console.log("Response OK:", detailResponse.ok);
        console.log("=================================");
      }

      // تحديث حالة الحفظ
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
                        <td>${formatAmount(detail.debit || 0)}</td>
                        <td>${formatAmount(detail.credit || 0)}</td>
                        <td>${formatAmount(detail.debit_g || 0)}</td>
                        <td>${formatAmount(detail.credit_g || 0)}</td>
                        <td>${detail.gauge || 875}</td>
                        <td>${detail.vouch_notes || ''}</td>
                      </tr>
                    `;
                  }).join('')}
                  <tr class="totals">
                    <td colspan="2">الإجمالي</td>
                    <td>${formatAmount(totals.totalDebit)}</td>
                    <td>${formatAmount(totals.totalCredit)}</td>
                    <td>${formatAmount(totals.totalDebitG)}</td>
                    <td>${formatAmount(totals.totalCreditG)}</td>
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
        
        // تحديث حالة الطباعة
        setVoucher(prev => ({ ...prev, print: true }));
      }
    } catch (error) {
      alert(`حدث خطأ أثناء الطباعة: ${error instanceof Error ? error.message : "خطأ غير معروف"}`);
    } finally {
      setIsPrinting(false);
    }
  };

  const deleteVoucher = async () => {
    if (!voucher.vouch_id) {
      alert("لا يمكن حذف قيد غير محفوظ");
      return;
    }

    if (!confirm("هل أنت متأكد من حذف هذا القيد؟")) {
      return;
    }

    setIsLoading(true);
    try {
      for (const detail of details) {
        if (detail.id) {
          await apiFetch(API_ENDPOINTS.DELETE_VOUCHER_DTL(detail.id), {
            method: "DELETE",
          });
        }
      }

      const response = await apiFetch(API_ENDPOINTS.DELETE_VOUCHER(voucher.vouch_id), {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("خطأ في حذف القيد");
      }

      alert("تم حذف القيد بنجاح");
      router.push("/dashboard/forms/voucher");
    } catch (error) {
      alert(`حدث خطأ أثناء حذف القيد: ${error instanceof Error ? error.message : "خطأ غير معروف"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const createFromPrevious = () => {
    if (!selectedVoucher) {
      alert("يرجى اختيار قيد سابق");
      return;
    }
    onClose();
    router.push(`/dashboard/forms/voucher?id=${selectedVoucher.vouch_id}&copy=true`);
  };

  const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number, colIndex: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const nextRow = rowIndex + 1;
      const nextCol = colIndex;
      if (nextRow < details.length) {
        inputRefs.current[nextRow]?.[nextCol]?.focus();
      } else if (colIndex < 5) {
        inputRefs.current[rowIndex]?.[colIndex + 1]?.focus();
      }
    }
  };

  if (!isClient) {
    return <div className="flex justify-center items-center h-screen">جاري التحميل...</div>;
  }

  return (
    <div className="p-3 max-w-[1500px] mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
      
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-3 mb-4 border border-slate-200">
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-4">
                <span>
                  {voucherTypes.find(t => t.id === voucher.vouch_type)?.name || 'قيد تسوية'}
                </span>
                <span className="text-slate-600 font-medium text-2xl">
                  #{voucher.vouch_id && voucher.vouch_id > 0 && isFinite(voucher.vouch_id) ? voucher.vouch_id : (voucher.id ? `DB-${voucher.id}` : 'جاري الترقيم...')}
                </span>
                {(() => {
                  console.log("Rendering title - voucher state:", {
                    vouch_id: voucher.vouch_id,
                    id: voucher.id,
                    vouch_type: voucher.vouch_type,
                    ref_no: voucher.ref_no,
                    vouch_notes: voucher.vouch_notes
                  });
                  return null;
                })()}
                <span className="text-base text-slate-600 font-medium flex items-center gap-1">
                  <i className="bi bi-calendar3 text-slate-500"></i>
                  {voucher.vouch_date || getCurrDate()} {currentTime}
                </span>
                {voucher.vouch_status === 2 && (
                  <span className="text-sm bg-emerald-200 text-emerald-900 px-3 py-1 rounded-full font-bold">
                    <i className="bi bi-check2-square me-1"></i>
                    مرحل
                  </span>
                )}
              </h1>
            </div>
          </div>

          {/* البحث */}
          <div className="flex items-center gap-2">
            <Input
              className="w-40 h-8 text-sm border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              placeholder="بحث برقم القيد..."
              type="number"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button 
              size="sm"
              className="h-8 px-3 text-sm bg-slate-600 text-white hover:bg-slate-700 border border-slate-600 rounded-md shadow-sm font-medium"
              onPress={() => {
                if (searchTerm) {
                  const foundVoucher = vouchersList.find(v => v.id.toString() === searchTerm);
                  if (foundVoucher) {
                    router.push(`/dashboard/forms/voucher?id=${foundVoucher.id}`);
                  }
                }
              }}
            >
              <i className="bi bi-search text-sm"></i>
            </Button>
          </div>
        </div>

        {/* الصف الثاني: الأزرار والحالة */}
        <div className="flex items-center justify-between">
          {/* الأزرار من اليسار لليمين */}
          <div className="flex items-center gap-2">
            <Button
              className="h-8 px-4 text-sm bg-emerald-600 text-white hover:bg-emerald-700 border border-emerald-600 rounded-md shadow-sm font-medium"
              onClick={saveVoucher}
              isLoading={isLoading}
            >
              <i className="bi bi-check-circle me-1"></i>
              حفظ
            </Button>

            <Button
              className="h-8 px-4 text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm font-medium"
              onClick={() => router.push("/dashboard/forms/voucher")}
            >
              <i className="bi bi-pencil-square me-1"></i>
              تعديل
            </Button>

            <Button
              className="h-8 px-4 text-sm bg-blue-600 text-white hover:bg-blue-700 border border-blue-600 rounded-md shadow-sm font-medium"
              onClick={() => router.push("/dashboard/forms/voucher")}
            >
              <i className="bi bi-plus-circle me-1"></i>
              جديد
            </Button>

            <Button
              className="h-8 px-4 text-sm bg-slate-600 text-white hover:bg-slate-700 border border-slate-600 rounded-md shadow-sm font-medium"
              onClick={printVoucher}
              isLoading={isPrinting}
            >
              <i className="bi bi-printer me-1"></i>
              طباعة
            </Button>

            <Button
              className="h-8 px-4 text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm font-medium"
              onClick={onOpen}
            >
              <i className="bi bi-files me-1"></i>
              انشاء من قيد سابق
            </Button>

            {/* أزرار التنقل */}
            <div className="flex items-center gap-1 mr-2">
              <Button
                size="sm"
                className="h-8 w-8 text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm"
                onClick={() => navigateToVoucher('first')}
              >
                <i className="bi bi-chevron-double-right text-sm"></i>
              </Button>
              <Button
                size="sm"
                className="h-8 w-8 text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm"
                onClick={() => navigateToVoucher('prev')}
              >
                <i className="bi bi-chevron-right text-sm"></i>
              </Button>
              <span className="text-sm text-slate-600 px-3 font-medium">
                {currentRecord} من {totalRecords}
              </span>
              <Button
                size="sm"
                className="h-8 w-8 text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm"
                onClick={() => navigateToVoucher('next')}
              >
                <i className="bi bi-chevron-left text-sm"></i>
              </Button>
              <Button
                size="sm"
                className="h-8 w-8 text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm"
                onClick={() => navigateToVoucher('last')}
              >
                <i className="bi bi-chevron-double-left text-sm"></i>
              </Button>
            </div>
          </div>

          {/* حالة القيد */}
          <div className="flex items-center gap-3">
            <Checkbox
              isSelected={voucher.commit}
              isReadOnly
              color="success"
              size="sm"
            >
              <span className="text-xs text-slate-600">حُفظ</span>
            </Checkbox>
            
            <Checkbox
              isSelected={voucher.post}
              isReadOnly
              color="primary"
              size="sm"
            >
              <span className="text-xs text-slate-600">مرحل</span>
            </Checkbox>
            
            <Checkbox
              isSelected={voucher.print}
              isReadOnly
              color="warning"
              size="sm"
            >
              <span className="text-xs text-slate-600">طُبع</span>
            </Checkbox>
          </div>
        </div>
      </div>



      {/* تفاصيل القيد */}
      <div className="bg-white rounded-lg border border-slate-200 mb-4">

        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              label="رقم المرجع"
              value={voucher.ref_no || ""}
              onChange={(e) => {
                console.log("Setting ref_no to:", e.target.value);
                setVoucher(prev => ({ ...prev, ref_no: e.target.value }));
              }}
              className="text-sm"
              variant="bordered"
              size="sm"
              placeholder="أدخل رقم المرجع"
            />
            <Input
              label="تاريخ القيد"
              type="date"
              value={voucher.vouch_date}
              onChange={(e) => setVoucher(prev => ({ ...prev, vouch_date: e.target.value }))}
              className="text-sm"
              variant="bordered"
              size="sm"
            />
            <Input
              label="الوقت"
              value={currentTime}
              readOnly
              className="text-sm"
              variant="bordered"
              size="sm"
            />
            <Select
              label="حالة القيد"
              selectedKeys={voucher.vouch_status ? new Set([voucher.vouch_status.toString()]) : new Set()}
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0] as string;
                setVoucher(prev => ({ ...prev, vouch_status: parseInt(selectedKey) || 1 }));
              }}
              className="text-sm"
              variant="bordered"
              size="sm"
            >
              {voucherStatuses.map((status) => (
                <SelectItem key={status.id.toString()}>
                  {status.name}
                </SelectItem>
              ))}
            </Select>
            <Select
              label="نوع القيد"
              selectedKeys={new Set([voucher.vouch_type?.toString() || "3"])}
              onSelectionChange={async (keys) => {
                const selectedKey = Array.from(keys)[0] as string;
                const newType = parseInt(selectedKey);
                await updateVoucherType(newType);
              }}
              className="text-sm"
              variant="bordered"
              size="sm"
            >
              {voucherTypes.map((type) => (
                <SelectItem key={type.id.toString()}>
                  {type.name}
                </SelectItem>
              ))}
            </Select>
            <Input
              label="البيان"
              value={voucher.vouch_notes || ""}
              onChange={(e) => {
                console.log("Setting vouch_notes to:", e.target.value);
                setVoucher(prev => ({ ...prev, vouch_notes: e.target.value }));
              }}
              className="text-sm lg:col-span-2"
              variant="bordered"
              size="sm"
              placeholder="أدخل بيان القيد"
            />
          </div>
        </div>
      </div>

      {/* جدول تفاصيل القيد */}
      <div className="bg-white rounded-lg border border-slate-200 mb-4">
        <div className="p-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-800">تفاصيل القيد</h3>
          <div className="flex items-center gap-2">
            <button
              className="h-8 px-4 text-sm bg-blue-600 text-white hover:bg-blue-700 border border-blue-600 rounded-md shadow-sm font-medium"
              onClick={addDetailRow}
            >
              <i className="bi bi-plus-circle me-1"></i>
              إضافة صف
            </button>
            <span className={`text-xs px-2 py-1 rounded-full font-bold ${
              isBalanced 
                ? 'bg-emerald-200 text-emerald-900' 
                : 'bg-red-200 text-red-900'
            }`}>
              <i className={`bi ${isBalanced ? 'bi-check-circle' : 'bi-exclamation-triangle'} me-1`}></i>
              {isBalanced ? "متوازن" : "غير متوازن"}
            </span>
            
            {(() => {
              console.log("Balance status:", {
                isBalanced,
                totalDebit: totals.totalDebit,
                totalCredit: totals.totalCredit,
                balance: totals.totalDebit - totals.totalCredit,
                detailsCount: details.length
              });
              return null;
            })()}
          </div>
        </div>
                 <div className="p-4">
           <div className="overflow-x-auto mb-6 max-w-full">
             <table className="min-w-[1400px] border text-sm text-center table-fixed">
               <thead className="bg-gray-100 text-xs font-semibold">
                 <tr>
                   <th className="w-24 p-2 font-medium text-slate-700 border">رقم الحساب</th>
                   <th className="w-48 p-2 font-medium text-slate-700 border">اسم الحساب</th>
                   <th className="w-28 p-2 font-medium text-slate-700 border">مدين نقدي</th>
                   <th className="w-28 p-2 font-medium text-slate-700 border">دائن نقدي</th>
                   <th className="w-28 p-2 font-medium text-slate-700 border">مدين ذهب</th>
                   <th className="w-28 p-2 font-medium text-slate-700 border">دائن ذهب</th>
                   <th className="w-24 p-2 font-medium text-slate-700 border">المعايرة</th>
                   <th className="w-28 p-2 font-medium text-slate-700 border">قيمة الضريبة</th>
                   <th className="w-28 p-2 font-medium text-slate-700 border">نسبة الضريبة</th>
                   <th className="w-28 p-2 font-medium text-slate-700 border">الرقم الضريبي</th>
                   {costCenters.length > 0 && (
                     <th className="w-28 p-2 font-medium text-slate-700 border">مركز التكلفة</th>
                   )}
                   <th className="w-40 p-2 font-medium text-slate-700 border">البيان</th>
                   <th className="w-20 p-2 font-medium text-slate-700 border">حذف</th>
                 </tr>
               </thead>
              <tbody>
                {details.map((detail, index) => (
                  <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                     <td className="p-1 border">
                       <div className="text-xs text-slate-700 font-medium p-1 text-center">
                         {(() => {
                           const account = accounts.find(acc => acc.id === detail.acc_id);
                           return account ? account.acc_code : (detail.acc_id || '');
                         })()}
                       </div>
                     </td>
                     <td className="p-1 border">
                       <Select
                         selectedKeys={detail.acc_id ? new Set([detail.acc_id.toString()]) : new Set()}
                         onSelectionChange={(keys) => {
                           const selectedKey = Array.from(keys)[0] as string;
                           updateDetail(index, "acc_id", parseInt(selectedKey));
                         }}
                         size="sm"
                         className="w-full text-xs"
                         variant="bordered"
                         placeholder="اختر الحساب"
                         renderValue={(items) => {
                           const selectedAccount = accounts.find(acc => acc.id === detail.acc_id);
                           return selectedAccount ? (
                             <div className="text-xs text-slate-800 font-medium">
                               {selectedAccount.acc_name}
                             </div>
                           ) : (
                             <div className="text-xs text-slate-400">
                               {detail.acc_id ? `الحساب ${detail.acc_id}` : 'اختر الحساب'}
                             </div>
                           );
                         }}
                       >
                         {accounts.map((account) => (
                           <SelectItem key={account.id.toString()}>
                             {account.acc_code} - {account.acc_name}
                           </SelectItem>
                         ))}
                       </Select>
                     </td>
                                         <td className="p-1 border">
                       <input
                         ref={(el) => {
                           if (!inputRefs.current[index]) inputRefs.current[index] = [];
                           inputRefs.current[index][0] = el;
                         }}
                         value={String(detail.debit || 0)}
                         onChange={(e) => updateDetail(index, "debit", parseFloat(e.target.value) || 0)}
                         onKeyDown={(e) => handleKeyDown(e, index, 0)}
                         type="number"
                         step="0.01"
                         className="border w-full p-1 text-xs text-center appearance-none"
                         style={{ minWidth: 0, maxWidth: "100%" }}
                       />
                     </td>
                     <td className="p-1 border">
                       <input
                         ref={(el) => {
                           if (!inputRefs.current[index]) inputRefs.current[index] = [];
                           inputRefs.current[index][1] = el;
                         }}
                         value={String(detail.credit || 0)}
                         onChange={(e) => updateDetail(index, "credit", parseFloat(e.target.value) || 0)}
                         onKeyDown={(e) => handleKeyDown(e, index, 1)}
                         type="number"
                         step="0.01"
                         className="border w-full p-1 text-xs text-center appearance-none"
                         style={{ minWidth: 0, maxWidth: "100%" }}
                       />
                     </td>
                     <td className="p-1 border">
                       <input
                         ref={(el) => {
                           if (!inputRefs.current[index]) inputRefs.current[index] = [];
                           inputRefs.current[index][2] = el;
                         }}
                         value={String(detail.debit_g || 0)}
                         onChange={(e) => updateDetail(index, "debit_g", parseFloat(e.target.value) || 0)}
                         onKeyDown={(e) => handleKeyDown(e, index, 2)}
                         type="number"
                         step="0.01"
                         className="border w-full p-1 text-xs text-center appearance-none"
                         style={{ minWidth: 0, maxWidth: "100%" }}
                       />
                     </td>
                     <td className="p-1 border">
                       <input
                         ref={(el) => {
                           if (!inputRefs.current[index]) inputRefs.current[index] = [];
                           inputRefs.current[index][3] = el;
                         }}
                         value={String(detail.credit_g || 0)}
                         onChange={(e) => updateDetail(index, "credit_g", parseFloat(e.target.value) || 0)}
                         onKeyDown={(e) => handleKeyDown(e, index, 3)}
                         type="number"
                         step="0.01"
                         className="border w-full p-1 text-xs text-center appearance-none"
                         style={{ minWidth: 0, maxWidth: "100%" }}
                       />
                     </td>
                                                              <td className="p-1 border">
                       <input
                         ref={(el) => {
                           if (!inputRefs.current[index]) inputRefs.current[index] = [];
                           inputRefs.current[index][4] = el;
                         }}
                         value={String(detail.gauge || 875)}
                         onChange={(e) => updateDetail(index, "gauge", parseInt(e.target.value) || 875)}
                         onKeyDown={(e) => handleKeyDown(e, index, 4)}
                         type="number"
                         className="border w-full p-1 text-xs text-center appearance-none"
                         style={{ minWidth: 0, maxWidth: "100%" }}
                       />
                     </td>
                     <td className="p-1 border">
                       <input
                         ref={(el) => {
                           if (!inputRefs.current[index]) inputRefs.current[index] = [];
                           inputRefs.current[index][5] = el;
                         }}
                         value={String(detail.tax || 0)}
                         onChange={(e) => updateDetail(index, "tax", parseFloat(e.target.value) || 0)}
                         onKeyDown={(e) => handleKeyDown(e, index, 5)}
                         type="number"
                         step="0.01"
                         className="border w-full p-1 text-xs text-center appearance-none"
                         style={{ minWidth: 0, maxWidth: "100%" }}
                       />
                     </td>
                     <td className="p-1 border">
                       <input
                         ref={(el) => {
                           if (!inputRefs.current[index]) inputRefs.current[index] = [];
                           inputRefs.current[index][6] = el;
                         }}
                         value={String(detail.tax_prc || 0)}
                         onChange={(e) => updateDetail(index, "tax_prc", parseFloat(e.target.value) || 0)}
                         onKeyDown={(e) => handleKeyDown(e, index, 6)}
                         type="number"
                         step="0.01"
                         className="border w-full p-1 text-xs text-center appearance-none"
                         style={{ minWidth: 0, maxWidth: "100%" }}
                       />
                     </td>
                     <td className="p-1 border">
                       <input
                         ref={(el) => {
                           if (!inputRefs.current[index]) inputRefs.current[index] = [];
                           inputRefs.current[index][7] = el;
                         }}
                         value={String(detail.vat_no || 0)}
                         onChange={(e) => updateDetail(index, "vat_no", parseInt(e.target.value) || 0)}
                         onKeyDown={(e) => handleKeyDown(e, index, 7)}
                         type="number"
                         className="border w-full p-1 text-xs text-center appearance-none"
                         style={{ minWidth: 0, maxWidth: "100%" }}
                       />
                     </td>
                     {costCenters.length > 0 && (
                       <td className="p-1 border">
                         <Select
                           selectedKeys={detail.cost_id ? new Set([detail.cost_id.toString()]) : new Set()}
                           onSelectionChange={(keys) => {
                             const selectedKey = Array.from(keys)[0] as string;
                             updateDetail(index, "cost_id", parseInt(selectedKey));
                           }}
                           size="sm"
                           className="w-full text-xs"
                           variant="bordered"
                           placeholder="مركز التكلفة"
                           renderValue={(items) => {
                             const selectedCenter = costCenters.find(center => center.id === detail.cost_id);
                             console.log("Cost center lookup:", {
                               cost_id: detail.cost_id,
                               selectedCenter,
                               availableCenters: costCenters.map(c => ({ id: c.id, name: c.name }))
                             });
                             return selectedCenter ? (
                               <div className="text-xs text-slate-800 font-medium">
                                 {selectedCenter.name}
                               </div>
                             ) : (
                               <div className="text-xs text-slate-400">
                                 {detail.cost_id ? `مركز ${detail.cost_id}` : 'مركز التكلفة'}
                               </div>
                             );
                           }}
                         >
                           {costCenters.map((center) => (
                             <SelectItem key={center.id.toString()}>
                               {center.name}
                             </SelectItem>
                           ))}
                         </Select>
                       </td>
                     )}
                     <td className="p-1 border">
                       <input
                         ref={(el) => {
                           if (!inputRefs.current[index]) inputRefs.current[index] = [];
                           inputRefs.current[index][8] = el;
                         }}
                         value={detail.vouch_notes || ""}
                         onChange={(e) => updateDetail(index, "vouch_notes", e.target.value)}
                         onKeyDown={(e) => handleKeyDown(e, index, 8)}
                         type="text"
                         className="border w-full p-1 text-xs text-center appearance-none"
                         style={{ minWidth: 0, maxWidth: "100%" }}
                       />
                     </td>
                     <td className="p-1 border">
                       <button
                         className="h-7 w-7 text-xs bg-red-100 text-red-700 hover:bg-red-200 border border-red-300 rounded-md shadow-sm"
                         onClick={() => removeDetailRow(index)}
                       >
                         <i className="bi bi-trash text-xs"></i>
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
       <div className="mt-1 bg-gray-50 rounded-lg p-1 border border-gray-200">
         <div className="flex flex-wrap items-center gap-3 text-sm">
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
             <span className="text-gray-700 font-medium">إجمالي المدين المعاير:</span>
             <span className="font-semibold text-emerald-700 flex items-center gap-1">
               {formatAmount(totals.totalDebitG)}
               <RiyalIcon color="currentColor" />
             </span>
           </div>

           <div className="flex items-center gap-2">
             <span className="text-gray-700 font-medium">إجمالي الدائن المعاير:</span>
             <span className="font-semibold text-red-700 flex items-center gap-1">
               {formatAmount(totals.totalCreditG)}
               <RiyalIcon color="currentColor" />
             </span>
           </div>

           <div className="flex items-center gap-2">
             <span className="text-gray-700 font-medium">إجمالي الضريبة:</span>
             <span className="font-semibold text-green-700 flex items-center gap-1">
               {formatAmount(totals.totalTax)}
               <RiyalIcon color="currentColor" />
             </span>
           </div>

           <div className="flex items-center gap-2">
             <span className="text-gray-700 font-medium">نسبة الضريبة:</span>
             <span className="font-semibold text-green-700 flex items-center gap-1">
               {formatAmount(totals.totalTaxPrc)}%
             </span>
           </div>

           <div className="flex items-center gap-2">
             <span className="text-gray-800 font-semibold">حالة التوازن:</span>
             <span className={`font-bold flex items-center gap-1 px-3 py-1 rounded-full text-xs ${
               isBalanced 
                 ? 'bg-emerald-200 text-emerald-900' 
                 : 'bg-red-200 text-red-900'
             }`}>
               {isBalanced ? "متوازن" : `الفرق: ${formatAmount(Math.abs(balance))}`}
             </span>
           </div>
         </div>
       </div>

      {/* Modal for Previous Vouchers */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent className="bg-white rounded-lg">
          <ModalHeader className="bg-slate-50 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800">اختر قيد سابق</h3>
          </ModalHeader>
          <ModalBody className="p-4">
            <Input
              placeholder="بحث في القيود..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              startContent={<i className="bi bi-search text-slate-500"></i>}
              className="mb-4 text-sm"
              variant="bordered"
              size="sm"
            />
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-right p-2 font-medium text-slate-700">رقم القيد</th>
                    <th className="text-right p-2 font-medium text-slate-700">التاريخ</th>
                    <th className="text-right p-2 font-medium text-slate-700">النوع</th>
                    <th className="text-right p-2 font-medium text-slate-700">المبلغ</th>
                    <th className="text-right p-2 font-medium text-slate-700">الحالة</th>
                    <th className="text-right p-2 font-medium text-slate-700">إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {vouchersList
                    .filter(v => 
                      v.vouch_id.toString().includes(searchTerm) ||
                      v.vouch_date.includes(searchTerm) ||
                      v.vouch_notes?.includes(searchTerm)
                    )
                    .map((v) => (
                      <tr key={v.vouch_id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-2 text-slate-800">{v.vouch_id}</td>
                        <td className="p-2 text-slate-600">{v.vouch_date}</td>
                        <td className="p-2 text-slate-600">
                          {voucherTypes.find(t => t.id === v.vouch_type)?.name || 'غير محدد'}
                        </td>
                        <td className="p-2 text-slate-800">{formatAmount(v.vouch_amt || 0)}</td>
                        <td className="p-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            v.vouch_status === 2 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {voucherStatuses.find(s => s.id === v.vouch_status)?.name || 'غير محدد'}
                          </span>
                        </td>
                        <td className="p-2">
                          <Button
                            size="sm"
                            className="h-6 px-2 text-xs bg-blue-600 text-white hover:bg-blue-700 border border-blue-600 rounded-md shadow-sm"
                            onClick={() => {
                              setSelectedVoucher(v);
                              createFromPrevious();
                            }}
                          >
                            <i className="bi bi-check text-xs me-1"></i>
                            اختيار
                          </Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </ModalBody>
          <ModalFooter className="bg-slate-50 border-t border-slate-200">
            <Button 
              className="h-8 px-3 text-xs bg-red-600 text-white hover:bg-red-700 border border-red-600 rounded-md shadow-sm"
              onClick={onClose}
            >
              <i className="bi bi-x-circle me-1"></i>
              إلغاء
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
