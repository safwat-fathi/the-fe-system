"use client";

import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslations } from "next-intl";
import CreatableSelect from "react-select/creatable";
import { withAsyncPaginate } from "react-select-async-paginate";
import toast from "react-hot-toast";

import { Account } from "@/types/models/account";
import invoiceService from "@/services/api/invoice.service";
import {
  CreateInvoiceAccDto,
  UpdateInvoiceAccDto,
} from "@/types/models/invoice";

const AsyncCreatableSelect = withAsyncPaginate(CreatableSelect);

type AccountOption = {
  value: number;
  label: string;
  account: Account;
};

type AccountSelectAdditional = {
  page: number;
};

export interface AdditionalExpanseRow {
  localId: number;
  serverId: number | null;
  accountId: number | null;
  accountLabel: string;
  amount: string;
  description: string;
  isDeleted?: boolean;
}

export interface AdditionalExpansesTableHandle {
  saveRows: (params: {
    invoiceId: number;
    transType: number;
    companyId: number;
    userId: string;
  }) => Promise<boolean>;
  getRows: () => AdditionalExpanseRow[];
  setRows: (rows: AdditionalExpanseRow[]) => void;
}

interface Props {
  accounts: Account[];
  isEditing: boolean;
  initialRows?: AdditionalExpanseRow[];
}

const AdditionalExpansesTable = forwardRef<
  AdditionalExpansesTableHandle,
  Props
>(function AdditionalExpansesTable({ accounts, isEditing, initialRows }, ref) {
  const t = useTranslations("forms.invoices.selectors.additionalExpanses");

  const originalRowsRef = useRef<AdditionalExpanseRow[]>([]);

  const [rows, setRowsState] = useState<AdditionalExpanseRow[]>(() => {
    if (initialRows && initialRows.length > 0) {
      originalRowsRef.current = [...initialRows];
      return initialRows;
    }
    return [
      {
        localId: Date.now(),
        serverId: null,
        accountId: null,
        accountLabel: "",
        amount: "0.00",
        description: "",
      },
    ];
  });

  const [deletedServerIds, setDeletedServerIds] = useState<number[]>([]);

  const buildAccountOption = useCallback((acc: Account): AccountOption => {
    const code = acc.acc_code ?? String(acc.id);
    const name = acc.acc_name ?? "";
    const label = name ? `${code} - ${name}` : code;

    return {
      value: acc.id,
      label,
      account: acc,
    };
  }, []);

  const staticAccountOptions = useMemo(() => {
    return accounts.map((acc) => buildAccountOption(acc));
  }, [accounts, buildAccountOption]);

  const initialAccountAdditional = useMemo(() => ({ page: 1 }), []);

  const selectStyles = useMemo(
    () => ({
      control: (base: any) => ({
        ...base,
        minHeight: 32,
        height: 32,
      }),
      menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
    }),
    [],
  );

  const loadAccountOptions = useCallback(
    async (
      search: string,
      _loaded: AccountOption[],
      { page }: AccountSelectAdditional,
    ) => {
      if (!search) {
        return {
          options: staticAccountOptions,
          hasMore: false,
          additional: initialAccountAdditional,
        };
      }

      try {
        const filtered = accounts.filter(
          (acc) =>
            acc.acc_name?.toLowerCase().includes(search.toLowerCase()) ||
            acc.acc_code?.toLowerCase().includes(search.toLowerCase()),
        );

        return {
          options: filtered.map(buildAccountOption),
          hasMore: false,
          additional: { page: page + 1 },
        };
      } catch (error) {
        toast.error("Error searching accounts");
        return {
          options: [],
          hasMore: false,
          additional: { page },
        };
      }
    },
    [
      accounts,
      buildAccountOption,
      initialAccountAdditional,
      staticAccountOptions,
    ],
  );

  const addRow = () => {
    setRowsState((prev) => [
      ...prev,
      {
        localId: Date.now(),
        serverId: null,
        accountId: null,
        accountLabel: "",
        amount: "0.00",
        description: "",
      },
    ]);
  };

  const removeRow = (localId: number) => {
    const rowToRemove = rows.find((r) => r.localId === localId);

    if (rowToRemove?.serverId) {
      setDeletedServerIds((prev) => [...prev, rowToRemove.serverId!]);
    }

    if (rows.length === 1) {
      setRowsState([
        {
          localId: Date.now(),
          serverId: null,
          accountId: null,
          accountLabel: "",
          amount: "0.00",
          description: "",
        },
      ]);
      return;
    }
    setRowsState((prev) => prev.filter((row) => row.localId !== localId));
  };

  const updateRow = (
    localId: number,
    field: keyof AdditionalExpanseRow,
    value: string | number | null,
  ) => {
    setRowsState((prev) =>
      prev.map((row) =>
        row.localId === localId ? { ...row, [field]: value } : row,
      ),
    );
  };

  const handleAccountChange = (
    localId: number,
    option: AccountOption | null,
  ) => {
    if (option) {
      updateRow(localId, "accountLabel", option.label);
      updateRow(localId, "accountId", option.value);
    } else {
      updateRow(localId, "accountLabel", "");
      updateRow(localId, "accountId", null);
    }
  };

  const getSelectedOption = (
    row: AdditionalExpanseRow,
  ): AccountOption | null => {
    if (!row.accountId) return null;

    const account = accounts.find((acc) => acc.id === row.accountId);
    if (account) {
      return buildAccountOption(account);
    }

    if (row.accountLabel) {
      return {
        value: row.accountId,
        label: row.accountLabel,
        account: {} as Account,
      };
    }

    return null;
  };

  useImperativeHandle(ref, () => ({
    getRows: () => rows,
    setRows: (newRows: AdditionalExpanseRow[]) => {
      originalRowsRef.current = [...newRows];
      setRowsState(newRows);
      setDeletedServerIds([]);
    },
    saveRows: async ({
      invoiceId,
      transType,
      companyId,
      userId,
    }: {
      invoiceId: number;
      transType: number;
      companyId: number;
      userId: string;
    }) => {
      try {
        const now = new Date().toISOString();
        const results: boolean[] = [];

        for (const serverId of deletedServerIds) {
          const deleted = await invoiceService.deleteInvoiceAcc(serverId);
          results.push(deleted);
          if (!deleted) {
            console.error(`Failed to delete invoice acc id: ${serverId}`);
          }
        }

        for (const row of rows) {
          if (!row.accountId) continue;

          const amount = parseFloat(row.amount) || 0;
          if (amount === 0) continue;

          if (row.serverId) {
            const updateData: UpdateInvoiceAccDto = {
              com: companyId,
              id: row.serverId,
              trans_type: transType,
              acc: row.accountId,
              amt: amount,
              acc_change: 1,
              notes: row.description || "",
              upd_data: now,
              upd_user: userId,
              inv: invoiceId,
            };

            const updated = await invoiceService.updateInvoiceAcc({
              id: row.serverId,
              data: updateData,
            });
            results.push(!!updated);
            if (!updated) {
              console.error(`Failed to update invoice acc id: ${row.serverId}`);
            }
          } else {
            const createData: CreateInvoiceAccDto = {
              com: companyId,
              trans_type: transType,
              acc: row.accountId,
              amt: amount,
              acc_change: 1,
              notes: row.description || "",
              cr_date: now,
              cr_user: userId,
              inv: invoiceId,
            };

            const created = await invoiceService.createInvoiceAcc(createData);
            results.push(!!created);
            if (created) {
              row.serverId = created.id;
            } else {
              console.error(`Failed to create invoice acc for row`);
            }
          }
        }

        setDeletedServerIds([]);
        originalRowsRef.current = [...rows];

        return results.every((r) => r);
      } catch (error) {
        console.error("Error saving additional expanses:", error);
        return false;
      }
    },
  }));

  return (
    <div className="flex flex-col gap-2 items-start mt-3">
      <button
        className="btn focus:ring-0 focus:ring-offset-0 text-xs"
        disabled={!isEditing}
        type="button"
        onClick={addRow}
      >
        + {t("addRow")}
      </button>
      <div className="w-full overflow-x-auto">
        <table className="min-w-full border text-sm text-center">
          <thead className="bg-gray-100 text-xs font-semibold">
            <tr>
              <th className="p-2 border-b min-w-[200px]">
                {t("columns.account")}
              </th>
              <th className="p-2 border-b min-w-[120px]">
                {t("columns.amount")}
              </th>
              <th className="p-2 border-b min-w-[200px]">
                {t("columns.description")}
              </th>
              <th className="p-2 border-b w-[60px]">{t("columns.delete")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.localId}>
                <td className="p-1 border-b">
                  <AsyncCreatableSelect
                    debounceTimeout={300}
                    isClearable
                    isSearchable
                    additional={initialAccountAdditional}
                    className="text-xs"
                    classNamePrefix="select"
                    components={{ IndicatorSeparator: () => null }}
                    defaultOptions={staticAccountOptions}
                    instanceId={`account-select-${row.localId}`}
                    isDisabled={!isEditing}
                    loadOptions={loadAccountOptions as any}
                    menuPortalTarget={
                      typeof window !== "undefined" ? document.body : null
                    }
                    menuPosition="fixed"
                    placeholder={t("selectAccount")}
                    styles={selectStyles}
                    value={getSelectedOption(row)}
                    onChange={(option) =>
                      handleAccountChange(
                        row.localId,
                        option as AccountOption | null,
                      )
                    }
                  />
                </td>
                <td className="p-1 border-b">
                  <input
                    className="w-full h-[32px] border px-2 rounded text-xs text-center"
                    dir="ltr"
                    disabled={!isEditing}
                    inputMode="decimal"
                    type="number"
                    step="0.01"
                    value={row.amount}
                    onChange={(e) =>
                      updateRow(row.localId, "amount", e.target.value)
                    }
                  />
                </td>
                <td className="p-1 border-b">
                  <input
                    className="w-full h-[32px] border px-2 rounded text-xs"
                    disabled={!isEditing}
                    type="text"
                    value={row.description}
                    onChange={(e) =>
                      updateRow(row.localId, "description", e.target.value)
                    }
                  />
                </td>
                <td className="p-1 border-b">
                  <button
                    className="text-red-600 font-bold"
                    disabled={!isEditing}
                    tabIndex={-1}
                    type="button"
                    onClick={() => removeRow(row.localId)}
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
  );
});

export default AdditionalExpansesTable;
