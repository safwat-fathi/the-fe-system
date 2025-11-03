"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import AsyncCreatableSelect from "react-select/async-creatable";
import toast from "react-hot-toast";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/react";

import { Voucher, VoucherDetail, VoucherBox } from "@/types/voucher";
import { useCashReceiptVoucherForm } from "@/hooks/useCashReceiptVoucherForm";
import { RiyalIcon } from "@/components/RiyalIcon";
import { formatAmount } from "@/utilities/formatAmount";
import { voucherService, glTransactionService } from "@/services/api";
import { GLTransaction } from "@/types/models/gl-transaction";

import "bootstrap-icons/font/bootstrap-icons.css";

interface CashReceiptVoucherClientPageProps {
  voucherData?: Voucher | null;
  voucherDetailsData?: VoucherDetail[];
  voucherBoxes?: VoucherBox[];
  isNewVoucher?: boolean;
  voucherRecordId?: number | string | null;
  accounts: any[];
  boxes: any[];
  costCenters: any[];
  voucherTypes: any[];
  voucherStatuses: any[];
  startInEditMode?: boolean;
  vouchType: number; // 1 للقبض، 2 للصرف
  formMode?: "new" | "edit" | "preview";
}

export default function CashReceiptVoucherClientPage({
  voucherData,
  voucherDetailsData,
  voucherBoxes: initialVoucherBoxes = [],
  isNewVoucher = true,
  voucherRecordId,
  accounts: initialAccounts,
  boxes: initialBoxes,
  costCenters: initialCostCenters,
  voucherTypes: initialVoucherTypes,
  voucherStatuses: initialVoucherStatuses,
  startInEditMode = false,
  vouchType,
  formMode = "new",
}: CashReceiptVoucherClientPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Handle search - must be before any conditional returns (Rules of Hooks)
  const [searchTerm, setSearchTerm] = useState("");

  // State للمودال والقيد المحاسبي
  const [isGLModalOpen, setIsGLModalOpen] = useState(false);
  const [glTransactions, setGlTransactions] = useState<GLTransaction[]>([]);
  const [loadingGLTransactions, setLoadingGLTransactions] = useState(false);

  // Use the hook for all state management and business logic
  const {
    // State
    voucher,
    setVoucher,
    voucherBoxes,
    details,
    accounts,
    setAccounts,
    boxes,
    costCenters,
    voucherTypes,
    voucherStatuses,
    isLoading,
    isEditing,
    setIsEditing,
    isPrinting,
    currentTime,
    isClient,

    // Totals and balance
    totals,
    balance,
    isBalanced,

    // Functions
    updateVoucherBox,
    addVoucherBoxRow,
    removeVoucherBoxRow,
    updateDetail,
    addDetailRow,
    removeDetailRow,
    saveVoucher,
    printVoucher,
    loadAccountOptions,
    getAccountSelectValue,
    updateAccountsList,
  } = useCashReceiptVoucherForm({
    voucherData,
    voucherDetailsData,
    voucherBoxes: initialVoucherBoxes,
    isNewVoucher,
    voucherRecordId,
    accounts: initialAccounts,
    boxes: initialBoxes,
    costCenters: initialCostCenters,
    voucherTypes: initialVoucherTypes,
    voucherStatuses: initialVoucherStatuses,
    startInEditMode,
    vouchType,
    formMode,
  });

  // دالة جلب القيد المحاسبي (فقط للحركة الحالية)
  const loadGLTransactions = async () => {
    if (!voucher.vouch_id || voucher.vouch_id <= 0) {
      return;
    }

    setLoadingGLTransactions(true);
    try {
      const response = await glTransactionService.getAll({
        xtrans_id: voucher.vouch_id,
        xtrans_type: vouchType, // 1 للقبض، 2 للصرف
        xcom_id: 1,
        xyear_id: 0,
        xfrom_date: 0,
        xto_date: 0,
      });

      if (response.success && response.data) {
        const transactions = Array.isArray(response.data) ? response.data : [];
        const filteredTransactions = transactions.filter(
          (trans: GLTransaction) =>
            trans.trans_id === voucher.vouch_id && trans.trans_type === vouchType,
        );
        setGlTransactions(filteredTransactions);
      } else {
        setGlTransactions([]);
      }
    } catch (error) {
      console.error("Error loading GL transactions:", error);
      setGlTransactions([]);
    } finally {
      setLoadingGLTransactions(false);
    }
  };

  // فتح المودال عند الضغط على الزر
  const handleViewGLTransactions = async () => {
    setIsGLModalOpen(true);
    await loadGLTransactions();
  };

  if (!isClient) {
    return (
      <div className="flex justify-center items-center h-screen">
        جاري التحميل...
      </div>
    );
  }

  // Handle search
  const handleSearch = async () => {
    if (!searchTerm || searchTerm.trim() === "") {
      toast.error("يرجى إدخال رقم السند للبحث");

      return;
    }

    const searchValue = searchTerm.trim();

    try {
      // البحث في السندات بنفس النوع (قبض أو صرف)
      const vouchersResponse = await voucherService.getAll({
        xvouch_type: vouchType.toString(), // 1 للقبض، 2 للصرف
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

        // إذا لم نجد مطابقة دقيقة، نبحث عن سندات تحتوي على الرقم
        if (!foundVoucher) {
          foundVoucher = vouchers.find(
            (v: any) =>
              v.vouch_id?.toString().includes(searchValue) ||
              v.id?.toString().includes(searchValue),
          );
        }

        if (foundVoucher) {
          // استخدام id الحقيقي (primary key) للانتقال إلى صفحة السند
          const targetId = foundVoucher.id || foundVoucher.vouch_id;

          if (targetId) {
            const basePath =
              vouchType === 1 ? "/forms/voucher1" : "/forms/voucher2";

            router.push(`${basePath}/${targetId}?mode=preview`);
            setSearchTerm(""); // مسح حقل البحث

            return;
          }
        }
      }

      // إذا لم نجد في السندات من نفس النوع، نبحث في جميع أنواع السندات
      console.log(
        "لم يتم العثور على سند من نفس النوع، البحث في جميع السندات...",
      );
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
          // التحقق من نوع السند
          if (foundAny.vouch_type !== vouchType) {
            const voucherTypeName = vouchType === 1 ? "سند قبض" : "سند صرف";

            toast.error(
              `السند الموجود (${foundAny.vouch_id}) ليس من نوع ${voucherTypeName}`,
            );

            return;
          }

          const targetId = foundAny.id || foundAny.vouch_id;

          if (targetId) {
            const basePath =
              vouchType === 1 ? "/forms/voucher1" : "/forms/voucher2";

            router.push(`${basePath}/${targetId}?mode=preview`);
            setSearchTerm("");

            return;
          }
        }
      }

      // إذا لم نجد السند نهائياً
      const voucherTypeName = vouchType === 1 ? "سند قبض" : "سند صرف";

      toast.error(`لم يتم العثور على ${voucherTypeName} برقم: ${searchValue}`);
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
      const basePath = vouchType === 1 ? "/forms/voucher1" : "/forms/voucher2";

      router.push(`${basePath}/${voucherRecordId}?mode=edit`);
    }
  };

  const voucherTypeName =
    voucherTypes.find((t) => (t.Id || t.id) === vouchType)?.name ||
    (vouchType === 1 ? "سند قبض" : "سند صرف");

  return (
    <div className="p-3 max-w-[1500px] mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-3 mb-4 border border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-4">
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

        <div className="flex items-center justify-between">
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

            {/* زر "جديد" */}
            <button
              className="h-7 px-3 text-xs bg-blue-600 text-white hover:bg-blue-700 border border-blue-600 rounded-md shadow-sm"
              onClick={() => {
                router.push("/forms/voucher1");
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
              <i className="bi bi-printer w-4 h-4 me-1" />
              طباعة
            </button>

            <button
              className="h-7 px-3 text-xs bg-indigo-600 text-white hover:bg-indigo-700 border border-indigo-600 rounded-md shadow-sm disabled:opacity-50"
              disabled={!voucher.vouch_id || voucher.vouch_id <= 0}
              onClick={handleViewGLTransactions}
              title="عرض القيد المحاسبي"
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
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
          <label className="block text-xs font-medium text-slate-700 mb-1">
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
          <label className="block text-xs font-medium text-slate-700 mb-1">
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

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            الحالة
          </label>
          <select
            className="w-full h-8 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2"
            disabled={!isEditing}
            value={String(voucher.vouch_status ?? 1)}
            onChange={(e) =>
              setVoucher((prev) => ({
                ...prev,
                vouch_status: parseInt(e.target.value) || 1,
              }))
            }
          >
            {voucherStatuses &&
            Array.isArray(voucherStatuses) &&
            voucherStatuses.length > 0 ? (
              voucherStatuses.map((status) => {
                const statusValue =
                  status.code_id !== undefined && status.code_id !== null
                    ? String(status.code_id)
                    : String(status.id || status.Id || "");
                const statusLabel =
                  status.code_desc ||
                  status["Code Desc"] ||
                  status.name ||
                  "غير محدد";

                return (
                  <option key={status.id || status.Id} value={statusValue}>
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
      </div>

      {/* Cash Table */}
      <div className="bg-white rounded-lg border border-slate-200 mb-4">
        <div className="p-3 border-b border-slate-200 bg-slate-50">
          <h3 className="text-base font-semibold text-slate-800">النقدية</h3>
        </div>
        <div className="p-2">
          <div className="flex justify-between mb-2">
            <button
              className="btn"
              disabled={!isEditing}
              type="button"
              onClick={addVoucherBoxRow}
            >
              + صف
            </button>
          </div>
          <div className="overflow-x-auto mb-3 max-w-full">
            <table className="min-w-[1200px] border text-sm text-center table-fixed">
              <thead className="bg-gray-100 text-xs font-bold">
                <tr>
                  <th className="w-32 p-2 border">المبلغ</th>
                  <th className="w-48 p-2 border">الصندوق</th>
                  <th className="w-80 p-2 border">البيان</th>
                  <th className="w-48 p-2 border">مركز التكلفة</th>
                  <th className="w-32 p-2 border">رقم الفاتورة</th>
                  <th className="w-12 p-2 border">حذف</th>
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
                          const selectedBox = boxes.find(
                            (b) => b.id === selectedBoxId,
                          );

                          updateVoucherBox(index, "box_id", selectedBoxId);
                          // تحديث معلومات box object إذا كان الصندوق محدداً
                          if (selectedBox) {
                            updateVoucherBox(index, "box", {
                              id: selectedBox.id,
                              cust_name:
                                selectedBox.cust_name || selectedBox.name || "",
                              cust_code: selectedBox.cust_code || "",
                              box_type: selectedBox.box_type,
                            });
                          }
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
                      <select
                        className="w-full h-full text-xs border-0 rounded-none focus:outline-none focus:ring-0"
                        disabled={!isEditing}
                        value={
                          box.cost_id && box.cost_id > 0
                            ? String(box.cost_id)
                            : ""
                        }
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
                          <option key={center.id} value={String(center.id)}>
                            {center.name ||
                              center.cost_name ||
                              `مركز ${center.id}`}
                          </option>
                        ))}
                      </select>
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

      {/* Details Table */}
      <div className="bg-white rounded-lg border border-slate-200 mb-4">
        <div className="p-3 border-b border-slate-200 bg-slate-50">
          <h3 className="text-base font-semibold text-slate-800">الحسابات</h3>
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
          <div className="overflow-x-auto mb-3 max-w-full">
            <table className="min-w-[1200px] border text-sm text-center table-fixed">
              <thead className="bg-gray-100 text-xs font-bold">
                <tr>
                  <th className="w-80 p-2 border">الحساب</th>
                  <th className="w-32 p-2 border">المبلغ</th>
                  <th className="w-80 p-2 border">البيان</th>
                  <th className="w-48 p-2 border">مركز التكلفة</th>
                  <th className="w-12 p-2 border">حذف</th>
                </tr>
              </thead>
              <tbody>
                {details.map((detail, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-0 border">
                      <AsyncCreatableSelect
                        isClearable
                        isSearchable
                        className="text-xs"
                        classNamePrefix="select"
                        components={{ IndicatorSeparator: () => null }}
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
                        className="w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0"
                        disabled={!isEditing}
                        min="0"
                        placeholder="0.00"
                        readOnly={!isEditing}
                        style={{
                          MozAppearance: "textfield",
                          WebkitAppearance: "none",
                          appearance: "none",
                        }}
                        type="number"
                        value={
                          vouchType === 1
                            ? detail.credit || ""
                            : detail.debit || ""
                        }
                        onChange={(e) => {
                          const val = e.target.value;

                          if (!val || parseFloat(val) >= 0) {
                            if (vouchType === 1) {
                              // سند قبض: المبلغ في credit
                              updateDetail(
                                index,
                                "credit",
                                val ? parseFloat(val) : undefined,
                              );
                              updateDetail(index, "debit", undefined);
                            } else {
                              // سند صرف: المبلغ في debit
                              updateDetail(
                                index,
                                "debit",
                                val ? parseFloat(val) : undefined,
                              );
                              updateDetail(index, "credit", undefined);
                            }
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
                        className="w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0"
                        disabled={!isEditing}
                        readOnly={!isEditing}
                        type="text"
                        value={detail.vouch_notes || ""}
                        onChange={(e) =>
                          updateDetail(index, "vouch_notes", e.target.value)
                        }
                      />
                    </td>
                    <td className="p-0 border">
                      <select
                        className="w-full h-full text-xs border-0 rounded-none focus:outline-none focus:ring-0"
                        disabled={!isEditing}
                        value={
                          detail.cost_id !== null &&
                          detail.cost_id !== undefined &&
                          detail.cost_id > 0
                            ? String(detail.cost_id)
                            : ""
                        }
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
                          <option key={center.id} value={String(center.id)}>
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

      {/* Totals */}
      <div className="mt-4 bg-gray-50 rounded-lg p-3 border border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-700 font-medium">إجمالي النقدية:</span>
            <span className="font-semibold text-blue-700 flex items-center gap-1">
              {formatAmount(totals.totalBoxes)}
              <RiyalIcon color="currentColor" />
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-700 font-medium">إجمالي التفاصيل:</span>
            <span className="font-semibold text-green-700 flex items-center gap-1">
              {formatAmount(totals.totalDetails)}
              <RiyalIcon color="currentColor" />
            </span>
          </div>

          {!isBalanced && (
            <div className="flex items-center gap-2">
              <span className="text-gray-700 font-medium">الفارق:</span>
              <span className="font-semibold text-red-700 flex items-center gap-1">
                {formatAmount(Math.abs(balance))}
                <RiyalIcon color="currentColor" />
                <span className="text-xs text-red-600">
                  ({balance > 0 ? "مدين" : "دائن"})
                </span>
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="text-gray-700 font-medium">الحالة:</span>
            <span
              className={`font-semibold ${
                isBalanced ? "text-green-700" : "text-red-700"
              }`}
            >
              {isBalanced ? "متزن" : "غير متزن"}
            </span>
          </div>
        </div>
      </div>

      {/* مودال عرض القيد المحاسبي */}
      <Modal
        isOpen={isGLModalOpen}
        onClose={() => setIsGLModalOpen(false)}
        size="5xl"
        scrollBehavior="inside"
      >
        <ModalContent className="max-h-[85vh]">
          <ModalHeader className="border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50">
            <div className="flex flex-col w-full">
              <h3 className="text-xl font-bold text-indigo-900">القيد المحاسبي</h3>
              <p className="text-sm text-gray-600 mt-1">
                القيد رقم: <span className="font-semibold">{voucher.vouch_id}</span>{" "}
                {voucher.ref_no && (
                  <>
                    - المرجع: <span className="font-semibold">{voucher.ref_no}</span>
                  </>
                )}
              </p>
            </div>
          </ModalHeader>
          <ModalBody className="p-4">
            {loadingGLTransactions ? (
              <div className="flex justify-center items-center py-12">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <span className="mr-4 text-gray-600">جاري التحميل...</span>
              </div>
            ) : glTransactions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <i className="bi bi-info-circle text-4xl mb-3 block text-gray-400" />
                <p className="text-lg">لا توجد سجلات ترحيل لهذا القيد</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table
                    aria-label="GL Transactions Table"
                    className="min-w-full"
                    removeWrapper
                  >
                    <TableHeader>
                      <TableColumn className="text-center">#</TableColumn>
                      <TableColumn className="text-center">الحساب</TableColumn>
                      <TableColumn className="text-center">البيان</TableColumn>
                      <TableColumn className="text-center">مدين</TableColumn>
                      <TableColumn className="text-center">دائن</TableColumn>
                      <TableColumn className="text-center">مدين أساس</TableColumn>
                      <TableColumn className="text-center">دائن أساس</TableColumn>
                      <TableColumn className="text-center">مدين ذهب</TableColumn>
                      <TableColumn className="text-center">دائن ذهب</TableColumn>
                      <TableColumn className="text-center">مدين معاير</TableColumn>
                      <TableColumn className="text-center">دائن معاير</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {glTransactions.map((transaction, index) => {
                        const debit = Number(transaction.debit || 0);
                        const credit = Number(transaction.credit || 0);
                        const debitBase = Number(transaction.debit_base || 0);
                        const creditBase = Number(transaction.credit_base || 0);
                        const gDebit = Number(transaction.g_debit || 0);
                        const gCredit = Number(transaction.g_credit || 0);
                        const gDebitBase = Number(transaction.g_debit_base || 0);
                        const gCreditBase = Number(transaction.g_credit_base || 0);

                        return (
                          <TableRow key={transaction.id || index}>
                            <TableCell className="text-center text-sm">
                              {transaction.seq || index + 1}
                            </TableCell>
                            <TableCell className="text-center text-sm font-medium">
                              {transaction.acc || "-"}
                            </TableCell>
                            <TableCell
                              className="text-sm max-w-[200px] truncate"
                              title={transaction.note || ""}
                            >
                              {transaction.note || "-"}
                            </TableCell>
                            <TableCell className="text-center">
                              {debit > 0 ? (
                                <span className="font-semibold text-gray-800">
                                  {formatAmount(debit)}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {credit > 0 ? (
                                <span className="font-semibold text-green-600">
                                  {formatAmount(credit)}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center text-sm">
                              {debitBase > 0 ? formatAmount(debitBase) : "-"}
                            </TableCell>
                            <TableCell className="text-center text-sm">
                              {creditBase > 0 ? formatAmount(creditBase) : "-"}
                            </TableCell>
                            <TableCell className="text-center text-sm">
                              {gDebit > 0 ? `${formatAmount(gDebit)} جم` : "-"}
                            </TableCell>
                            <TableCell className="text-center text-sm">
                              {gCredit > 0 ? `${formatAmount(gCredit)} جم` : "-"}
                            </TableCell>
                            <TableCell className="text-center text-sm">
                              {gDebitBase > 0
                                ? `${formatAmount(gDebitBase)} جم`
                                : "-"}
                            </TableCell>
                            <TableCell className="text-center text-sm">
                              {gCreditBase > 0
                                ? `${formatAmount(gCreditBase)} جم`
                                : "-"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {/* صف الإجماليات */}
                      {(() => {
                        const totals = glTransactions.reduce(
                          (acc, trans) => {
                            acc.totalDebit += Number(trans.debit || 0);
                            acc.totalCredit += Number(trans.credit || 0);
                            acc.totalDebitBase += Number(trans.debit_base || 0);
                            acc.totalCreditBase += Number(trans.credit_base || 0);
                            acc.totalGDebit += Number(trans.g_debit || 0);
                            acc.totalGCredit += Number(trans.g_credit || 0);
                            acc.totalGDebitBase += Number(trans.g_debit_base || 0);
                            acc.totalGCreditBase += Number(
                              trans.g_credit_base || 0,
                            );
                            return acc;
                          },
                          {
                            totalDebit: 0,
                            totalCredit: 0,
                            totalDebitBase: 0,
                            totalCreditBase: 0,
                            totalGDebit: 0,
                            totalGCredit: 0,
                            totalGDebitBase: 0,
                            totalGCreditBase: 0,
                          },
                        );

                        return (
                          <TableRow className="bg-gradient-to-r from-gray-50 to-slate-50 border-t-2 border-gray-300">
                            <TableCell
                              colSpan={3}
                              className="text-center font-bold text-base text-gray-800"
                            >
                              الإجمالي
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="font-bold text-gray-900">
                                {formatAmount(totals.totalDebit)}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="font-bold text-green-700">
                                {formatAmount(totals.totalCredit)}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="font-semibold text-gray-700">
                                {formatAmount(totals.totalDebitBase)}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="font-semibold text-gray-700">
                                {formatAmount(totals.totalCreditBase)}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="font-semibold text-gray-700">
                                {formatAmount(totals.totalGDebit)} جم
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="font-semibold text-gray-700">
                                {formatAmount(totals.totalGCredit)} جم
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="font-semibold text-gray-700">
                                {formatAmount(totals.totalGDebitBase)} جم
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="font-semibold text-gray-700">
                                {formatAmount(totals.totalGCreditBase)} جم
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })()}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
