"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import AsyncCreatableSelect from "react-select/async-creatable";
import toast from "react-hot-toast";
import {
  CheckIcon,
  PencilIcon,
  PrinterIcon,
  DocumentTextIcon,
  PlusIcon,
  ArrowsPointingOutIcon,
} from "@heroicons/react/24/outline";
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

import GLTransactionModal from "../components/GLTransactionModal";

import { Voucher, VoucherDetail, VoucherBox } from "@/types/voucher";
import { useCashReceiptVoucherForm } from "@/hooks/useCashReceiptVoucherForm";
import { useGLTransactions } from "@/hooks/useGLTransactions";
import { RiyalIcon } from "@/components/RiyalIcon";
import { formatAmount } from "@/utilities/formatAmount";
import { voucherService } from "@/services/api";

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
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);

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
    handleMasterCostChange,
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
              onPress={() => {
                // تحديد المسار بناءً على pathname أو vouchType
                const basePath = pathname?.includes("/voucher2")
                  ? "/forms/voucher2"
                  : "/forms/voucher1";
                router.push(basePath);
              }}
              startContent={<PlusIcon className="h-4 w-4" />}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 min-w-[90px]"
            >
              جديد
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

            <Button
              size="sm"
              variant="solid"
              isDisabled={!voucher.vouch_id || voucher.vouch_id <= 0}
              onPress={handleViewGLTransactions}
              startContent={<DocumentTextIcon className="h-4 w-4" />}
              className="bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 min-w-[140px]"
            >
              القيد المحاسبي
            </Button>
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-2">
        {/* رقم المرجع */}
        <div className="md:col-span-1">
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

        {/* التاريخ والوقت */}
        <div className="md:col-span-1">
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

        {costCenters.length > 0 && (
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-slate-700 mb-0.5">
              مركز التكلفة
            </label>
            <select
              className="w-full h-8 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2"
              disabled={!isEditing}
              value={
                voucher.cost_id && voucher.cost_id > 0
                  ? String(voucher.cost_id)
                  : ""
              }
              onChange={(e) => {
                const selected = e.target.value ? Number(e.target.value) : null;
                handleMasterCostChange(
                  selected !== null && Number.isFinite(selected)
                    ? selected
                    : null,
                );
              }}
            >
              <option value="">اختر مركز التكلفة</option>
              {costCenters.map((center) => (
                <option key={center.id} value={String(center.id)}>
                  {center.name || center.cost_name || `مركز ${center.id}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* الحالة */}
        <div className="md:col-span-1">
          <label className="block text-xs font-medium text-slate-700 mb-0.5">
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

      {/* البيان */}
      <div className="mb-2">
        <label className="block text-xs font-medium text-slate-700 mb-0.5">
          البيان
        </label>
        <div className="relative">
          <input
            className="w-full h-8 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500 px-2 pr-8"
            disabled={!isEditing}
            readOnly={!isEditing}
            type="text"
            placeholder="أدخل بيان القيد (انقر نقرتين للكتابة المطولة)"
            value={voucher.vouch_notes || ""}
            onChange={(e) =>
              setVoucher((prev) => ({ ...prev, vouch_notes: e.target.value }))
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
              className="absolute left-1 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-all duration-200"
              title="توسيع البيان"
            >
              <ArrowsPointingOutIcon className="h-3 w-3" />
            </button>
          )}
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
            <table className="min-w-[1200px] border text-xs text-center table-fixed">
              <thead className="bg-gray-100 text-xs font-bold">
                <tr>
                  <th className="w-32 p-1 border">المبلغ</th>
                  <th className="w-48 p-1 border">الصندوق</th>
                  <th className="w-80 p-1 border">البيان</th>
                  <th className="w-48 p-1 border">مركز التكلفة</th>
                  <th className="w-32 p-1 border">رقم الفاتورة</th>
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
      <div className="bg-white rounded-lg border border-slate-200 mb-2">
        <div className="p-1.5 border-b border-slate-200 bg-slate-50">
          <h3 className="text-sm font-semibold text-slate-800">الحسابات</h3>
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
          <div className="overflow-x-auto mb-1 max-w-full">
            <table className="min-w-[1200px] border text-xs text-center table-fixed">
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
      <div className="mt-2 bg-gray-50 rounded-lg p-2 border border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
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
      <GLTransactionModal
        getAccountName={getAccountName}
        isOpen={isGLModalOpen}
        loading={loadingGLTransactions}
        refNo={voucher.ref_no}
        transactions={glTransactions}
        voucherId={voucher.vouch_id || 0}
        onClose={() => setIsGLModalOpen(false)}
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
