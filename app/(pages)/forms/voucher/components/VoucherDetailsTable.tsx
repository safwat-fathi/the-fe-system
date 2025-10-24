"use client";

import AsyncCreatableSelect from "react-select/async-creatable";

import { VoucherDetail } from "@/types/voucher";
import { searchAccountsAction } from "@/app/actions/accounts.action";

interface VoucherDetailsTableProps {
  details: VoucherDetail[];
  accounts: any[];
  costCenters: any[];
  isBalanced: boolean;
  onAddRow: () => void;
  onRemoveRow: (index: number) => void;
  onUpdateDetail: (
    index: number,
    field: keyof VoucherDetail,
    value: any,
  ) => void;
  onUpdateAccountsList: (newAccount: any) => void;
}

export default function VoucherDetailsTable({
  details,
  accounts,
  costCenters,
  isBalanced,
  onAddRow,
  onRemoveRow,
  onUpdateDetail,
  onUpdateAccountsList,
}: VoucherDetailsTableProps) {
  // دالة تحميل خيارات الحسابات مع البحث
  const loadAccountOptions = async (search: string): Promise<any[]> => {
    try {
      // استخدام Server Action لجلب الحسابات مع المصادقة الصحيحة
      const result = await searchAccountsAction(search);
      
      if (!result.success) {
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
          <button
            className="h-8 px-4 text-sm bg-blue-600 text-white hover:bg-blue-700 border border-blue-600 rounded-md shadow-sm font-medium"
            onClick={onAddRow}
          >
            <i className="bi bi-plus-circle me-1" />
            إضافة صف
          </button>
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
            {isBalanced ? "متوازن" : "غير متوازن"}
          </span>
        </div>
      </div>

      <div className="p-2">
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
                  className="w-20 p-0.5 font-bold text-slate-700 border"
                  rowSpan={2}
                >
                  الضريبة
                </th>
                <th
                  className="w-20 p-0.5 font-bold text-slate-700 border"
                  rowSpan={2}
                >
                  نسبة الضريبة
                </th>
                <th
                  className="w-20 p-0.5 font-bold text-slate-700 border"
                  rowSpan={2}
                >
                  الرقم الضريبي
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
                  <td className="p-0.5 border">
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
                      loadOptions={loadAccountOptions}
                      menuPortalTarget={
                        typeof window !== "undefined" ? document.body : null
                      }
                      menuPosition="fixed"
                      placeholder="اختر الحساب..."
                      styles={{
                        control: (base) => ({
                          ...base,
                          minHeight: 30,
                          height: 30,
                        }),
                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                      }}
                      value={getAccountSelectValue(detail)}
                      onChange={(selectedOption) => {
                        // selectedOption may carry full account data via `account` field
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

                  <td className="p-0.5 border">
                    <input
                      className="border w-full p-0.5 text-xs text-center appearance-none"
                      placeholder="0.00"
                      step="0.01"
                      type="number"
                      value={String(detail.debit || 0)}
                      onChange={(e) =>
                        onUpdateDetail(
                          index,
                          "debit",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                    />
                  </td>

                  <td className="p-0.5 border">
                    <input
                      className="border w-full p-0.5 text-xs text-center appearance-none"
                      placeholder="0.00"
                      step="0.01"
                      type="number"
                      value={String(detail.credit || 0)}
                      onChange={(e) =>
                        onUpdateDetail(
                          index,
                          "credit",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                    />
                  </td>

                  <td className="p-1 border">
                    <input
                      className="border w-full p-1 text-xs text-center appearance-none"
                      placeholder="0.00"
                      step="0.01"
                      type="number"
                      value={String(detail.debit_g || 0)}
                      onChange={(e) =>
                        onUpdateDetail(
                          index,
                          "debit_g",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                    />
                  </td>

                  <td className="p-0.5 border">
                    <input
                      className="border w-full p-0.5 text-xs text-center appearance-none"
                      placeholder="0.00"
                      step="0.01"
                      type="number"
                      value={String(detail.credit_g || 0)}
                      onChange={(e) =>
                        onUpdateDetail(
                          index,
                          "credit_g",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                    />
                  </td>

                  <td className="p-0.5 border">
                    <input
                      className="border w-full p-0.5 text-xs text-center appearance-none"
                      placeholder="875"
                      type="number"
                      value={String(detail.gauge || 875)}
                      onChange={(e) =>
                        onUpdateDetail(
                          index,
                          "gauge",
                          parseInt(e.target.value) || 875,
                        )
                      }
                    />
                  </td>

                  <td className="p-0.5 border">
                    <input
                      className="border w-full p-0.5 text-xs text-center appearance-none"
                      placeholder="0.00"
                      step="0.01"
                      type="number"
                      value={String(detail.tax || 0)}
                      onChange={(e) =>
                        onUpdateDetail(
                          index,
                          "tax",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                    />
                  </td>

                  <td className="p-0.5 border">
                    <input
                      className="border w-full p-0.5 text-xs text-center appearance-none"
                      placeholder="0.00"
                      step="0.01"
                      type="number"
                      value={String(detail.tax_prc || 0)}
                      onChange={(e) =>
                        onUpdateDetail(
                          index,
                          "tax_prc",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                    />
                  </td>

                  <td className="p-1 border">
                    <input
                      className="border w-full p-1 text-xs text-center appearance-none"
                      placeholder="0"
                      type="number"
                      value={String(detail.vat_no || 0)}
                      onChange={(e) =>
                        onUpdateDetail(
                          index,
                          "vat_no",
                          parseInt(e.target.value) || 0,
                        )
                      }
                    />
                  </td>

                  {costCenters.length > 0 && (
                    <td className="p-1 border">
                      <select
                        className="w-full text-xs border border-slate-300 rounded px-2 py-1 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
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
                            {center.name}
                          </option>
                        ))}
                      </select>
                    </td>
                  )}

                  <td className="p-1 border">
                    <input
                      className="border w-full p-1 text-xs text-center appearance-none"
                      placeholder="البيان"
                      type="text"
                      value={detail.vouch_notes || ""}
                      onChange={(e) =>
                        onUpdateDetail(index, "vouch_notes", e.target.value)
                      }
                    />
                  </td>

                  <td className="p-1 border">
                    <button
                      className="h-6 w-6 text-xs bg-transparent text-red-600 hover:text-red-800 hover:bg-red-50 border border-red-200 rounded-sm flex items-center justify-center"
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
