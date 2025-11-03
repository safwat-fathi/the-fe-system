"use client";

import { useRouter, usePathname } from "next/navigation";
import AsyncCreatableSelect from "react-select/async-creatable";

import { useVoucherForm } from "@/hooks/useVoucherForm";
import { RiyalIcon } from "@/components/RiyalIcon";
import { formatAmount } from "@/utilities/formatAmount";
import { formatDateTime } from "@/utilities/dateUtils";

import "bootstrap-icons/font/bootstrap-icons.css";

import type { Voucher, VoucherDetail } from "@/types/voucher";

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
  startInEditMode = false,
  vouchType = 2,
  formMode = "new",
  newVoucherHref,
}: VoucherClientPageProps) {
  const router = useRouter();
  const pathname = usePathname();

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
    showValidationErrors,
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
    updateVoucherType,
    saveVoucher,
    printVoucher,
    handleSearch,
    createFromPrevious,
    loadAccountOptions,
    getAccountSelectValue,
    updateAccountsList,
    navigateToVoucher,
  } = useVoucherForm({
              voucherData,
    voucherDetailsData,
    isNewVoucher,
    voucherRecordId,
    accounts: initialAccounts,
    costCenters: initialCostCenters,
    voucherTypes: initialVoucherTypes,
    voucherStatuses: initialVoucherStatuses,
    caratTypes: initialCaratTypes,
    startInEditMode,
    vouchType,
    formMode,
    newVoucherHref,
  });

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

                            // Note: Validation errors are managed by the hook
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
