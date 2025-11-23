"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AsyncCreatableSelect from "react-select/async-creatable";
import ReactSelect from "react-select";
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Select,
  SelectItem,
  Textarea,
} from "@heroui/react";
import { ConfirmationModal } from "@/components/Modal";
import {
  CheckIcon,
  PencilIcon,
  PrinterIcon,
  ArrowsPointingOutIcon,
} from "@heroicons/react/24/outline";

import { useBalanceVoucherForm } from "@/hooks/useBalanceVoucherForm";
import { RiyalIcon } from "@/components/RiyalIcon";
import { formatAmount } from "@/utilities/formatAmount";
import "bootstrap-icons/font/bootstrap-icons.css";

interface BalanceVoucherClientPageProps {
  voucherData?: any;
  voucherDetailsData?: any[];
  formData: any;
  formMode?: "new" | "edit" | "preview";
  voucherRecordId?: number | string | null;
  isNewVoucher?: boolean;
  startInEditMode?: boolean;
}

export default function BalanceVoucherClientPage({
  voucherData,
  voucherDetailsData,
  formData,
  formMode: initialFormMode = "new",
  voucherRecordId,
  isNewVoucher = true,
  startInEditMode: propStartInEditMode,
}: BalanceVoucherClientPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") || initialFormMode;
  const formMode = (
    mode === "new" ? "new" : mode === "edit" ? "edit" : "preview"
  ) as "new" | "edit" | "preview";
  const startInEditMode =
    propStartInEditMode !== undefined
      ? propStartInEditMode
      : formMode === "edit" || formMode === "new";

  // حالة المودال لتوسيع البيان
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);

  // Use the hook for all state management and business logic
  const {
    // State
    voucher,
    setVoucher,
    details,
    accounts,
    costCenters,
    voucherTypes,
    voucherStatuses,
    caratTypes,
    isLoading,
    isEditing,
    setIsEditing,
    isPrinting,
    isClient,
    showUnbalancedModal,
    defaultAccountOptions,

    // Totals and balances
    totals,
    cashBalance,
    goldBalance,
    isCashBalanced,
    isGoldBalanced,
    isBalanced,

    // Functions
    addDetailRow,
    removeDetailRow,
    updateDetail,
    handleMasterCostChange,
    saveVoucher,
    printVoucher,
    handleEditClick,
    loadAccountOptions,
    getAccountSelectValue,
    updateAccountsList,
    handleUnbalancedConfirm,
    handleUnbalancedCancel,
  } = useBalanceVoucherForm({
    voucherData,
    voucherDetailsData,
    formData,
    formMode,
    voucherRecordId,
    isNewVoucher,
    startInEditMode: propStartInEditMode,
  });

  const toAmount = (value: unknown) => {
    const numeric = Number(value);

    return Number.isFinite(numeric) ? numeric : 0;
  };

  const getPreviewAccountName = (
    accId: number | string | null | undefined,
    fallback?: string | null,
  ): string => {
    if (fallback && fallback.trim().length > 0) {
      return fallback;
    }

    if (accId === null || accId === undefined || accId === "") {
      return "";
    }

    const numericId = Number(accId);

    if (!Number.isFinite(numericId)) {
      return "";
    }

    const account = accounts.find((acc: any) => {
      const candidate =
        acc?.acc_id ?? acc?.acc ?? acc?.account_no ?? acc?.id;

      return Number(candidate) === numericId;
    });

    return (
      account?.acc_name ||
      account?.name ||
      account?.label ||
      ""
    );
  };

  // Helper functions for cost center select (must be before any early return)
  const getCostCenterSelectValue = (
    costId: number | null | undefined,
  ) => {
    if (!costId || costId <= 0) {
      return null;
    }

    const center = costCenters.find((c) => c.id === costId);

    if (!center) {
      return null;
    }

    return {
      value: String(center.id),
      label: center.name || center.cost_name || `مركز ${center.id}`,
    };
  };

  const costCenterSelectOptions = useMemo(() => {
    return (costCenters || []).map((center) => ({
      value: String(center.id),
      label: center.name || center.cost_name || `مركز ${center.id}`,
    }));
  }, [costCenters]);

  if (!isClient) {
    return (
      <div className="flex justify-center items-center h-screen">
        جاري التحميل...
      </div>
    );
  }

  return (
    <div className="p-2 max-w-[1500px] mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header - رأس القيد مع الأزرار */}
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-2 mb-2 border border-slate-200">
        {/* الصف الأول: معلومات القيد */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <span>
                  {voucherTypes.find((t) => t.id === voucher.vouch_type)
                    ?.name || "قيد افتتاحي"}
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
        </div>

        {/* الصف الثاني: الأزرار والحالة */}
          <div className="flex items-center justify-between mt-1">
            {/* الأزرار من اليسار لليمين */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                variant="solid"
                isLoading={isLoading}
                isDisabled={!isEditing}
                onPress={saveVoucher}
                startContent={
                  !isLoading ? (
                    <CheckIcon className="h-4 w-4" />
                  ) : undefined
                }
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 min-w-[90px]"
              >
                حفظ
              </Button>

              <Button
                size="sm"
                variant="solid"
                isDisabled={formMode === "new" || isEditing || isLoading}
                onPress={handleEditClick}
                startContent={<PencilIcon className="h-4 w-4" />}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 min-w-[90px]"
              >
                تعديل
              </Button>

              <Button
                size="sm"
                variant="solid"
                isLoading={isPrinting}
                isDisabled={!voucher.vouch_id || voucher.vouch_id <= 0}
                onPress={printVoucher}
                startContent={
                  !isPrinting ? (
                    <PrinterIcon className="h-4 w-4" />
                  ) : undefined
                }
                className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 min-w-[90px]"
              >
                طباعة
              </Button>
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

      {/* Form - نموذج بيانات القيد */}
      <div className="bg-white rounded-lg border border-slate-200 mb-2">
        <div className="p-2">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
            {/* رقم المرجع - أضيق */}
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-sm font-medium text-slate-700">
                رقم المرجع
              </label>
              <input
                className="text-sm border border-slate-300 rounded-md px-3 py-2 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                disabled={!isEditing}
                placeholder="أدخل رقم المرجع"
                readOnly={!isEditing}
                value={voucher.ref_no || ""}
                onChange={(e) =>
                  setVoucher((prev) => ({ ...prev, ref_no: e.target.value }))
                }
              />
            </div>

            {/* تاريخ ووقت القيد - توسع قليلاً */}
            <div className="flex flex-col gap-1 md:col-span-3">
              <label className="text-sm font-medium text-slate-700">
                تاريخ ووقت القيد
              </label>
              <input
                className="text-sm border border-slate-300 rounded-md px-3 py-2 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
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
                    vouch_date: e.target.value,
                  }))
                }
              />
            </div>

            {costCenters.length > 0 && (
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">
                  مركز التكلفة
                </label>
                <ReactSelect
                  isSearchable
                  isDisabled={!isEditing}
                  isClearable
                  className="text-sm"
                  classNamePrefix="react-select"
                  components={{ IndicatorSeparator: () => null }}
                  instanceId="balance-cost-center-select"
                  menuPortalTarget={
                    typeof window !== "undefined" ? document.body : null
                  }
                  menuPosition="fixed"
                  options={costCenterSelectOptions}
                  placeholder="اختر مركز التكلفة..."
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: "40px",
                      height: "40px",
                      fontSize: "14px",
                    }),
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    option: (base) => ({
                      ...base,
                      fontSize: "14px",
                    }),
                    placeholder: (base) => ({
                      ...base,
                      fontSize: "14px",
                    }),
                    singleValue: (base) => ({
                      ...base,
                      fontSize: "14px",
                    }),
                  }}
                  value={getCostCenterSelectValue(voucher.cost_id)}
                  onChange={(selectedOption: any) => {
                    if (!isEditing) return;
                    const selected = selectedOption?.value
                      ? Number(selectedOption.value)
                      : null;

                    handleMasterCostChange(
                      selected !== null && Number.isFinite(selected)
                        ? selected
                        : null,
                    );
                  }}
                />
              </div>
            )}

            {/* البيان - أوسع مع زر توسيع */}
            <div
              className={`flex flex-col gap-1 ${
                costCenters.length > 0 ? "md:col-span-5" : "md:col-span-7"
              }`}
            >
              <label className="text-sm font-medium text-slate-700">
                البيان
              </label>
              <div className="relative">
                <input
                  className="text-sm border border-slate-300 rounded-md px-3 py-2 pr-10 w-full focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                  disabled={!isEditing}
                  placeholder="أدخل بيان القيد (انقر نقرتين للكتابة المطولة)"
                  readOnly={!isEditing}
                  value={voucher.vouch_notes || ""}
                  onChange={(e) =>
                    setVoucher((prev) => ({
                      ...prev,
                      vouch_notes: e.target.value,
                    }))
                  }
                  onDoubleClick={() => {
                    if (isEditing) {
                      setIsNotesModalOpen(true);
                    }
                  }}
                />
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsNotesModalOpen(true)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-all duration-200"
                    title="توسيع البيان"
                  >
                    <ArrowsPointingOutIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details Table - جدول تفاصيل القيد */}
      <div className="bg-white rounded-lg border border-slate-200 mb-2">
        <div className="p-1.5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-slate-800">تفاصيل القيد</h3>
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
            </span>
          </div>
        </div>

          <div className="p-1">
            <div className="flex justify-between mb-1">
            <button
              className="btn"
              disabled={!isEditing}
              type="button"
              onClick={addDetailRow}
            >
              + صف
            </button>
          </div>
          <div className="overflow-x-auto mb-1">
            <div className="max-h-[360px] overflow-y-auto">
              <table className="min-w-[1400px] border text-xs text-center table-fixed">
                <thead className="sticky top-0 z-10 bg-gray-100 text-xs font-bold">
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
                    ذهب قائم (جم)
                  </th>
                  <th
                    className="w-20 p-0.5 font-bold text-slate-700 border"
                    rowSpan={2}
                  >
                    المعايرة
                  </th>
                  <th
                    className="w-40 p-0.5 font-bold text-slate-700 border"
                    colSpan={2}
                  >
                    ذهب معاير (جم)
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
                    مدين (جم)
                  </th>
                  <th className="w-20 p-0.5 font-bold text-slate-700 border">
                    دائن (جم)
                  </th>
                  <th className="w-20 p-0.5 font-bold text-slate-700 border">
                    مدين (جم)
                  </th>
                  <th className="w-20 p-0.5 font-bold text-slate-700 border">
                    دائن (جم)
                  </th>
                </tr>
              </thead>
              <tbody>
                {details.map((detail, index) => (
                  <tr
                    key={index}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="p-0 border">
                      <AsyncCreatableSelect
                        isClearable
                        isSearchable
                        cacheOptions
                        closeMenuOnScroll={false}
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
                        debounceTimeout={300}
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

                          updateAccountsList(selected);
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

                    {/* حقول ذهب قائم (g_debit/g_credit) */}
                    <td className="p-0 border bg-amber-50">
                      <input
                        className={`w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0 bg-amber-50 ${!isEditing ? "cursor-not-allowed" : ""}`}
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
                        value={
                          detail.g_debit ? String(detail.g_debit) : ""
                        }
                        onChange={(e) => {
                          const val = e.target.value;

                          if (!val || parseFloat(val) >= 0) {
                            updateDetail(
                              index,
                              "g_debit",
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

                    <td className="p-0 border bg-amber-50">
                      <input
                        className={`w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0 bg-amber-50 ${!isEditing ? "cursor-not-allowed" : ""}`}
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
                        value={
                          detail.g_credit ? String(detail.g_credit) : ""
                        }
                        onChange={(e) => {
                          const val = e.target.value;

                          if (!val || parseFloat(val) >= 0) {
                            updateDetail(
                              index,
                              "g_credit",
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

                    {/* حقل المعايرة */}
                    <td className="p-0 border">
                      <input
                        className={`w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0 ${!isEditing ? "cursor-not-allowed" : ""}`}
                        disabled={!isEditing}
                        min="0"
                        placeholder="875"
                        readOnly={!isEditing}
                        step="0.01"
                        style={{
                          MozAppearance: "textfield",
                          WebkitAppearance: "none",
                          appearance: "none",
                        }}
                        type="number"
                        value={detail.gauge ? String(detail.gauge) : "875"}
                        onChange={(e) => {
                          const val = e.target.value;

                          if (!val || parseFloat(val) >= 0) {
                            updateDetail(
                              index,
                              "gauge",
                              val ? parseFloat(val) : 875,
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

                    {/* حقول ذهب معاير (g_debit_base/g_credit_base) */}
                    <td className="p-0 border bg-amber-50">
                      <input
                        className={`w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0 ${
                          isEditing ? "bg-amber-50" : "cursor-not-allowed bg-amber-100"
                        }`}
                        disabled={!isEditing}
                        min="0"
                        placeholder="0.00"
                        readOnly={!isEditing}
                        step="0.000001"
                        style={{
                          MozAppearance: "textfield",
                          WebkitAppearance: "none",
                          appearance: "none",
                        }}
                        title="يمكن تعديل الذهب المعاير، وسيتم تحديث المعايرة تلقائياً"
                        type="number"
                        value={
                          detail.g_debit_base !== undefined &&
                          detail.g_debit_base !== null
                            ? String(detail.g_debit_base)
                            : ""
                        }
                        onChange={(e) => {
                          if (!isEditing) return;
                          const val = e.target.value;

                          if (!val || parseFloat(val) >= 0) {
                            updateDetail(
                              index,
                              "g_debit_base",
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

                    <td className="p-0 border bg-amber-50">
                      <input
                        className={`w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0 ${
                          isEditing ? "bg-amber-50" : "cursor-not-allowed bg-amber-100"
                        }`}
                        disabled={!isEditing}
                        min="0"
                        placeholder="0.00"
                        readOnly={!isEditing}
                        step="0.000001"
                        style={{
                          MozAppearance: "textfield",
                          WebkitAppearance: "none",
                          appearance: "none",
                        }}
                        title="يمكن تعديل الذهب المعاير، وسيتم تحديث المعايرة تلقائياً"
                        type="number"
                        value={
                          detail.g_credit_base !== undefined &&
                          detail.g_credit_base !== null
                            ? String(detail.g_credit_base)
                            : ""
                        }
                        onChange={(e) => {
                          if (!isEditing) return;
                          const val = e.target.value;

                          if (!val || parseFloat(val) >= 0) {
                            updateDetail(
                              index,
                              "g_credit_base",
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

                    {costCenters.length > 0 && (
                      <td className="p-0 border">
                        <ReactSelect
                          isSearchable
                          isDisabled={!isEditing}
                          className="text-xs"
                          classNamePrefix="react-select"
                          components={{ IndicatorSeparator: () => null }}
                          instanceId={`cost-center-detail-select-${index}`}
                          menuPortalTarget={
                            typeof window !== "undefined" ? document.body : null
                          }
                          menuPosition="fixed"
                          options={costCenterSelectOptions}
                          placeholder="مركز التكلفة..."
                          styles={{
                            control: (base) => ({
                              ...base,
                              minHeight: "32px",
                              height: "32px",
                              fontSize: "12px",
                              border: "none",
                              borderRadius: "0",
                              boxShadow: "none",
                              cursor: isEditing ? "pointer" : "not-allowed",
                              backgroundColor: "transparent",
                            }),
                            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                            option: (base) => ({
                              ...base,
                              fontSize: "12px",
                            }),
                            placeholder: (base) => ({
                              ...base,
                              fontSize: "12px",
                            }),
                            singleValue: (base) => ({
                              ...base,
                              fontSize: "12px",
                            }),
                          }}
                          value={getCostCenterSelectValue(detail.cost_id)}
                          onChange={(selectedOption: any) => {
                            if (!isEditing) return;
                            updateDetail(
                              index,
                              "cost_id",
                              selectedOption?.value
                                ? parseInt(selectedOption.value)
                                : null,
                            );
                          }}
                        />
                      </td>
                    )}

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
                        className="font-bold text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                        disabled={!isEditing}
                        tabIndex={-1}
                        title="حذف السطر"
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
      </div>

      {/* Totals - شريط الإجماليات */}
      <div className="mt-2 bg-gray-50 rounded-lg p-2 border border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
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

          {!isCashBalanced && (
            <div className="flex items-center gap-2">
              <span className="text-gray-700 font-medium">فارق النقدية:</span>
              <span className="font-semibold text-red-700 flex items-center gap-1">
                {formatAmount(Math.abs(cashBalance))}
                <span className="text-xs">
                  ({cashBalance > 0 ? "مدين" : "دائن"})
                </span>
                <RiyalIcon color="currentColor" />
              </span>
            </div>
          )}

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

          {!isGoldBalanced && (
            <div className="flex items-center gap-2">
              <span className="text-amber-800 font-medium">فارق الذهب:</span>
              <span className="font-semibold text-red-700 flex items-center gap-1">
                {formatAmount(Math.abs(goldBalance))}
                <span className="text-xs">
                  ({goldBalance > 0 ? "مدين" : "دائن"})
                </span>
                <span className="text-xs text-yellow-500">جم</span>
              </span>
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={showUnbalancedModal}
        onClose={handleUnbalancedCancel}
        onConfirm={handleUnbalancedConfirm}
        title="⚠️ القيد غير متزن"
        message={
          <div className="space-y-2 text-right">
            <p className="text-gray-700">القيد الحالي غير متزن:</p>
            <div className="bg-gray-50 p-3 rounded-lg space-y-1">
              <p className="font-semibold text-gray-800">
                إجمالي المدين: {totals.totalDebit.toFixed(2)}
              </p>
              <p className="font-semibold text-gray-800">
                إجمالي الدائن: {totals.totalCredit.toFixed(2)}
              </p>
              <p className="font-semibold text-gray-800">
                إجمالي الذهب المدين: {totals.totalDebitG.toFixed(6)} جم
              </p>
              <p className="font-semibold text-gray-800">
                إجمالي الذهب الدائن: {totals.totalCreditG.toFixed(6)} جم
              </p>
            </div>
            <p className="mt-3 text-gray-600 text-sm">
              هل ترغب بالمتابعة والحفظ رغم عدم التوازن؟
            </p>
          </div>
        }
        confirmText="متابعة والحفظ"
        cancelText="إلغاء"
        confirmColor="warning"
        size="md"
      />

      {/* مودال توسيع البيان */}
      <Modal
        isOpen={isNotesModalOpen}
        onClose={() => setIsNotesModalOpen(false)}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <p className="text-lg font-semibold">البيان</p>
          </ModalHeader>
          <ModalBody>
            <Textarea
              placeholder="أدخل بيان القيد..."
              value={voucher.vouch_notes || ""}
              onChange={(e) =>
                setVoucher((prev) => ({
                  ...prev,
                  vouch_notes: e.target.value,
                }))
              }
              disabled={!isEditing}
              minRows={6}
              maxRows={12}
              classNames={{
                input: "resize-none",
              }}
            />
          </ModalBody>
          <ModalFooter>
            <Button
              color="primary"
              variant="solid"
              onPress={() => setIsNotesModalOpen(false)}
            >
              حفظ
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
