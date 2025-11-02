"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import AsyncCreatableSelect from "react-select/async-creatable";
import toast from "react-hot-toast";

import { Voucher, VoucherDetail } from "@/types/voucher";
import { voucherService } from "@/services/api";
import {
  createVoucherAction,
  updateVoucherAction,
} from "@/app/actions/voucher.action";
import { searchAccountsAction } from "@/app/actions/accounts.action";
import { RiyalIcon } from "@/components/RiyalIcon";
import { formatAmount } from "@/utilities/formatAmount";
import { formatDateTime } from "@/utilities/dateUtils";

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
  caratTypes?: any[];
  taxRates?: number[];
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
  caratTypes: initialCaratTypes = [],
  taxRates: initialTaxRates = [],
  startInEditMode = false,
  vouchType = 2, // قيد تسوية
  formMode = "new",
  newVoucherHref,
}: VoucherClientPageProps) {
  const router = useRouter();
  const pathname = usePathname();
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
      opps_vouch: 0,
    },
  );

  const [currentTime, setCurrentTime] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [details, setDetails] = useState<VoucherDetail[]>(
    voucherDetailsData || [],
  );
  const [accounts, setAccounts] = useState<any[]>(initialAccounts);
  const [costCenters, setCostCenters] = useState<any[]>(initialCostCenters);
  const [voucherTypes, setVoucherTypes] = useState<any[]>(initialVoucherTypes);
  const [voucherStatuses, setVoucherStatuses] = useState<any[]>(
    initialVoucherStatuses || [],
  );

  // التأكد من تحديث voucherStatuses عند تغيير initialVoucherStatuses
  useEffect(() => {
    if (initialVoucherStatuses && Array.isArray(initialVoucherStatuses)) {
      setVoucherStatuses(initialVoucherStatuses);
    }
  }, [initialVoucherStatuses]);
  const [caratTypes, setCaratTypes] = useState<any[]>(initialCaratTypes);
  const [taxRates, setTaxRates] = useState<number[]>(initialTaxRates);
  const [isLoading, setIsLoading] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(1);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
  const [vouchersList, setVouchersList] = useState<any[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(startInEditMode);
  const [defaultAccountOptions, setDefaultAccountOptions] = useState<any[]>([]);
  const [originalDetails, setOriginalDetails] = useState<VoucherDetail[]>([]);

  // Initialize component
  useEffect(() => {
    setIsClient(true);
    updateCurrentTime();
    if (isNewVoucher) {
      generateNextVoucherNumber();
      // في وضع new، نبدأ بسطرين على الأقل
      setDetails((prev) => {
        if (prev.length === 0) {
          // إضافة سطرين جديدين
          const newDetail1: VoucherDetail = {
            id: 0,
            vouch_id: voucher.vouch_id,
            acc_id: 0,
            acc_code: "",
            acc_name: "",
            debit: undefined,
            credit: undefined,
            debit_g: undefined,
            credit_g: undefined,
            gauge: 875,
            cost_id: 0,
            vouch_notes: "",
            cr_date: new Date().toISOString(),
          };
          const newDetail2: VoucherDetail = {
            ...newDetail1,
          };

          return [newDetail1, newDetail2];
        } else if (prev.length === 1) {
          // إضافة سطر واحد إضافي
          const newDetail: VoucherDetail = {
            id: 0,
            vouch_id: voucher.vouch_id,
            acc_id: 0,
            acc_code: "",
            acc_name: "",
            debit: undefined,
            credit: undefined,
            debit_g: undefined,
            credit_g: undefined,
            gauge: 875,
            cost_id: 0,
            vouch_notes: "",
            cr_date: new Date().toISOString(),
          };

          return [...prev, newDetail];
        }

        return prev;
      });
    } else {
      // حفظ نسخة من التفاصيل الأصلية للمقارنة
      setOriginalDetails(voucherDetailsData || []);
      // إذا كان عدد التفاصيل أقل من 2، نضيف الصفوف المتبقية
      setDetails((prev) => {
        if (prev.length < 2) {
          const neededRows = 2 - prev.length;
          const newRows: VoucherDetail[] = [];

          for (let i = 0; i < neededRows; i++) {
            newRows.push({
              id: 0,
              vouch_id: voucher.vouch_id || prev[0]?.vouch_id || 0,
              acc_id: 0,
              acc_code: "",
              acc_name: "",
              debit: undefined,
              credit: undefined,
              debit_g: undefined,
              credit_g: undefined,
              gauge: 875,
              cost_id: 0,
              vouch_notes: "",
              cr_date: new Date().toISOString(),
            });
          }

          return [...prev, ...newRows];
        }

        return prev;
      });
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

  // Load default account options
  useEffect(() => {
    const loadDefaultAccounts = () => {
      const options = accounts.slice(0, 50).map((acc) => ({
        value: acc.id,
        label: `${acc.acc_code ?? acc.code ?? ""} - ${acc.acc_name ?? acc.name ?? ""}`,
        account: acc,
      }));

      setDefaultAccountOptions(options);
      console.log("Default account options loaded:", options.length);
    };

    if (accounts.length > 0) {
      loadDefaultAccounts();
    }
  }, [accounts]);

  // Debug voucher types
  useEffect(() => {
    console.log("Voucher Types in component:", voucherTypes);
    console.log("Voucher Statuses in component:", voucherStatuses);
  }, [voucherTypes, voucherStatuses]);

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
      // جلب فقط قيود التسوية (vouch_type = 3)
      const response = await voucherService.getAll({
        xvouch_type: "3", // قيود التسوية فقط
        xcom_id: "1",
        xyear_id: "0", // جميع السنوات
      });

      if (response.success && response.data && Array.isArray(response.data)) {
        // تصفية إضافية للتأكد (فقط قيود التسوية)
        const settlementVouchers = response.data.filter(
          (v: any) => v.vouch_type === 3,
        );
        setVouchersList(settlementVouchers);
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
          const detailsResponse =
            await voucherService.getDetails(voucherVouchId);

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
                gauge: detail.gauge,
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
      const targetId = targetVoucher.id || targetVoucher.vouch_id;

      if (targetId) {
        // التوجيه إلى وضع preview (استعراض فقط)
        router.push(`/forms/voucher/${targetId}?mode=preview`);
      }
    }
  };

  const addDetailRow = () => {
    const newDetail: VoucherDetail = {
      id: 0,
      vouch_id: voucher.vouch_id,
      acc_id: 0,
      acc_code: "",
      acc_name: "",
      debit: undefined,
      credit: undefined,
      debit_g: undefined,
      credit_g: undefined,
      gauge: 875,
      cost_id: 0,
      vouch_notes: "",
      cr_date: new Date().toISOString(),
    };

    setDetails((prev) => [...prev, newDetail]);

    // إعادة تعيين التحقق البصري عند إضافة صف جديد
    setShowValidationErrors(false);
  };

  const removeDetailRow = (index: number) => {
    // منع الحذف إذا كان عدد الصفوف 2 أو أقل
    if (details.length <= 2) {
      toast.error("يجب أن يكون هناك سطرين على الأقل في تفاصيل القيد");

      return;
    }
    setDetails((prev) => prev.filter((_, i) => i !== index));
  };

  const updateDetail = (
    index: number,
    field: keyof VoucherDetail,
    value: any,
  ) => {
    setDetails((prev) => {
      const updated = prev.map((detail, i) => {
        if (i !== index) return detail;

        const newDetail = { ...detail, [field]: value };

        // تصفير الحقل المقابل تلقائياً
        if (field === "debit" && parseFloat(value) > 0) {
          newDetail.credit = undefined;
        } else if (field === "credit" && parseFloat(value) > 0) {
          newDetail.debit = undefined;
        } else if (field === "debit_g" && parseFloat(value) > 0) {
          newDetail.credit_g = undefined;
        } else if (field === "credit_g" && parseFloat(value) > 0) {
          newDetail.debit_g = undefined;
        }

        // عند اختيار الحساب، جلب المعايرة من caratTypes
        if (field === "acc_id" && value) {
          const selectedAccount = accounts.find((acc) => acc.id === value);

          if (selectedAccount && caratTypes.length > 0) {
            // البحث عن المعايرة المرتبطة بالحساب (يمكن أن تكون في خاصية gauge أو carat)
            const accountGauge = selectedAccount.gauge || selectedAccount.carat;

            if (accountGauge) {
              const matchedCaratType = caratTypes.find(
                (ct: any) =>
                  ct.id === accountGauge ||
                  ct.gauge === accountGauge ||
                  ct.value === accountGauge,
              );

              if (matchedCaratType) {
                newDetail.gauge =
                  matchedCaratType.gauge ||
                  matchedCaratType.value ||
                  matchedCaratType.id ||
                  875;
              } else {
                newDetail.gauge = accountGauge;
              }
            } else {
              // افتراضياً 875 إذا لم توجد معايرة
              newDetail.gauge = 875;
            }
          }
        }


        return newDetail;
      });

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
        const debit =
          detail.debit !== undefined
            ? parseFloat(String(detail.debit)) || 0
            : 0;
        const credit =
          detail.credit !== undefined
            ? parseFloat(String(detail.credit)) || 0
            : 0;
        const debitG =
          detail.debit_g !== undefined
            ? parseFloat(String(detail.debit_g)) || 0
            : 0;
        const creditG =
          detail.credit_g !== undefined
            ? parseFloat(String(detail.credit_g)) || 0
            : 0;
        return {
          totalDebit: totals.totalDebit + debit,
          totalCredit: totals.totalCredit + credit,
          totalDebitG: totals.totalDebitG + debitG,
          totalCreditG: totals.totalCreditG + creditG,
        };
      },
      {
        totalDebit: 0,
        totalCredit: 0,
        totalDebitG: 0,
        totalCreditG: 0,
      },
    );

    return totals;
  }, [details]);

  const totals = calculateTotals();
  const cashBalance = totals.totalDebit - totals.totalCredit;
  const goldBalance = totals.totalDebitG - totals.totalCreditG;
  const isCashBalanced = Math.abs(cashBalance) < 0.01;
  const isGoldBalanced = Math.abs(goldBalance) < 0.01;
  const isBalanced = isCashBalanced && isGoldBalanced;

  const saveVoucher = async () => {
    // تفعيل التحقق البصري عند محاولة الحفظ
    setShowValidationErrors(true);

    // التحقق من التاريخ - منع التواريخ المستقبلية
    const voucherDate = new Date(voucher.vouch_date);
    const today = new Date();

    today.setHours(23, 59, 59, 999); // نهاية اليوم

    if (voucherDate > today) {
      toast.error("لا يمكن إنشاء قيد بتاريخ أكبر من تاريخ اليوم");

      return;
    }

    if (!isCashBalanced) {
      toast.error("يجب أن يكون إجمالي المدين مساوي لإجمالي الدائن (نقداً)");

      return;
    }

    if (!isGoldBalanced) {
      toast.error("يجب أن يكون إجمالي المدين مساوي لإجمالي الدائن (ذهباً)");

      return;
    }

    if (details.length === 0) {
      toast.error("يجب إضافة تفاصيل للقيد");

      return;
    }

    // التحقق من وجود حسابات فارغة
    const emptyAccountDetails = details.filter(
      (detail) => !detail.acc_id || detail.acc_id === 0,
    );

    if (emptyAccountDetails.length > 0) {
      toast.error("يرجى اختيار حساب لجميع الصفوف قبل الحفظ");

      return;
    }

    // التحقق من وجود حسابات صحيحة على الأقل
    const validDetails = details.filter(
      (detail) => detail.acc_id && detail.acc_id > 0,
    );

    if (validDetails.length === 0) {
      toast.error("يرجى إدخال حساب صحيح على الأقل");

      return;
    }

    if (
      !voucher.vouch_id ||
      voucher.vouch_id <= 0 ||
      !isFinite(voucher.vouch_id)
    ) {
      toast.error("خطأ: رقم القيد غير صحيح. يرجى إعادة تحميل الصفحة.");

      return;
    }

    setIsLoading(true);
    try {
      const voucherData = {
        vouch_id: voucher.vouch_id,
        vouch_date: voucher.vouch_date,
        vouch_type: voucher.vouch_type,
        vouch_amt: 0, // إبقاء المبلغ الإجمالي 0 دائماً
        vouch_notes: voucher.vouch_notes || "",
        vouch_status: voucher.vouch_status || 1,
        pay_type: voucher.pay_type,
        ref_no: voucher.ref_no || "",
        opps_vouch: voucher.opps_vouch || 0, // حفظ قيمة opps_vouch من API
      };

      const detailsData = details
        .filter((detail) => detail.acc_id && detail.acc_id > 0)
        .map((detail) => ({
          id: detail.id || 0, // استخدام id الموجود للتحديث أو 0 للجديد
          vouch_id: voucher.vouch_id,
          acc_id: detail.acc_id,
          debit: detail.debit,
          credit: detail.credit,
          debit_g: detail.debit_g,
          credit_g: detail.credit_g,
          gauge: detail.gauge,
          vouch_notes: detail.vouch_notes || "",
          cost_id: detail.cost_id || null,
        }));

      // تحديد التفاصيل المحذوفة
      const currentDetailIds = detailsData
        .map((d) => d.id)
        .filter((id) => id > 0);
      const originalDetailIds = originalDetails
        .map((d) => d.id)
        .filter((id) => id && id > 0) as number[];
      const deletedDetailIds = originalDetailIds.filter(
        (id) => !currentDetailIds.includes(id),
      );

      // اختيار الدالة المناسبة حسب الوضع
      console.log("🔍 معلومات الحفظ:");
      console.log("- الوضع:", formMode);
      console.log("- معرف القيد:", voucher.vouch_id);
      console.log("- معرف القيد الحقيقي:", voucherRecordId || voucher.id);
      console.log("- بيانات القيد:", voucherData);
      console.log("- عدد التفاصيل:", detailsData.length);
      console.log("- التفاصيل المحذوفة:", deletedDetailIds);

      const result =
        formMode === "edit"
          ? await updateVoucherAction(
              voucherData,
              detailsData,
              deletedDetailIds,
            )
          : await createVoucherAction(voucherData, detailsData);

      if (result.success && result.data) {
        // الحصول على id الحقيقي من قاعدة البيانات (primary key)
        const realId = result.data.id;
        // الحصول على vouch_id (رقم القيد المعروض)
        const vouchId = result.data.vouch_id || voucher.vouch_id;

        // تحديث حالة القيد
        setVoucher((prev) => ({
          ...prev,
          commit: true,
          id: realId,
          vouch_id: vouchId,
        }));

        toast.success(result.message);

        // إعادة التوجيه حسب الوضع
        // بعد الحفظ، نوجه المستخدم إلى صفحة preview (استعراض فقط) باستخدام id الحقيقي
        // الحقول ستكون مقفلة حتى يضغط المستخدم على زر "تعديل"
        if (realId) {
          // استخدام id الحقيقي من قاعدة البيانات (primary key)
          // التوجيه إلى صفحة preview بدلاً من edit
          // يمكن إضافة query param للتمييز أو استخدام route مختلف
          // لكن حالياً سنستخدم نفس الـ route مع formMode=preview
          router.push(`/forms/voucher/${realId}?mode=preview`);
        } else if (vouchId) {
          // إذا لم يكن realId متوفراً، البحث عن القيد باستخدام vouch_id
          console.warn("No real ID found, searching by vouch_id:", vouchId);
          try {
            const vouchersResponse = await voucherService.getAll();

            if (vouchersResponse.success && vouchersResponse.data) {
              const foundVoucher = vouchersResponse.data.find(
                (v: any) => v.vouch_id === vouchId,
              );

              if (foundVoucher?.id) {
                router.push(`/forms/voucher/${foundVoucher.id}?mode=preview`);
              } else {
                // إذا لم نجد القيد، نعود إلى صفحة القائمة
                router.push(`/forms/voucher`);
              }
            }
          } catch (searchError) {
            console.error("Error searching for voucher:", searchError);
            router.push(`/forms/voucher`);
          }
        } else {
          // إذا لم يكن هناك أي معرف، العودة إلى صفحة القائمة
          router.push(`/forms/voucher`);
        }
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error(
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
        // تنسيق التاريخ
        const formattedDate = voucher.vouch_date
          ? new Date(voucher.vouch_date).toLocaleDateString("ar-SA", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "";

        // فلترة التفاصيل التي تحتوي على حسابات
        const validDetails = details.filter((d) => d.acc_id && d.acc_id > 0);

        printWindow.document.write(`
          <html dir="rtl">
            <head>
              <meta charset="UTF-8">
              <title>قيد تسوية - ${voucher.vouch_id}</title>
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
                
                table {
                  width: 100%;
                  border-collapse: separate;
                  border-spacing: 0;
                  margin: 25px 0;
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
                
                .amount-debit {
                  color: #059669;
                }
                
                .amount-credit {
                  color: #dc2626;
                }
                
                .amount-gold {
                  color: #d97706;
                  font-weight: 600;
                }
                
                .gauge {
                  font-family: 'Courier New', monospace;
                  color: #7c3aed;
                  font-weight: 500;
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
                <h1>قيد تسوية</h1>
                <div class="header-info">
                  <div class="header-info-item">
                    <span class="header-info-label">رقم القيد</span>
                    <span class="header-info-value">${voucher.vouch_id || "-"}</span>
              </div>
                  <div class="header-info-item">
                    <span class="header-info-label">التاريخ</span>
                    <span class="header-info-value">${formattedDate}</span>
                  </div>
                  <div class="header-info-item">
                    <span class="header-info-label">عدد البنود</span>
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
              
              <table>
                <thead>
                  <tr>
                    <th>رقم الحساب</th>
                    <th>اسم الحساب</th>
                    <th>مدين</th>
                    <th>دائن</th>
                    <th>مدين معاير</th>
                    <th>دائن معاير</th>
                    <th>المعايرة</th>
                    <th>البيان</th>
                  </tr>
                </thead>
                <tbody>
                  ${validDetails
                    .map((detail) => {
                      const account = accounts.find(
                        (acc) => acc.id === detail.acc_id,
                      );
                      const debit = detail.debit || 0;
                      const credit = detail.credit || 0;
                      const debitG = detail.debit_g || 0;
                      const creditG = detail.credit_g || 0;
                      const gauge = detail.gauge || 875;

                      return `
                      <tr>
                        <td class="account-code">${account?.acc_code || "-"}</td>
                        <td class="account-name">${account?.acc_name || "-"}</td>
                        <td class="amount amount-debit">${debit > 0 ? formatAmount(debit) : "-"}</td>
                        <td class="amount amount-credit">${credit > 0 ? formatAmount(credit) : "-"}</td>
                        <td class="amount amount-gold">${debitG > 0 ? formatAmount(debitG) : "-"}</td>
                        <td class="amount amount-gold">${creditG > 0 ? formatAmount(creditG) : "-"}</td>
                        <td class="gauge">${gauge}</td>
                        <td style="text-align: right; font-size: 11px; color: #718096;">${detail.vouch_notes || "-"}</td>
                      </tr>
                    `;
                    })
                    .join("")}
                  <tr class="totals">
                    <td colspan="2" style="text-align: right; padding-right: 20px; font-weight: 700;">الإجمالي</td>
                    <td class="amount amount-debit">${formatAmount(totals.totalDebit)}</td>
                    <td class="amount amount-credit">${formatAmount(totals.totalCredit)}</td>
                    <td class="amount amount-gold">${formatAmount(totals.totalDebitG)}</td>
                    <td class="amount amount-gold">${formatAmount(totals.totalCreditG)}</td>
                    <td></td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
              
              <div class="footer">
                <p>تم طباعة هذا القيد بتاريخ ${new Date().toLocaleDateString("ar-SA")} - نظام NafeesWeb</p>
              </div>
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

  const handleSearch = async () => {
    if (!searchTerm || searchTerm.trim() === "") {
      toast.error("يرجى إدخال رقم القيد للبحث");

      return;
    }

    const searchValue = searchTerm.trim();

    try {
      // أولاً: البحث في قيود التسوية فقط باستخدام xvouch_type و xvouch_id
      const vouchersResponse = await voucherService.getAll({
        xvouch_type: vouchType.toString(), // 3 = قيد تسوية
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

        // إذا لم نجد مطابقة دقيقة، نبحث عن قيود تحتوي على الرقم
        if (!foundVoucher) {
          foundVoucher = vouchers.find(
            (v: any) =>
              v.vouch_id?.toString().includes(searchValue) ||
              v.id?.toString().includes(searchValue),
          );
        }

        if (foundVoucher) {
          // استخدام id الحقيقي (primary key) للانتقال إلى صفحة القيد
          const targetId = foundVoucher.id || foundVoucher.vouch_id;

          if (targetId) {
            router.push(`/forms/voucher/${targetId}?mode=preview`);
            setSearchTerm(""); // مسح حقل البحث

            return;
          }
        }
      }

      // إذا لم نجد في قيود التسوية، نبحث في جميع أنواع القيود
      console.log("لم يتم العثور على قيد تسوية، البحث في جميع القيود...");
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
          // التحقق من نوع القيد
          if (foundAny.vouch_type !== vouchType) {
            toast.error(
              `القيد الموجود (${foundAny.vouch_id}) ليس من نوع قيد تسوية`,
            );

            return;
          }

          const targetId = foundAny.id || foundAny.vouch_id;

          if (targetId) {
            router.push(`/forms/voucher/${targetId}?mode=preview`);
            setSearchTerm("");

            return;
          }
        }
      }

      // إذا لم نجد القيد نهائياً
      toast.error(`لم يتم العثور على قيد تسوية برقم: ${searchValue}`);
    } catch (error) {
      console.error("Error searching voucher:", error);
      toast.error("حدث خطأ أثناء البحث. يرجى المحاولة مرة أخرى");
    }
  };

  const createFromPrevious = async (voucher?: any) => {
    const voucherToUse = voucher || selectedVoucher;

    if (!voucherToUse || !voucherToUse.id) {
      toast.error("يرجى اختيار قيد سابق");

      return;
    }

    try {
      setIsModalOpen(false);
      setIsLoading(true);

      // جلب تفاصيل القيد المحدد
      const detailsResponse = await voucherService.getDetails(
        voucherToUse.id,
      );

      if (
        detailsResponse.success &&
        detailsResponse.data &&
        Array.isArray(detailsResponse.data)
      ) {
        // تحديث بيانات القيد
        setVoucher({
          ...voucherToUse,
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
          vouch_notes: detail.vouch_notes || "",
          cr_date: new Date().toISOString(),
        }));

        setDetails(formattedDetails);

        // توليد رقم قيد جديد
        const nextId = await voucherService.getNextNumber(
          voucherToUse.vouch_type,
        );

        setVoucher((prev) => ({
          ...prev,
          vouch_id: nextId,
        }));

        // إعادة تعيين البحث
        setSearchTerm("");
        setSelectedVoucher(null);
      } else {
        toast.error("حدث خطأ أثناء تحميل تفاصيل القيد");
      }
    } catch (error) {
      console.error("Error creating from previous voucher:", error);
      toast.error("حدث خطأ أثناء نسخ القيد");
    } finally {
      setIsLoading(false);
    }
  };

  const allowEditing = formMode === "edit" || formMode === "new";

  useEffect(() => {
    // تحديد وضع التعديل بناءً على formMode
    if (formMode === "preview") {
      // في وضع preview، الحقول مقفلة دائماً
      setIsEditing(false);
    } else if (formMode === "new") {
      // في وضع new، الحقول قابلة للتعديل دائماً
      setIsEditing(true);
    } else if (formMode === "edit") {
      // في وضع edit، نستخدم startInEditMode
      setIsEditing(startInEditMode !== false);
    }
  }, [formMode, startInEditMode]);

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
                    {voucherTypes.find(
                      (t) => (t.Id || t.id) === voucher.vouch_type,
                    )?.name ||
                      voucherTypes.find(
                        (t) => (t.Id || t.id) === voucher.vouch_type,
                      )?.["Code Desc"] ||
                      "قيد تسوية"}
                  </span>
                  <span className="text-slate-600 font-medium">
                    #
                    {voucher.vouch_id &&
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
                title={
                  formMode === "new"
                    ? "لا يمكن التعديل في وضع جديد"
                    : isEditing
                      ? "أنت بالفعل في وضع التعديل"
                      : "تعديل القيد"
                }
                onClick={() => {
                  // عند فتح وضع التعديل، نلغي commit (تصبح false) حتى يتم الحفظ
                  setVoucher((prev) => ({
                    ...prev,
                    commit: false,
                  }));

                  // تغيير الـ URL إلى وضع edit
                  if (pathname) {
                    // إذا كنا في صفحة [id]، نضيف mode=edit
                    if (
                      pathname.startsWith("/forms/voucher/") &&
                      pathname !== "/forms/voucher"
                    ) {
                      router.push(`${pathname}?mode=edit`);
                    } else {
                      // إذا كنا في صفحة أخرى، نستخدم searchParams
                      const currentUrl = new URL(window.location.href);

                      currentUrl.searchParams.set("mode", "edit");
                      router.push(currentUrl.pathname + currentUrl.search);
                    }
                  }
                }}
              >
                <i className="bi bi-pencil-square w-4 h-4 me-1" />
                تعديل
              </button>

              {/* زر "جديد" */}
              <button
                className="h-7 px-3 text-xs bg-blue-600 text-white hover:bg-blue-700 border border-blue-600 rounded-md shadow-sm"
                onClick={() => {
                  // الانتقال إلى صفحة جديدة
                  router.push(newVoucherHref || "/forms/voucher");
                }}
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
                  className={`text-sm border border-slate-300 rounded-md px-3 py-2 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 ${!isEditing ? "cursor-not-allowed" : ""}`}
                  disabled={!isEditing}
                  placeholder="أدخل رقم المرجع"
                  readOnly={!isEditing}
                  value={voucher.ref_no || ""}
                  onChange={(e) =>
                    setVoucher((prev) => ({ ...prev, ref_no: e.target.value }))
                  }
                />
              </div>

              {/* تاريخ ووقت القيد */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">
                  تاريخ ووقت القيد
                </label>
                <input
                  className={`text-sm border border-slate-300 rounded-md px-3 py-2 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 ${!isEditing ? "cursor-not-allowed" : ""}`}
                  disabled={!isEditing}
                  max={new Date().toISOString().slice(0, 16)}
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
                      vouch_date: e.target.value,
                    }))
                  }
                />
              </div>

              {/* حالة القيد */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">
                  حالة القيد
                </label>
                <select
                  className={`text-sm border border-slate-300 rounded-md px-3 py-2 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 ${!isEditing ? "cursor-not-allowed" : ""}`}
                  disabled={!isEditing}
                  value={String(voucher.vouch_status ?? 1)}
                  onChange={(e) =>
                    setVoucher((prev) => ({
                      ...prev,
                      vouch_status: parseInt(e.target.value),
                    }))
                  }
                >
                  {voucherStatuses && Array.isArray(voucherStatuses) && voucherStatuses.length > 0 ? (
                    voucherStatuses.map((status) => {
                      const statusValue = status.code_id !== undefined && status.code_id !== null 
                        ? String(status.code_id) 
                        : String(status.id || status.Id || "");
                      const statusLabel = status.code_desc || status["Code Desc"] || status.name || `حالة ${status.code_id ?? (status.id || status.Id)}`;
                      
                      return (
                        <option
                          key={status.id || status.Id}
                          value={statusValue}
                        >
                          {statusLabel}
                        </option>
                      );
                    })
                  ) : (
                    <>
                      <option value="0">ملغي</option>
                      <option value="1">فعال</option>
                      <option value="2">معلق</option>
                      <option value="3">غير مكتمل</option>
                    </>
                  )}
                </select>
              </div>

              {/* نوع القيد */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">
                  نوع القيد
                </label>
                <select
                  className={`text-sm border border-slate-300 rounded-md px-3 py-2 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 ${!isEditing ? "cursor-not-allowed" : ""}`}
                  disabled={!isEditing}
                  value={voucher.vouch_type || 2}
                  onChange={(e) => updateVoucherType(parseInt(e.target.value))}
                >
                  {voucherTypes && voucherTypes.length > 0 ? (
                    voucherTypes.map((type) => (
                      <option
                        key={type.Id || type.id}
                        value={type.Id || type.id}
                      >
                        {type.name ||
                          type["Code Desc"] ||
                          type.type_name ||
                          `نوع ${type.Id || type.id}`}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="1">قيد يومية</option>
                      <option value="2">قيد عكسي</option>
                      <option value="3">قيد تسوية</option>
                      <option value="4">قيد فوارق عملة</option>
                      <option value="5">قيد فوارق مخزون</option>
                      <option value="6">قيد مرتبات</option>
                    </>
                  )}
                </select>
              </div>

              {/* البيان */}
              <div className="flex flex-col gap-1 lg:col-span-2">
                <label className="text-sm font-medium text-slate-700">
                  البيان
                </label>
                <input
                  className={`text-sm border border-slate-300 rounded-md px-3 py-2 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 ${!isEditing ? "cursor-not-allowed" : ""}`}
                  disabled={!isEditing}
                  placeholder="أدخل بيان القيد"
                  readOnly={!isEditing}
                  value={voucher.vouch_notes || ""}
                  onChange={(e) =>
                    setVoucher((prev) => ({
                      ...prev,
                      vouch_notes: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* جدول تفاصيل القيد */}
        <div className="bg-white rounded-lg border border-slate-200 mb-4">
          <div className="p-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-800">
              تفاصيل القيد
            </h3>
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
                {isBalanced ? "متزن" : "غير متزن"}
                {!isBalanced && (
                  <span className="block text-xs mt-1">
                    {!isCashBalanced && "نقد"}
                    {!isCashBalanced && !isGoldBalanced && " + "}
                    {!isGoldBalanced && "ذهب"}
                  </span>
                )}
              </span>
            </div>
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
            {/* رسالة تحذيرية للحسابات الفارغة - تظهر فقط بعد محاولة الحفظ */}
            {showValidationErrors &&
              details.some(
                (detail) => !detail.acc_id || detail.acc_id === 0,
              ) && (
                <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                  ⚠️ يرجى اختيار حساب لجميع الصفوف قبل الحفظ
                </div>
              )}

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
                      className="w-40 p-0.5 font-bold text-slate-700 border"
                      rowSpan={2}
                    >
                      مركز التكلفة
                    </th>
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
                      className={`border-b border-slate-100 hover:bg-slate-50 ${
                        showValidationErrors &&
                        (!detail.acc_id || detail.acc_id === 0)
                          ? "bg-red-50 border-red-200"
                          : ""
                      }`}
                    >
                      <td className="p-0 border">
                        <AsyncCreatableSelect
                          isClearable
                          isSearchable
                          className="text-xs"
                          classNamePrefix="select"
                          components={{ IndicatorSeparator: () => null }}
                          defaultOptions={defaultAccountOptions}
                          formatCreateLabel={(inputValue) =>
                            `إضافة حساب جديد: "${inputValue}"`
                          }
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

                            // إعادة تعيين التحقق البصري عند اختيار حساب
                            if (showValidationErrors && selected.id) {
                              setShowValidationErrors(false);
                            }
                          }}
                        />
                      </td>

                      <td className="p-0 border">
                        <input
                          className={`w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0 ${!isEditing ? "cursor-not-allowed" : ""}`}
                          disabled={!isEditing}
                          min="0"
                          placeholder="0.00"
                          readOnly={!isEditing}
                          step="0.01"
                          style={{
                            MozAppearance: "textfield",
                            WebkitAppearance: "none",
                            appearance: "none",
                          }}
                          type="number"
                          value={detail.debit ? String(detail.debit) : ""}
                          onChange={(e) => {
                            const val = e.target.value;

                            if (!val || parseFloat(val) >= 0) {
                              updateDetail(
                                index,
                                "debit",
                                val ? parseFloat(val) : undefined,
                              );
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
                          className={`w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0 ${!isEditing ? "cursor-not-allowed" : ""}`}
                          disabled={!isEditing}
                          min="0"
                          placeholder="0.00"
                          readOnly={!isEditing}
                          step="0.01"
                          style={{
                            MozAppearance: "textfield",
                            WebkitAppearance: "none",
                            appearance: "none",
                          }}
                          type="number"
                          value={detail.credit ? String(detail.credit) : ""}
                          onChange={(e) => {
                            const val = e.target.value;

                            if (!val || parseFloat(val) >= 0) {
                              updateDetail(
                                index,
                                "credit",
                                val ? parseFloat(val) : undefined,
                              );
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
                          className={`w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0 ${!isEditing ? "cursor-not-allowed" : ""}`}
                          disabled={!isEditing}
                          min="0"
                          placeholder="0.00"
                          readOnly={!isEditing}
                          step="0.01"
                          style={{
                            MozAppearance: "textfield",
                            WebkitAppearance: "none",
                            appearance: "none",
                          }}
                          type="number"
                          value={detail.debit_g ? String(detail.debit_g) : ""}
                          onChange={(e) => {
                            const val = e.target.value;

                            if (!val || parseFloat(val) >= 0) {
                              updateDetail(
                                index,
                                "debit_g",
                                val ? parseFloat(val) : undefined,
                              );
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
                          className={`w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0 ${!isEditing ? "cursor-not-allowed" : ""}`}
                          disabled={!isEditing}
                          min="0"
                          placeholder="0.00"
                          readOnly={!isEditing}
                          step="0.01"
                          style={{
                            MozAppearance: "textfield",
                            WebkitAppearance: "none",
                            appearance: "none",
                          }}
                          type="number"
                          value={detail.credit_g ? String(detail.credit_g) : ""}
                          onChange={(e) => {
                            const val = e.target.value;

                            if (!val || parseFloat(val) >= 0) {
                              updateDetail(
                                index,
                                "credit_g",
                                val ? parseFloat(val) : undefined,
                              );
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
                          readOnly
                          className="w-full h-full text-xs border-0 rounded-none text-center cursor-not-allowed"
                          placeholder="875"
                          type="text"
                          value={String(detail.gauge || 875)}
                        />
                      </td>

                      <td className="p-0 border">
                        <select
                          className={`w-full h-full text-xs border-0 rounded-none focus:outline-none focus:ring-0 ${!isEditing ? "cursor-not-allowed" : ""}`}
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

                      <td className="p-0 border">
                        <input
                          className={`w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0 ${!isEditing ? "cursor-not-allowed" : ""}`}
                          disabled={!isEditing}
                          placeholder="البيان"
                          readOnly={!isEditing}
                          type="text"
                          value={detail.vouch_notes || ""}
                          onChange={(e) =>
                            updateDetail(index, "vouch_notes", e.target.value)
                          }
                        />
                      </td>

                      <td className="p-1 border">
                        <button
                          className={`font-bold ${
                            details.length <= 2
                              ? "text-gray-400 cursor-not-allowed"
                              : "text-red-600"
                          }`}
                          disabled={!isEditing || details.length <= 2}
                          tabIndex={-1}
                          title={
                            details.length <= 2
                              ? "يجب أن يكون هناك سطرين على الأقل"
                              : "حذف السطر"
                          }
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
              <span className="text-amber-800 font-medium">
                إجمالي المدين المعاير:
              </span>
              <span className="font-semibold text-yellow-600 flex items-center gap-1">
                {formatAmount(totals.totalDebitG)}
                <span className="text-xs text-yellow-500">جم</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-amber-800 font-medium">
                إجمالي الدائن المعاير:
              </span>
              <span className="font-semibold text-yellow-600 flex items-center gap-1">
                {formatAmount(totals.totalCreditG)}
                <span className="text-xs text-yellow-500">جم</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
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
                          البيان
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
                            key={
                              v.id || `${v.vouch_id}-${v.vouch_type}-${index}`
                            }
                            className="border-b border-slate-100 hover:bg-slate-50"
                          >
                            <td className="p-2 text-slate-800">{v.vouch_id}</td>
                            <td className="p-2 text-slate-600">
                              {v.vouch_date
                                ? formatDateTime(v.vouch_date).split(" :")[0]
                                : "-"}
                            </td>
                            <td className="p-2 text-slate-600 text-sm">
                              {v.vouch_notes || "-"}
                            </td>
                            <td className="p-2">
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${
                                  Number(v.vouch_status) === 1
                                    ? "bg-emerald-100 text-emerald-800" // فعال
                                    : Number(v.vouch_status) === 0
                                      ? "bg-red-100 text-red-800" // ملغي
                                      : Number(v.vouch_status) === 2
                                        ? "bg-yellow-100 text-yellow-800" // معلق
                                        : "bg-gray-100 text-gray-800" // غير مكتمل أو أخرى
                                }`}
                              >
                                {(() => {
                                  const vouchStatusNum = Number(v.vouch_status);
                                  
                                  // خريطة افتراضية للحالات
                                  const defaultStatusMap: Record<number, string> = {
                                    0: "ملغي",
                                    1: "فعال",
                                    2: "معلق",
                                    3: "غير مكتمل",
                                  };

                                  // إذا لم توجد حالات محملة، استخدم الخريطة الافتراضية
                                  if (!voucherStatuses || !Array.isArray(voucherStatuses) || voucherStatuses.length === 0) {
                                    return defaultStatusMap[vouchStatusNum] || (isNaN(vouchStatusNum) ? "غير محدد" : `حالة ${vouchStatusNum}`);
                                  }

                                  // البحث عن الحالة باستخدام code_id (من getVoucherStageList)
                                  // البيانات المتوقعة: { id: 102, code_id: 0, code_desc: "ملغي", ... }
                                  const status = voucherStatuses.find((s: any) => {
                                    // محاولة قراءة code_id من عدة مصادر محتملة
                                    const statusCodeId = s.code_id !== undefined && s.code_id !== null 
                                      ? Number(s.code_id)
                                      : s.Id !== undefined && s.Id !== null
                                        ? Number(s.Id)
                                        : s.id !== undefined && s.id !== null
                                          ? Number(s.id)
                                          : null;
                                    
                                    return statusCodeId !== null && statusCodeId === vouchStatusNum;
                                  });

                                  if (status) {
                                    // محاولة قراءة النص من عدة مصادر محتملة
                                    const statusText = status.code_desc || status["Code Desc"] || status.name || status.code_desc_l;
                                    if (statusText && statusText.trim() !== "") {
                                      return statusText;
                                    }
                                  }

                                  // Fallback: استخدام الخريطة الافتراضية
                                  return defaultStatusMap[vouchStatusNum] || (isNaN(vouchStatusNum) ? "غير محدد" : `حالة ${vouchStatusNum}`);
                                })()}
                              </span>
                            </td>
                            <td className="p-2">
                              <button
                                className="h-6 px-2 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300 rounded-md shadow-sm"
                                onClick={() => {
                                  createFromPrevious(v);
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
