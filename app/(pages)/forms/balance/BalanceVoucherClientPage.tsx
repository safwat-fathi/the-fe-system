"use client";

import { useRouter, useSearchParams } from "next/navigation";
import AsyncCreatableSelect from "react-select/async-creatable";

import GLTransactionModal from "../components/GLTransactionModal";

import { useBalanceVoucherForm } from "@/hooks/useBalanceVoucherForm";
import { useGLTransactions } from "@/hooks/useGLTransactions";
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
    saveVoucher,
    printVoucher,
    handleEditClick,
    loadAccountOptions,
    getAccountSelectValue,
    updateAccountsList,
  } = useBalanceVoucherForm({
    voucherData,
    voucherDetailsData,
    formData,
    formMode,
    voucherRecordId,
    isNewVoucher,
    startInEditMode: propStartInEditMode,
  });

  // استخدام hook موحد لحركة الترحيل (بعد useBalanceVoucherForm لأننا نحتاج voucher)
  const {
    isGLModalOpen,
    setIsGLModalOpen,
    glTransactions,
    loadingGLTransactions,
    handleViewGLTransactions,
    getAccountName,
  } = useGLTransactions({
    vouchId: voucher.vouch_id || 0,
    vouchType: 0, // قيد افتتاحي
    refNo: voucher.ref_no,
  });

  if (!isClient) {
    return (
      <div className="flex justify-center items-center h-screen">
        جاري التحميل...
      </div>
    );
  }

  return (
    <div className="p-3 max-w-[1500px] mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header - رأس القيد مع الأزرار */}
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-3 mb-4 border border-slate-200">
        {/* الصف الأول: معلومات القيد */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-4">
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
              onClick={handleEditClick}
            >
              <i className="bi bi-pencil-square w-4 h-4 me-1" />
              تعديل
            </button>

            <button
              className="h-7 px-3 text-xs bg-slate-600 text-white hover:bg-slate-700 border border-slate-600 rounded-md shadow-sm disabled:opacity-50"
              disabled={isPrinting || !voucher.vouch_id}
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
              className="h-7 px-3 text-xs bg-indigo-600 text-white hover:bg-indigo-700 border border-indigo-600 rounded-md shadow-sm disabled:opacity-50"
              disabled={!voucher.vouch_id || voucher.vouch_id <= 0}
              title="عرض القيد المحاسبي"
              onClick={handleViewGLTransactions}
            >
              <span className="flex items-center gap-1">
                <i className="bi bi-list-check w-4 h-4 me-1" />
                القيد المحاسبي
              </span>
            </button>
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
      <div className="bg-white rounded-lg border border-slate-200 mb-4">
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* رقم المرجع */}
            <div className="flex flex-col gap-1">
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

            {/* تاريخ ووقت القيد */}
            <div className="flex flex-col gap-1">
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

            {/* البيان */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">
                البيان
              </label>
              <input
                className="text-sm border border-slate-300 rounded-md px-3 py-2 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
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

      {/* Details Table - جدول تفاصيل القيد */}
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
              {isBalanced ? "متزن" : "غير متزن"}
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
          <div className="overflow-x-auto overflow-y-auto mb-3 max-w-full max-h-[600px]">
            <table className="min-w-[1400px] border text-sm text-center table-fixed">
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
                    ذهب قائم
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
                    ذهب معاير
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
                    <td className="p-0 border">
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

                          if (!accounts.find((a) => a.id === selected.id)) {
                            updateAccountsList(selected);
                          }

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

                    {/* حقول ذهب (base_debit/base_credit) */}
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
                        value={
                          detail.base_debit ? String(detail.base_debit) : ""
                        }
                        onChange={(e) => {
                          const val = e.target.value;

                          if (!val || parseFloat(val) >= 0) {
                            updateDetail(
                              index,
                              "base_debit",
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
                        value={
                          detail.base_credit ? String(detail.base_credit) : ""
                        }
                        onChange={(e) => {
                          const val = e.target.value;

                          if (!val || parseFloat(val) >= 0) {
                            updateDetail(
                              index,
                              "base_credit",
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

                    {/* حقول ذهب معاير (debit_g/credit_g) */}
                    <td className="p-0 border">
                      <input
                        className={`w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0 ${!isEditing ? "cursor-not-allowed bg-gray-50" : "bg-yellow-50"}`}
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
                        title="يُحسب تلقائياً من: مدين ذهب قائم × (المعايرة / 875)"
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
                        className={`w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0 ${!isEditing ? "cursor-not-allowed bg-gray-50" : "bg-yellow-50"}`}
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
                        title="يُحسب تلقائياً من: دائن ذهب قائم × (المعايرة / 875)"
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

                    {costCenters.length > 0 && (
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

      {/* Totals - شريط الإجماليات */}
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

      {/* مودال عرض القيد المحاسبي */}
      <GLTransactionModal
        getAccountName={getAccountName}
        isOpen={isGLModalOpen}
        loading={loadingGLTransactions}
        refNo={voucher.ref_no}
        transactions={glTransactions}
        voucherId={voucher.vouch_id || 0}
        onClose={() => setIsGLModalOpen(false)}
      />
    </div>
  );
}
