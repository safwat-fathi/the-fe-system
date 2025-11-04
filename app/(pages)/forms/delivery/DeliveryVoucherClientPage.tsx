"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import CreatableSelect from "react-select/creatable";
import AsyncCreatableSelectRegular from "react-select/async-creatable";
import { withAsyncPaginate } from "react-select-async-paginate";
import toast from "react-hot-toast";

const AsyncPaginateCreatableSelect = withAsyncPaginate(CreatableSelect);

import GLTransactionModal from "../components/GLTransactionModal";

import { Voucher, VoucherBox, GVoucherDetail } from "@/types/voucher";
import { useReceiptDeliveryVoucherForm } from "@/hooks/useReceiptDeliveryVoucherForm";
import { useGLTransactions } from "@/hooks/useGLTransactions";
import { RiyalIcon } from "@/components/RiyalIcon";
import { formatAmount } from "@/utilities/formatAmount";

import "bootstrap-icons/font/bootstrap-icons.css";

interface DeliveryVoucherClientPageProps {
  voucherData?: Voucher | null;
  voucherBoxes?: VoucherBox[];
  goldDetailsData?: GVoucherDetail[];
  isNewVoucher?: boolean;
  voucherRecordId?: number | string | null;
  accounts: any[];
  boxes: any[];
  costCenters: any[];
  customers: any[];
  items: any[];
  voucherTypes: any[];
  startInEditMode?: boolean;
  vouchType: number; // 222 للتسليم
  formMode?: "new" | "edit" | "preview";
}

export default function DeliveryVoucherClientPage({
  voucherData,
  voucherBoxes: initialVoucherBoxes = [],
  goldDetailsData: initialGoldDetails = [],
  isNewVoucher = true,
  voucherRecordId,
  accounts: initialAccounts,
  boxes: initialBoxes,
  costCenters: initialCostCenters,
  customers: initialCustomers,
  items: initialItems,
  voucherTypes: initialVoucherTypes,
  startInEditMode = false,
  vouchType,
  formMode = "new",
}: DeliveryVoucherClientPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Use the hook for all state management and business logic
  const {
    // State
    voucher,
    setVoucher,
    voucherBoxes,
    goldDetails,
    accounts,
    boxes,
    costCenters,
    customers,
    setCustomers,
    items,
    setItems,
    voucherTypes,
    isLoading,
    isEditing,
    setIsEditing,
    isPrinting,
    selectedCustomer,
    setSelectedCustomer,
    defaultCustomerOptions,
    isClient,
    currentTime,

    // Totals
    totals,

    // Functions
    loadItemOptions,
    loadCustomerOptions,
    getCustomerSelectValue,
    getItemSelectValue,
    updateVoucherBox,
    addVoucherBoxRow,
    removeVoucherBoxRow,
    updateGoldDetail,
    addGoldDetailRow,
    removeGoldDetailRow,
    saveVoucher,
    printVoucher,
  } = useReceiptDeliveryVoucherForm({
    voucherData,
    voucherBoxes: initialVoucherBoxes,
    goldDetailsData: initialGoldDetails,
    isNewVoucher,
    voucherRecordId,
    accounts: initialAccounts,
    boxes: initialBoxes,
    costCenters: initialCostCenters,
    customers: initialCustomers,
    items: initialItems,
    voucherTypes: initialVoucherTypes,
    startInEditMode,
    vouchType,
    formMode,
  });

  // Handle search
  const [searchTerm, setSearchTerm] = useState("");

  // استخدام hook موحد لحركة الترحيل
  const {
    isGLModalOpen,
    setIsGLModalOpen,
    glTransactions,
    loadingGLTransactions,
    handleViewGLTransactions,
    getAccountName,
  } = useGLTransactions({
    vouchId: voucher.vouch_id || 0,
    vouchType: vouchType,
    refNo: voucher.ref_no,
  });

  const handleSearch = async () => {
    if (!searchTerm || searchTerm.trim() === "") {
      toast.error("يرجى إدخال رقم السند للبحث");

      return;
    }

    const searchValue = searchTerm.trim();

    try {
      const { voucherService } = await import("@/services/api");
      const vouchersResponse = await voucherService.getAll({
        xvouch_type: "222",
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
          const targetId = foundVoucher.id || foundVoucher.vouch_id;

          if (targetId) {
            router.push(`/forms/delivery/${targetId}?mode=preview`);
            setSearchTerm("");

            return;
          }
        }
      }

      toast.error(`لم يتم العثور على سند تسليم برقم: ${searchValue}`);
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
      router.push(`/forms/delivery/${voucherRecordId}?mode=edit`);
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
    voucherTypes.find((t) => (t.Id || t.id) === vouchType)?.name || "سند تسليم";

  return (
    <div className="p-2 max-w-[1500px] mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-2 mb-2 border border-slate-200">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
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

          <div className="flex items-center justify-between mt-1">
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
              className="h-7 px-3 text-xs bg-blue-600 text-white hover:bg-blue-700 border border-blue-600 rounded-md shadow-sm"
              onClick={() => router.push("/forms/delivery")}
            >
              <i className="bi bi-plus-circle w-4 h-4 me-1" />
              جديد
            </button>

            <button
              className="h-7 px-3 text-xs bg-slate-600 text-white hover:bg-slate-700 border border-slate-600 rounded-md shadow-sm disabled:opacity-50"
              disabled={isPrinting}
              onClick={printVoucher}
            >
              <i className="bi bi-printer w-4 h-4 me-1" />
              طباعة
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-0.5">
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
          <label className="block text-xs font-medium text-slate-700 mb-0.5">
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
          <label className="block text-xs font-medium text-slate-700 mb-0.5">
            العميل
          </label>
          <AsyncCreatableSelectRegular
            cacheOptions
            isClearable
            isSearchable
            className="text-xs"
            classNamePrefix="select"
            defaultOptions={
              defaultCustomerOptions.length > 0 ? defaultCustomerOptions : true
            }
            isDisabled={!isEditing}
            loadOptions={loadCustomerOptions}
            menuPortalTarget={
              typeof window !== "undefined" ? document.body : null
            }
            menuPosition="fixed"
            placeholder="اختر العميل..."
            styles={{
              control: (provided, state) => ({
                ...provided,
                minHeight: "32px",
                height: "32px",
                fontSize: "12px",
                borderColor: state.isFocused ? "#64748b" : "#cbd5e1",
                boxShadow: state.isFocused
                  ? "0 0 0 1px #64748b"
                  : provided.boxShadow,
                "&:hover": {
                  borderColor: "#64748b",
                },
              }),
              valueContainer: (provided) => ({
                ...provided,
                height: "32px",
                padding: "0 8px",
              }),
              input: (provided) => ({
                ...provided,
                margin: "0px",
              }),
              indicatorsContainer: (provided) => ({
                ...provided,
                height: "32px",
              }),
              option: (provided, state) => ({
                ...provided,
                fontSize: "12px",
                backgroundColor: state.isSelected
                  ? "#64748b"
                  : state.isFocused
                    ? "#f1f5f9"
                    : "white",
                color: state.isSelected ? "white" : "#1e293b",
              }),
            }}
            value={getCustomerSelectValue()}
            onChange={(selectedOption: any) => {
              if (!isEditing) return;
              const opt: any = selectedOption;
              const selected =
                opt?.customer ||
                customers.find((cust) => cust.id === opt?.value);

              setSelectedCustomer(selected || null);

              const handling = selected?.handling?.toString() || "";

              setVoucher((prev) => ({
                ...prev,
                cust_id: selected?.id ?? null,
                handling: handling,
              }));
            }}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-0.5">
            مناولة
          </label>
          <input
            className="w-full h-8 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2"
            disabled={!isEditing}
            placeholder="مناولة"
            readOnly={!isEditing}
            type="text"
            value={voucher.handling || ""}
            onChange={(e) =>
              setVoucher((prev) => ({ ...prev, handling: e.target.value }))
            }
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-0.5">
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
      </div>

      {/* Gold Table */}
      <div className="bg-white rounded-lg border border-slate-200 mb-2">
        <div className="p-1.5 border-b border-slate-200 bg-slate-50">
          <h3 className="text-sm font-semibold text-slate-800">الذهب</h3>
        </div>
        <div className="p-1">
          <div className="flex justify-between mb-1">
            <button
              className="btn"
              disabled={!isEditing}
              type="button"
              onClick={addGoldDetailRow}
            >
              + صف
            </button>
          </div>
          <div className="overflow-x-auto mb-1 max-w-full">
            <table className="min-w-[1400px] border text-xs text-center table-fixed">
              <thead className="bg-gray-100 text-xs font-bold">
                <tr>
                  <th className="w-48 p-1 border">رقم الصنف</th>
                  <th className="w-32 p-1 border">معايرة</th>
                  <th className="w-32 p-1 border">الوزن القائم</th>
                  <th className="w-32 p-1 border">الوزن المعاير</th>
                  <th className="w-32 p-1 border">معدل الأجور</th>
                  <th className="w-32 p-1 border">الأجور</th>
                  <th className="w-48 p-1 border">الصندوق</th>
                  <th className="w-80 p-1 border">البيان</th>
                  <th className="w-32 p-1 border">فرق عيار</th>
                  <th className="w-32 p-1 border">مبلغ التسكير</th>
                  <th className="w-32 p-1 border">وزن التسكير</th>
                  <th className="w-32 p-1 border">رقم الفاتورة</th>
                  <th className="w-48 p-1 border">مركز التكلفة</th>
                  <th className="w-12 p-1 border">حذف</th>
                </tr>
              </thead>
              <tbody>
                {goldDetails.map((detail, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-0 border">
                      <AsyncPaginateCreatableSelect
                        defaultOptions
                        isClearable
                        isSearchable
                        additional={{ page: 1 }}
                        className="text-xs"
                        classNamePrefix="select"
                        components={{ IndicatorSeparator: () => null }}
                        instanceId={`item-select-${index}`}
                        isDisabled={!isEditing}
                        loadOptions={loadItemOptions}
                        menuPortalTarget={
                          typeof window !== "undefined" ? document.body : null
                        }
                        menuPosition="fixed"
                        placeholder="اختر الصنف..."
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
                        value={getItemSelectValue(detail)}
                        onChange={(selectedOption: any) => {
                          if (!isEditing) return;
                          const opt: any = selectedOption;
                          const selected =
                            opt?.item ||
                            items.find((itm) => itm.id === opt?.value);

                          if (!selected) return;

                          updateGoldDetail(
                            index,
                            "item_id",
                            selected.id ?? null,
                          );
                          updateGoldDetail(
                            index,
                            "item_code",
                            selected.item_code ?? "",
                          );
                          updateGoldDetail(
                            index,
                            "item_name",
                            selected.item_name ?? "",
                          );

                          // تحديث k إذا كان موجوداً في الصنف
                          if (selected.k !== undefined && selected.k !== null) {
                            updateGoldDetail(index, "k", selected.k);
                          }
                        }}
                      />
                    </td>
                    <td className="p-0 border">
                      <input
                        className="w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0"
                        disabled={!isEditing}
                        readOnly={!isEditing}
                        style={{
                          MozAppearance: "textfield",
                          WebkitAppearance: "none",
                          appearance: "none",
                        }}
                        type="number"
                        value={detail.k || ""}
                        onChange={(e) =>
                          updateGoldDetail(
                            index,
                            "k",
                            e.target.value
                              ? parseFloat(e.target.value)
                              : undefined,
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
                      <input
                        className="w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0"
                        disabled={!isEditing}
                        readOnly={!isEditing}
                        style={{
                          MozAppearance: "textfield",
                          WebkitAppearance: "none",
                          appearance: "none",
                        }}
                        type="number"
                        value={detail.weight || ""}
                        onChange={(e) =>
                          updateGoldDetail(
                            index,
                            "weight",
                            e.target.value
                              ? parseFloat(e.target.value)
                              : undefined,
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
                      <input
                        className="w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0"
                        disabled={!isEditing}
                        readOnly={!isEditing}
                        style={{
                          MozAppearance: "textfield",
                          WebkitAppearance: "none",
                          appearance: "none",
                        }}
                        type="number"
                        value={detail.g_weight || ""}
                        onChange={(e) =>
                          updateGoldDetail(
                            index,
                            "g_weight",
                            e.target.value
                              ? parseFloat(e.target.value)
                              : undefined,
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
                    {/* معدل الأجور */}
                    <td className="p-0 border">
                      <input
                        className="w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0"
                        disabled={!isEditing}
                        readOnly={!isEditing}
                        step="0.01"
                        style={{
                          MozAppearance: "textfield",
                          WebkitAppearance: "none",
                          appearance: "none",
                        }}
                        type="number"
                        value={detail.work_amt || ""}
                        onChange={(e) =>
                          updateGoldDetail(
                            index,
                            "work_amt",
                            e.target.value
                              ? parseFloat(e.target.value)
                              : undefined,
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
                    {/* الأجور (محسوبة تلقائياً) */}
                    <td className="p-0 border">
                      <input
                        className="w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0 bg-yellow-50"
                        disabled={true}
                        readOnly={true}
                        step="0.01"
                        style={{
                          MozAppearance: "textfield",
                          WebkitAppearance: "none",
                          appearance: "none",
                        }}
                        title="يُحسب تلقائياً من: معدل الأجور × الوزن القائم"
                        type="number"
                        value={detail.total_work || ""}
                      />
                    </td>
                    <td className="p-0 border">
                      <select
                        className="w-full h-full text-xs border-0 rounded-none focus:outline-none focus:ring-0"
                        disabled={!isEditing}
                        value={detail.box_id || ""}
                        onChange={(e) =>
                          updateGoldDetail(
                            index,
                            "box_id",
                            e.target.value
                              ? parseInt(e.target.value)
                              : undefined,
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
                        value={detail.notes || ""}
                        onChange={(e) =>
                          updateGoldDetail(index, "notes", e.target.value)
                        }
                      />
                    </td>
                    <td className="p-0 border">
                      <input
                        className="w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0"
                        disabled={!isEditing}
                        readOnly={!isEditing}
                        style={{
                          MozAppearance: "textfield",
                          WebkitAppearance: "none",
                          appearance: "none",
                        }}
                        type="number"
                        value={detail.diff || ""}
                        onChange={(e) =>
                          updateGoldDetail(
                            index,
                            "diff",
                            e.target.value
                              ? parseFloat(e.target.value)
                              : undefined,
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
                      <input
                        className="w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0"
                        disabled={!isEditing}
                        readOnly={!isEditing}
                        style={{
                          MozAppearance: "textfield",
                          WebkitAppearance: "none",
                          appearance: "none",
                        }}
                        type="number"
                        value={detail.close_amt || ""}
                        onChange={(e) =>
                          updateGoldDetail(
                            index,
                            "close_amt",
                            e.target.value
                              ? parseFloat(e.target.value)
                              : undefined,
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
                      <input
                        className="w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0"
                        disabled={!isEditing}
                        readOnly={!isEditing}
                        style={{
                          MozAppearance: "textfield",
                          WebkitAppearance: "none",
                          appearance: "none",
                        }}
                        type="number"
                        value={detail.close_weight || ""}
                        onChange={(e) =>
                          updateGoldDetail(
                            index,
                            "close_weight",
                            e.target.value
                              ? parseFloat(e.target.value)
                              : undefined,
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
                        value={detail.inv_id || ""}
                        onChange={(e) =>
                          updateGoldDetail(
                            index,
                            "inv_id",
                            e.target.value
                              ? parseInt(e.target.value)
                              : undefined,
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
                        value={detail.cost_id || ""}
                        onChange={(e) =>
                          updateGoldDetail(
                            index,
                            "cost_id",
                            e.target.value
                              ? parseInt(e.target.value)
                              : undefined,
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
                        onClick={() => removeGoldDetailRow(index)}
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

      {/* Cash Table */}
      <div className="bg-white rounded-lg border border-slate-200 mb-2">
        <div className="p-1.5 border-b border-slate-200 bg-slate-50">
          <h3 className="text-sm font-semibold text-slate-800">النقدية</h3>
        </div>
        <div className="p-1">
          <div className="flex justify-between mb-1">
            <button
              className="btn"
              disabled={!isEditing}
              type="button"
              onClick={addVoucherBoxRow}
            >
              + صف
            </button>
          </div>
          <div className="overflow-x-auto mb-1 max-w-full">
            <table className="min-w-[1000px] border text-xs text-center table-fixed">
              <thead className="bg-gray-100 text-xs font-bold">
                <tr>
                  <th className="w-32 p-1 border">المبلغ</th>
                  <th className="w-48 p-1 border">الصندوق</th>
                  <th className="w-80 p-1 border">البيان</th>
                  <th className="w-32 p-1 border">وزن التسكير</th>
                  <th className="w-32 p-1 border">رقم الفاتورة</th>
                  <th className="w-48 p-1 border">مركز التكلفة</th>
                  <th className="w-12 p-1 border">حذف</th>
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
                        value={
                          box.box_id && box.box_id > 0 ? String(box.box_id) : ""
                        }
                        onChange={(e) => {
                          const selectedBoxId = e.target.value
                            ? parseInt(e.target.value)
                            : 0;

                          updateVoucherBox(index, "box_id", selectedBoxId);
                        }}
                      >
                        <option value="">اختر الصندوق</option>
                        {boxes.map((b) => (
                          <option key={b.id} value={String(b.id)}>
                            {b.cust_name ||
                              b.name ||
                              box.box?.cust_name ||
                              `صندوق ${b.id}`}
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
                      <input
                        className="w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0"
                        disabled={!isEditing}
                        readOnly={!isEditing}
                        style={{
                          MozAppearance: "textfield",
                          WebkitAppearance: "none",
                          appearance: "none",
                        }}
                        type="number"
                        value={box.close_weight || ""}
                        onChange={(e) =>
                          updateVoucherBox(
                            index,
                            "close_weight",
                            e.target.value
                              ? parseFloat(e.target.value)
                              : undefined,
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
                            e.target.value
                              ? parseInt(e.target.value)
                              : undefined,
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

      {/* Totals */}
      <div className="bg-gray-50 rounded-lg p-2 border border-gray-200 mt-2">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-gray-700 font-medium">
              إجمالي الذهب (القائم):
            </span>
            <span className="font-semibold text-yellow-600">
              {totals.totalGoldWeight.toFixed(5)} جم
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-amber-800 font-medium">
              إجمالي الذهب (المعاير):
            </span>
            <span className="font-semibold text-yellow-600">
              {totals.totalGoldGWeight.toFixed(5)} جم
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-amber-800 font-medium">إجمالي الأجور:</span>
            <span className="font-semibold text-yellow-600">
              {formatAmount(totals.totalWork)}
              <RiyalIcon color="currentColor" />
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-700 font-medium">إجمالي النقدية:</span>
            <span className="font-semibold text-blue-700 flex items-center gap-1">
              {formatAmount(totals.totalBoxes)}
              <RiyalIcon color="currentColor" />
            </span>
          </div>
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
