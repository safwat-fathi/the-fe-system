import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import toast from "react-hot-toast";

import type { Voucher, VoucherDetail } from "@/types/voucher";
import { voucherService } from "@/services/api";
import {
  createVoucherAction,
  updateVoucherAction,
} from "@/app/actions/voucher.action";
import { searchAccountsAction } from "@/app/actions/accounts.action";
import { formatAmount } from "@/utilities/formatAmount";
import {
  parseNumber,
  clearOppositeField,
  getAccountGauge,
  calculateVoucherTotals,
} from "@/utilities/voucherForm";

interface UseVoucherFormProps {
  voucherData?: Voucher | null;
  voucherDetailsData?: VoucherDetail[];
  isNewVoucher?: boolean;
  voucherRecordId?: number | string | null;
  accounts: any[];
  costCenters: any[];
  voucherTypes: any[];
  voucherStatuses: any[];
  caratTypes?: any[];
  startInEditMode?: boolean;
  vouchType?: number;
  formMode?: "new" | "edit" | "preview";
  newVoucherHref?: string;
}

export const useVoucherForm = ({
  voucherData,
  voucherDetailsData,
  isNewVoucher = true,
  voucherRecordId,
  accounts: initialAccounts,
  costCenters: initialCostCenters,
  voucherTypes: initialVoucherTypes,
  voucherStatuses: initialVoucherStatuses,
  caratTypes: initialCaratTypes = [],
  startInEditMode = false,
  vouchType = 2,
  formMode = "new",
  newVoucherHref,
}: UseVoucherFormProps) => {
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
  const [details, setDetails] = useState<VoucherDetail[]>(
    voucherDetailsData || [],
  );
  const [accounts, setAccounts] = useState<any[]>(initialAccounts);
  const [costCenters, setCostCenters] = useState<any[]>(initialCostCenters);
  const [voucherTypes, setVoucherTypes] = useState<any[]>(initialVoucherTypes);
  const [voucherStatuses, setVoucherStatuses] = useState<any[]>(
    initialVoucherStatuses || [],
  );
  const [caratTypes, setCaratTypes] = useState<any[]>(initialCaratTypes);
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
  
  const hasGeneratedVoucherNumber = useRef(false);

  // Initialize component
  useEffect(() => {
    setIsClient(true);
    updateCurrentTime();
    
    if (isNewVoucher) {
      if (!hasGeneratedVoucherNumber.current) {
        hasGeneratedVoucherNumber.current = true;
        generateNextVoucherNumber();
      }
      
      // في وضع new، نبدأ بسطرين على الأقل
      setDetails((prev) => {
        if (prev.length === 0) {
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
          const newDetail2: VoucherDetail = { ...newDetail1 };
          return [newDetail1, newDetail2];
        } else if (prev.length === 1) {
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
    }

    // حفظ التفاصيل الأصلية للقيد الموجود
    if (!isNewVoucher && voucherDetailsData && voucherDetailsData.length > 0) {
      setOriginalDetails([...voucherDetailsData]);
    }
  }, []);

  // Update voucher statuses when initialVoucherStatuses changes
  useEffect(() => {
    if (initialVoucherStatuses && Array.isArray(initialVoucherStatuses)) {
      setVoucherStatuses(initialVoucherStatuses);
    }
  }, [initialVoucherStatuses]);

  // Load vouchers list when modal opens
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
    };

    if (accounts.length > 0) {
      loadDefaultAccounts();
    }
  }, [accounts]);

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
      const response = await voucherService.getAll({
        xvouch_type: "3",
        xcom_id: "1",
        xyear_id: "0",
      });

      if (response.success && response.data && Array.isArray(response.data)) {
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
            const formattedDetails = detailsResponse.data.map(
              (detail: any) => {
                const account = accounts.find(
                  (acc) => acc.id === (detail.acc_id || detail.acc),
                );

                return {
                  ...detail,
                  acc_id: detail.acc_id || detail.acc || 0,
                  acc_code:
                    (account as any)?.acc_code || detail.acc_code || "",
                  acc_name:
                    (account as any)?.acc_name || detail.acc_name || "",
                  cost_id: detail.cost_id || 0,
                  debit:
                    detail.debit !== undefined && detail.debit !== null
                      ? parseNumber(detail.debit)
                      : undefined,
                  credit:
                    detail.credit !== undefined && detail.credit !== null
                      ? parseNumber(detail.credit)
                      : undefined,
                  debit_g:
                    detail.debit_g !== undefined && detail.debit_g !== null
                      ? parseNumber(detail.debit_g)
                      : undefined,
                  credit_g:
                    detail.credit_g !== undefined && detail.credit_g !== null
                      ? parseNumber(detail.credit_g)
                      : undefined,
                  gauge: parseNumber(detail.gauge) || 875,
                  vouch_notes: detail.vouch_notes || "",
                };
              },
            );

            setDetails(formattedDetails);
            setOriginalDetails(formattedDetails);
            setTotalRecords(vouchersResponse.data.length);
          }
        }
      }
    } catch (error) {
      console.error("Error loading voucher:", error);
      toast.error("حدث خطأ أثناء تحميل القيد");
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
    setShowValidationErrors(false);
  };

  const removeDetailRow = (index: number) => {
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

        // Clear opposite field
        const cleared = clearOppositeField(field, value);
        Object.assign(newDetail, cleared);

        // Get gauge from account when acc_id is selected
        if (field === "acc_id" && value) {
          const gauge = getAccountGauge(value, accounts, caratTypes);
          newDetail.gauge = gauge;
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

  // Calculate totals using utility function
  const totals = useMemo(() => calculateVoucherTotals(details), [details]);
  const cashBalance = totals.totalDebit - totals.totalCredit;
  const goldBalance = totals.totalDebitG - totals.totalCreditG;
  const isCashBalanced = Math.abs(cashBalance) < 0.01;
  const isGoldBalanced = Math.abs(goldBalance) < 0.01;
  const isBalanced = isCashBalanced && isGoldBalanced;

  const saveVoucher = async () => {
    setShowValidationErrors(true);

    const voucherDate = new Date(voucher.vouch_date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

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

    const emptyAccountDetails = details.filter(
      (detail) => !detail.acc_id || detail.acc_id === 0,
    );

    if (emptyAccountDetails.length > 0) {
      toast.error("يرجى اختيار حساب لجميع الصفوف قبل الحفظ");
      return;
    }

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
        vouch_amt: 0,
        vouch_notes: voucher.vouch_notes || "",
        vouch_status: voucher.vouch_status || 1,
        pay_type: voucher.pay_type,
        ref_no: voucher.ref_no || "",
        opps_vouch: voucher.opps_vouch || 0,
      };

      const detailsData = details
        .filter((detail) => detail.acc_id && detail.acc_id > 0)
        .map((detail) => ({
          id: detail.id || 0,
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

      const currentDetailIds = detailsData
        .map((d) => d.id)
        .filter((id) => id > 0);
      const originalDetailIds = originalDetails
        .map((d) => d.id)
        .filter((id) => id && id > 0) as number[];
      const deletedDetailIds = originalDetailIds.filter(
        (id) => !currentDetailIds.includes(id),
      );

      const result =
        formMode === "edit"
          ? await updateVoucherAction(
              voucherData,
              detailsData,
              deletedDetailIds,
              Number(voucherRecordId) || undefined,
            )
          : await createVoucherAction(voucherData, detailsData);

      if (result.success && result.data) {
        const realId = result.data.id;
        const vouchId = result.data.vouch_id || voucher.vouch_id;

        setVoucher((prev) => ({
          ...prev,
          commit: true,
          id: realId,
          vouch_id: vouchId,
        }));

        toast.success(result.message);

        if (realId) {
          router.push(`/forms/voucher/${realId}?mode=preview`);
        } else if (vouchId) {
          try {
            const vouchersResponse = await voucherService.getAll();
            if (vouchersResponse.success && vouchersResponse.data) {
              const foundVoucher = vouchersResponse.data.find(
                (v: any) => v.vouch_id === vouchId,
              );
              if (foundVoucher?.id) {
                router.push(`/forms/voucher/${foundVoucher.id}?mode=preview`);
              } else {
                router.push(`/forms/voucher`);
              }
            }
          } catch (searchError) {
            console.error("Error searching for voucher:", searchError);
            router.push(`/forms/voucher`);
          }
        } else {
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
        const formattedDate = voucher.vouch_date
          ? new Date(voucher.vouch_date).toLocaleDateString("ar-SA", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "";

        const validDetails = details.filter((d) => d.acc_id && d.acc_id > 0);

        printWindow.document.write(`
          <html dir="rtl">
            <head>
              <meta charset="UTF-8">
              <title>قيد تسوية - ${voucher.vouch_id}</title>
              <style>
                @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap');
                * { margin: 0; padding: 0; box-sizing: border-box; }
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
                }
                tbody tr:nth-child(even) {
                  background-color: #f8fafc;
                }
                td {
                  padding: 12px 10px;
                  text-align: center;
                  border-bottom: 1px solid #e2e8f0;
                  border-left: 1px solid #e2e8f0;
                  font-size: 12.5px;
                  color: #4a5568;
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
                .footer {
                  margin-top: 40px;
                  padding-top: 20px;
                  border-top: 2px solid #e2e8f0;
                  text-align: center;
                  color: #718096;
                  font-size: 11px;
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
                    ? `<div class="voucher-notes"><strong>البيان:</strong> ${voucher.vouch_notes}</div>`
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
                        <td>${account?.acc_code || "-"}</td>
                        <td>${account?.acc_name || "-"}</td>
                        <td>${debit > 0 ? formatAmount(debit) : "-"}</td>
                        <td>${credit > 0 ? formatAmount(credit) : "-"}</td>
                        <td>${debitG > 0 ? formatAmount(debitG) : "-"}</td>
                        <td>${creditG > 0 ? formatAmount(creditG) : "-"}</td>
                        <td>${gauge}</td>
                        <td>${detail.vouch_notes || "-"}</td>
                      </tr>
                    `;
                    })
                    .join("")}
                  <tr class="totals">
                    <td colspan="2" style="text-align: right; padding-right: 20px; font-weight: 700;">الإجمالي</td>
                    <td>${formatAmount(totals.totalDebit)}</td>
                    <td>${formatAmount(totals.totalCredit)}</td>
                    <td>${formatAmount(totals.totalDebitG)}</td>
                    <td>${formatAmount(totals.totalCreditG)}</td>
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
      const vouchersResponse = await voucherService.getAll({
        xvouch_type: vouchType.toString(),
        xvouch_id: searchValue,
        xcom_id: "1",
        xyear_id: "0",
      });

      if (vouchersResponse.success && vouchersResponse.data) {
        const vouchers = Array.isArray(vouchersResponse.data)
          ? vouchersResponse.data
          : [];

        let foundVoucher = vouchers.find(
          (v: any) =>
            v.vouch_id?.toString() === searchValue ||
            v.id?.toString() === searchValue,
        );

        if (!foundVoucher) {
          foundVoucher = vouchers.find(
            (v: any) =>
              v.vouch_id?.toString().includes(searchValue) ||
              v.id?.toString().includes(searchValue),
          );
        }

        if (foundVoucher) {
          // استخدام id (primary key) أولاً، ثم vouch_id كحل بديل
          const targetId = foundVoucher.id || foundVoucher.vouch_id;
          if (targetId) {
            // تأكد من استخدام id (primary key) بدلاً من vouch_id إذا كان متاحاً
            const finalId = foundVoucher.id || targetId;
            router.push(`/forms/voucher/${finalId}?mode=preview`);
            router.refresh(); // إجبار Next.js على إعادة جلب البيانات
            setSearchTerm("");
            return;
          }
        }
      }

      const allVouchersResponse = await voucherService.getAll({
        xvouch_type: "0",
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
          if (foundAny.vouch_type !== vouchType) {
            toast.error(
              `القيد الموجود (${foundAny.vouch_id}) ليس من نوع قيد تسوية`,
            );
            return;
          }

          // استخدام id (primary key) أولاً، ثم vouch_id كحل بديل
          const targetId = foundAny.id || foundAny.vouch_id;
          if (targetId) {
            // تأكد من استخدام id (primary key) بدلاً من vouch_id إذا كان متاحاً
            const finalId = foundAny.id || targetId;
            router.push(`/forms/voucher/${finalId}?mode=preview`);
            router.refresh(); // إجبار Next.js على إعادة جلب البيانات
            setSearchTerm("");
            return;
          }
        }
      }

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

      const detailsResponse = await voucherService.getDetails(voucherToUse.id);

      if (
        detailsResponse.success &&
        detailsResponse.data &&
        Array.isArray(detailsResponse.data)
      ) {
        setVoucher({
          ...voucherToUse,
          vouch_id: 0,
          vouch_date: new Date().toISOString(),
          cr_date: new Date().toISOString(),
          commit: false,
          post: false,
          print: false,
        });

        const formattedDetails = detailsResponse.data.map((detail: any) => ({
          id: 0,
          vouch_id: 0,
          acc_id: detail.acc_id || detail.acc || 0,
          acc_code: detail.acc_code || "",
          acc_name: detail.acc_name || "",
          cost_id: detail.cost_id || 0,
          debit: parseNumber(detail.debit) || 0,
          credit: parseNumber(detail.credit) || 0,
          debit_g: parseNumber(detail.debit_g) || 0,
          credit_g: parseNumber(detail.credit_g) || 0,
          gauge: parseNumber(detail.gauge) || 875,
          vouch_notes: detail.vouch_notes || "",
          cr_date: new Date().toISOString(),
        }));

        setDetails(formattedDetails);
        const nextId = await voucherService.getNextNumber(
          voucherToUse.vouch_type,
        );
        setVoucher((prev) => ({
          ...prev,
          vouch_id: nextId,
        }));
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
          const accountCode = String(acc.acc_code ?? acc.code ?? "").toLowerCase();
          const accountName = String(acc.acc_name ?? acc.name ?? "").toLowerCase();
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
        .filter((entry) => entry.codeMatch !== -1 || entry.nameMatch !== -1)
        .sort((a, b) => {
          const aCode = a.codeMatch === -1 ? Infinity : a.codeMatch;
          const bCode = b.codeMatch === -1 ? Infinity : b.codeMatch;
          if (aCode !== bCode) return aCode - bCode;
          const aName = a.nameMatch === -1 ? Infinity : a.nameMatch;
          const bName = b.nameMatch === -1 ? Infinity : b.nameMatch;
          return aName - bName;
        })
        .map(({ value, label, account }) => ({ value, label, account }));

      return options;
    } catch (e) {
      console.error("Error loading account options:", e);
      return [];
    }
  };

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

  return {
    // State
    voucher,
    setVoucher,
    details,
    setDetails,
    accounts,
    costCenters,
    voucherTypes,
    voucherStatuses,
    caratTypes,
    isLoading,
    isEditing,
    setIsEditing,
    isPrinting,
    showValidationErrors,
    currentTime,
    isClient,
    currentRecord,
    totalRecords,
    searchTerm,
    setSearchTerm,
    selectedVoucher,
    setSelectedVoucher,
    vouchersList,
    isModalOpen,
    setIsModalOpen,
    defaultAccountOptions,
    originalDetails,

    // Totals and balances
    totals,
    cashBalance,
    goldBalance,
    isCashBalanced,
    isGoldBalanced,
    isBalanced,

    // Functions
    updateCurrentTime,
    updateAccountsList,
    loadVouchersList,
    generateNextVoucherNumber,
    loadVoucher,
    navigateToVoucher,
    addDetailRow,
    removeDetailRow,
    updateDetail,
    updateVoucherType,
    saveVoucher,
    printVoucher,
    handleSearch,
    createFromPrevious,
    loadAccountOptions,
    getAccountSelectValue,
  };
};

