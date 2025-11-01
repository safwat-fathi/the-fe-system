"use client";

import AsyncCreatableSelect from "react-select/async-creatable";

import { VoucherDetail } from "@/types/voucher";
import { searchAccountsAction } from "@/app/actions/accounts.action";

interface BalanceVoucherDetailsTableProps {
  details: VoucherDetail[];
  accounts: any[];
  costCenters: any[];
  caratTypes?: any[];
  taxRates?: number[];
  isBalanced: boolean;
  isEditing?: boolean;
  onAddRow: () => void;
  onRemoveRow: (index: number) => void;
  onUpdateDetail: (
    index: number,
    field: keyof VoucherDetail,
    value: any,
  ) => void;
  onUpdateAccountsList: (newAccount: any) => void;
}

export default function BalanceVoucherDetailsTable({
  details,
  accounts,
  costCenters,
  caratTypes = [],
  taxRates = [],
  isBalanced,
  isEditing = true,
  onAddRow,
  onRemoveRow,
  onUpdateDetail,
  onUpdateAccountsList,
}: BalanceVoucherDetailsTableProps) {
  // دالة تحميل خيارات الحسابات مع البحث
  const loadAccountOptions = async (search: string): Promise<any[]> => {
    try {
      // استخدام Server Action لجلب الحسابات مع المصادقة الصحيحة
      const result = await searchAccountsAction(search);

      if (!result.success) {
        console.error("❌ فشل في جلب الحسابات:", result.error);

        return [];
      }

      const filteredAccounts = result.data;
      const term = search.toLowerCase();

      // ترتيب النتائج حسب الأفضلية
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
      console.error("failed to load accounts", e);

      return [];
    }
  };

  // دالة الحصول على قيمة الحساب المحدد
  const getAccountSelectValue = (detail: VoucherDetail) => {
    if (!detail.acc_id) return null;

    // إذا كانت acc_code و acc_name محفوظة في detail، استخدمها
    if (detail.acc_code && detail.acc_name) {
      return {
        value: detail.acc_id,
        label: `${detail.acc_code} - ${detail.acc_name}`,
      };
    }

    // وإلا ابحث في قائمة الحسابات المحملة
    const account = accounts.find((acc) => acc.id === detail.acc_id);

    if (account) {
      return {
        value: detail.acc_id,
        label: `${account.acc_code ?? ""} - ${account.acc_name ?? ""}`,
      };
    }

    // إذا لم يجد الحساب، اعرض فقط الـ ID
    return {
      value: detail.acc_id,
      label: `حساب رقم: ${detail.acc_id}`,
    };
  };

  return (
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
            onClick={onAddRow}
          >
            + صف
          </button>
        </div>
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

                        // cache option in accounts list if not already present
                        if (!accounts.find((a) => a.id === selected.id)) {
                          onUpdateAccountsList(selected);
                        }

                        // تحديث جميع بيانات الحساب
                        onUpdateDetail(index, "acc_id", selected.id ?? null);
                        onUpdateDetail(
                          index,
                          "acc_code",
                          selected.acc_code ?? selected.code ?? "",
                        );
                        onUpdateDetail(
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
                          onUpdateDetail(
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
                          onUpdateDetail(
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
                          onUpdateDetail(
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
                          onUpdateDetail(
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

                  {costCenters.length > 0 && (
                    <td className="p-0 border">
                      <select
                        className={`w-full h-full text-xs border-0 rounded-none focus:outline-none focus:ring-0 ${!isEditing ? "cursor-not-allowed" : ""}`}
                        disabled={!isEditing}
                        value={detail.cost_id || ""}
                        onChange={(e) =>
                          onUpdateDetail(
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
                        onUpdateDetail(index, "vouch_notes", e.target.value)
                      }
                    />
                  </td>

                  <td className="p-1 border">
                    <button
                      className="font-bold text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                      disabled={!isEditing}
                      tabIndex={-1}
                      title="حذف السطر"
                      onClick={() => onRemoveRow(index)}
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
  );
}
