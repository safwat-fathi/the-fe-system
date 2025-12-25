"use client";

import type { SelectInstance } from "react-select";

import React, {
  useCallback,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
  type FocusEvent,
} from "react";
import CreatableSelect from "react-select/creatable";
import { withAsyncPaginate } from "react-select-async-paginate";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import { formatAmount } from "@/utilities/formatAmount";
import useFractions from "@/utilities/useFractions";
import {
  INVOICE_PAY_TYPES,
  type InvoiceDetail,
  type InvoicePayType,
} from "@/types/models/invoice";
import itemService from "@/services/api/item.service";
import taxRateService from "@/services/api/tax-rate.service";
import useEnterKeyNavigation from "@/app/[locale]/(pages)/forms/invoices/hooks/useEnterKeyNavigation";
import { InvoiceItemRow } from "@/utilities/invoiceForm";

type ItemOption = {
  value: number;
  label: string;
  item: Item;
};

type ItemSelectAdditional = {
  page: number;
};

const AsyncCreatableSelect = withAsyncPaginate(CreatableSelect);

interface Item {
  id: number;
  item_code?: string;
  item_name?: string;
  item_price?: number;
  item_weight?: number;
  item_g_weight?: number;
  work_price?: number;
  purity?: string;
  stones?: string | number | null;
  cat?: number;
  k?: string;
}

interface Category {
  id: number;
  gauge?: string;
  purity?: string;
  k?: string;
}

interface Props {
  items: Item[];
  setItems: React.Dispatch<React.SetStateAction<Item[]>>;
  invoiceItems: InvoiceItemRow[];
  setInvoiceItems: React.Dispatch<React.SetStateAction<InvoiceItemRow[]>>;
  goldPrice: number | null;
  payType: InvoicePayType;
  categories: Category[];
  homePurity: number;
  isEditing: boolean;
  defaultDescription?: string;
  onItemRemoved?: (removedItem: InvoiceItemRow) => void;
}

export type InvoiceItemTableHandle = {
  focusFirstRow: () => boolean;
};

export type InvoiceItemTableProps = Props;

const InvoiceItemTable = forwardRef<InvoiceItemTableHandle, Props>(
  function InvoiceItemTable(
    {
      items,
      setItems,
      invoiceItems,
      setInvoiceItems,
      goldPrice,
      payType,
      homePurity,
      isEditing,
      defaultDescription = "",
      onItemRemoved,
    },
    ref,
  ) {
    const tItems = useTranslations("forms.invoices.items");
    const columnLabels = {
      item: tItems("columns.item"),
      quantity: tItems("columns.quantity"),
      grossWeight: tItems("columns.grossWeight"),
      netWeight: tItems("columns.netWeight"),
      stones: tItems("columns.stones"),
      pricePerGram: tItems("columns.pricePerGram"),
      wagePerGram: tItems("columns.wagePerGram"),
      totalValue: tItems("columns.totalValue"),
      totalWages: tItems("columns.totalWages"),
      discount: tItems("columns.discount"),
      taxRate: tItems("columns.taxRate"),
      tax: tItems("columns.tax"),
      totalWithTax: tItems("columns.totalWithTax"),
      description: tItems("columns.description"),
      delete: tItems("columns.delete"),
    } as const;
    const placeholders = {
      selectItem: tItems("placeholders.selectItem"),
    } as const;
    const actionLabels = {
      addItem: tItems("actions.addItem"),
    } as const;

    // number of decimals per field
    const weightDigits = useFractions("weight") as number;
    const gWeightDigits = useFractions("g_weight") as number;
    const priceDigits = useFractions("price") as number;
    const priceWDigits = useFractions("price_w") as number;
    const totalADigits = useFractions("total_a") as number;
    const totalWDigits = useFractions("total_w") as number;
    const itemDiscDigits = useFractions("item_disc_amt") as number;
    const totalDigits = useFractions("total") as number;
    const taxDigits = useFractions("tax") as number;

    // build numeric step from digits precision (e.g., 2 -> "0.01")
    const stepFromDigits = (digits: number) => {
      if (!digits || digits <= 0) return "1";

      return `0.${"0".repeat(digits - 1)}1`;
    };

    const [tempTotals, setTempTotals] = useState<Record<number, string>>({});
    const [taxRates, setTaxRates] = useState<number[]>([0, 5, 10, 15, 20]);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const getDisplayValue = (fieldKey: string, rawValue: string) =>
      focusedField === fieldKey ? rawValue : formatForDisplay(rawValue);

    // load tax rates from API
    useEffect(() => {
      const loadTaxRates = async () => {
        try {
          const rates = await taxRateService.getTaxRates();

          if (Array.isArray(rates) && rates.length > 0) {
            setTaxRates(rates);
          }
        } catch (error) {
          console.error("فشل في تحميل قائمة الضرائب:", error);
        }
      };

      loadTaxRates();
    }, []);

    const buildOption = useCallback((item: Item) => {
      const code = item.item_code ?? String(item.id);
      const name = item.item_name ?? "";
      const label = name ? `${code} - ${name}` : code;

      return {
        value: item.id,
        label,
        item,
      };
    }, []);

    type InvoiceItemRowWithLegacy = InvoiceItemRow & {
      item_id?: number | string | null;
    };

    const getRowItemId = (row: InvoiceItemRowWithLegacy) => {
      const rawId = row.item ?? row.item_id;

      return Number(rawId ?? 0);
    };

    const resolveSelectedOption = (
      row: InvoiceItemRowWithLegacy,
    ): ItemOption | null => {
      const itemId = getRowItemId(row);

      if (!Number.isFinite(itemId) || itemId <= 0) return null;

      const existing = items.find((it) => it.id === itemId);

      if (existing) return buildOption(existing);

      return buildOption({
        id: itemId,
        item_code: row.item_code ?? String(itemId),
        item_name: row.item_desc ?? row.item_code ?? String(itemId),
      });
    };

    const calculateRowBase = (
      type: InvoicePayType,
      totalA: number,
      totalW: number,
    ) => {
      if (type === INVOICE_PAY_TYPES.VALUE) return totalA;
      if (type === INVOICE_PAY_TYPES.WAGES) return totalW;

      return totalA + totalW;
    };

    const staticItemOptions = useMemo(
      () => items.map((it) => buildOption(it)),
      [items, buildOption],
    );

    const initialItemAdditional = useMemo(() => ({ page: 1 }), []);

    const selectStyles = useMemo(
      () => ({
        control: (base: any) => ({
          ...base,
          minHeight: 30,
          height: 30,
        }),
        menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
      }),
      [],
    );

    const loadItemOptions = useCallback(
      async (
        search: string,
        _loaded: ItemOption[],
        { page }: ItemSelectAdditional,
      ) => {
        if (!search) {
          return {
            options: staticItemOptions,
            hasMore: false,
            additional: initialItemAdditional,
          };
        }

        try {
          const response = await itemService.searchItems({
            searchTerm: search,
            page,
          });

          const normalizeItem = (input: any): Item => ({
            id: Number(input.id ?? 0),
            item_code: input.item_code ?? input.code ?? String(input.id ?? ""),
            item_name: input.item_name ?? input.name ?? "",
            item_price: input.item_price ?? input.price ?? 0,
            item_weight: input.item_weight ?? input.weight ?? 0,
            item_g_weight:
              input.item_g_weight ?? input.g_weight ?? input.item_weight ?? 0,
            work_price: input.work_price ?? input.price_w ?? 0,
            purity: input.purity ?? input.k ?? "",
            stones: input.stones ?? input.stone ?? null,
            cat: input.cat ?? undefined,
            k: input.k ?? undefined,
          });
          const normalizedResults = (response?.results ?? []).map(
            normalizeItem,
          );

          const options = normalizedResults.map(buildOption);

          return {
            options,
            hasMore: Boolean(response?.next),
            additional: { page: page + 1 },
          };
        } catch (error) {
          toast.error(error as string);

          return {
            options: [],
            hasMore: false,
            additional: { page },
          };
        }
      },
      [buildOption, initialItemAdditional, staticItemOptions],
    );

    // utility to parse string numeric fields to number safely
    const toNum = (v: any) => {
      const n = parseFloat(String(v ?? "0"));

      return Number.isNaN(n) ? 0 : n;
    };

    const makeFieldKey = (rowId: number | string, field: string) =>
      `${rowId}-${field}`;

    const formatForDisplay = (value: any): string => {
      const num = toNum(value);

      if (!Number.isFinite(num)) return "";

      return num.toFixed(2);
    };

    const handleNumericFocus = (
      e: FocusEvent<HTMLInputElement>,
      fieldKey: string,
    ) => {
      setFocusedField(fieldKey);
      // Select all text on focus so the user can overwrite quickly
      try {
        e.target.select();
      } catch {
        // ignore selection errors
      }
    };

    const rowHasItem = (row: InvoiceItemRow | undefined): boolean => {
      if (!row) return false;

      const numericItemId = Number(
        (row as any).item ?? (row as any).item_id ?? 0,
      );

      if (Number.isFinite(numericItemId) && numericItemId > 0) return true;

      const code = String((row as any).item_code ?? "").trim();
      const desc = String((row as any).item_desc ?? "").trim();

      return code.length > 0 || desc.length > 0;
    };

    // sanitize numeric inputs: allow digits and a single dot for decimals
    const sanitizeNumericInput = (raw: string, allowDecimal: boolean) => {
      let s = String(raw ?? "");

      if (!allowDecimal) {
        // integers only
        s = s.replace(/[^\d]/g, "");

        return s;
      }

      // keep digits and dots only
      s = s.replace(/[^\d.]/g, "");
      // keep only first dot
      const firstDot = s.indexOf(".");

      if (firstDot !== -1) {
        const before = s.slice(0, firstDot + 1);
        const after = s.slice(firstDot + 1).replace(/\./g, "");

        s = before + after;
      }
      // normalize leading dot
      if (s.startsWith(".")) s = `0${s}`;

      return s;
    };

    // when a field changed — update invoiceItems and recalc totals/tax
    const handleFieldChange = (
      index: number,
      field: keyof InvoiceItemRow,
      value: any,
    ) => {
      const updated = [...invoiceItems];

      if (!updated[index]) return;

      // store as string where interface expects a string
      // fields in interface that are strings and represent numbers:
      const numericStringFields: (keyof InvoiceItemRow)[] = [
        "qty",
        "price",
        "price_w",
        "weight",
        "g_weight",
        "total",
        "total_w",
        "total_a",
        "total_a2",
        "total2",
        "total_w2",
        "tax",
        "item_disc_amt",
        "item_disc_prc",
        "tax2",
      ] as any;

      if (numericStringFields.includes(field)) {
        // keep raw string while sanitizing; parse for calculations separately
        const isInteger = field === "qty";
        const sanitized = sanitizeNumericInput(String(value), !isInteger);

        updated[index] = {
          ...updated[index],
          [field]: sanitized,
        };
      } else {
        // non-numeric fields (strings)
        updated[index] = { ...updated[index], [field]: value };
      }

      // recalc totals & tax using numeric conversion
      const weight = toNum(updated[index].weight);
      let g_weight = toNum(updated[index].g_weight);

      // When weight (grossWeight) changes, recalculate g_weight (netWeight)
      // Formula: g_weight = weight * (itemPurity / homePurity)
      if (field === "weight" && homePurity > 0) {
        const itemPurity = toNum(updated[index].k) || homePurity;
        const newGWeight = weight * (itemPurity / homePurity);

        updated[index].g_weight = String(
          Number.isFinite(newGWeight) ? newGWeight : 0,
        );
        g_weight = newGWeight;
      }

      const qty = toNum(updated[index].qty) || 1;
      const price = toNum(updated[index].price);
      const price_w = toNum(updated[index].price_w);
      const item_disc_amt = toNum(updated[index].item_disc_amt);
      const tax_prc = toNum(updated[index].tax_prc ?? "15");

      const getTotalsForPayType = () => {
        if (payType === INVOICE_PAY_TYPES.VALUE) {
          return {
            total_a: qty * weight * price,
            total_w: 0,
          };
        }

        if (payType === INVOICE_PAY_TYPES.WAGES) {
          return {
            total_a: 0,
            total_w: qty * g_weight * price_w,
          };
        }

        return {
          total_a: qty * weight * price,
          total_w: qty * g_weight * price_w,
        };
      };

      const totals = getTotalsForPayType();
      const total_a = totals.total_a;
      const total_w = totals.total_w;

      const base = total_a + total_w - item_disc_amt;
      const tax = (base * tax_prc) / 100;
      const total = base + tax;

      updated[index] = {
        ...updated[index],
        total_a: String(Number.isFinite(total_a) ? total_a : 0),
        total_w: String(Number.isFinite(total_w) ? total_w : 0),
        total: String(Number.isFinite(total) ? total : 0),
        tax: String(Number.isFinite(tax) ? tax : 0),
        item_disc_amt: String(item_disc_amt),
        tax_prc: String(tax_prc),
      };

      setInvoiceItems(updated);
    };

    /**
     * حذف صف
     * - إذا بقي صف واحد: نفرغ محتوياته
     * - إذا أكثر من صف: نحذف الصف
     */
    const removeRow = (id: number) => {
      if (invoiceItems.length === 1) {
        const updated = [...invoiceItems];
        const i = updated.findIndex((it) => it.id === id);

        if (i === -1) return;
        // reset to default (matching InvoiceDetail shape)
        updated[i] = {
          ...updated[i],
          qty: "0.00",
          price: "0",
          price_w: "0",
          weight: "0",
          g_weight: "0",
          total: "0",
          total_w: "0",
          total_a: "0",
          item_disc_amt: "0",
          item_disc_prc: "0",
          tax: "0",
          tax_prc: "15",
          stones: null,
          item_desc: defaultDescription,
          sn: "",
        };
        setInvoiceItems(updated);

        return;
      }

      const toRemove = invoiceItems.find((it) => it.id === id);

      if (toRemove && onItemRemoved) onItemRemoved(toRemove);
      setInvoiceItems(invoiceItems.filter((it) => it.id !== id));
    };

    const addRow = () => {
      const newItem: InvoiceDetail = {
        id: Date.now(),
        trans_type: 1,
        G875: null,
        qty: "0.00",
        price: "0",
        price_w: "0",
        weight: "0",
        g_weight: "0",
        total: "0",
        total_w: "0",
        total_a: "0",
        inv_notes: null,
        diff: null,
        tax: "0",
        tax_prc: "15",
        stones: null,
        item_disc_prc: "0",
        item_disc_amt: "0",
        sn: "",
        item_desc: defaultDescription,
        price2: null,
        price2_w: null,
        total_a2: null,
        total2: null,
        total_w2: null,
        tax2: null,
        cr_date: new Date().toISOString(),
        cr_user: "",
        upd_date: new Date().toISOString(),
        upd_user: "",
        com: 0,
        inv: 0,
        item: 0,
        box: null,
      };

      // Use functional update to avoid stale closures when multiple updates queue
      setInvoiceItems((prev: any) => [...prev, newItem]);
    };

    const distributeTotalsByPayType = ({
      row,
      totalWithoutTax,
    }: {
      row: InvoiceItemRow;
      totalWithoutTax: number;
    }) => {
      const weight = toNum(row.weight);
      const existingA = toNum(row.total_a);
      const existingW = toNum(row.total_w);
      const sumExisting = existingA + existingW;
      const priceFromPortion = (portion: number) =>
        weight > 0 ? String(portion / weight) : undefined;

      if (payType === INVOICE_PAY_TYPES.VALUE) {
        return {
          total_a: String(totalWithoutTax),
          total_w: "0",
          price: priceFromPortion(totalWithoutTax),
        };
      }

      if (payType === INVOICE_PAY_TYPES.WAGES) {
        return {
          total_a: "0",
          total_w: String(totalWithoutTax),
          price_w: priceFromPortion(totalWithoutTax),
        };
      }

      if (sumExisting > 0) {
        const newA = (existingA / sumExisting) * totalWithoutTax;
        const newW = (existingW / sumExisting) * totalWithoutTax;

        return {
          total_a: String(newA),
          total_w: String(newW),
          price: priceFromPortion(newA),
          price_w: priceFromPortion(newW),
        };
      }

      return {
        total_a: String(totalWithoutTax),
        total_w: "0",
        price: priceFromPortion(totalWithoutTax),
      };
    };

    const calculateBaseAndTax = (row: InvoiceItemRow) => {
      const base =
        toNum(row.total_a) + toNum(row.total_w) - toNum(row.item_disc_amt);
      const tax = (base * toNum(row.tax_prc ?? "15")) / 100;

      return { base, tax };
    };

    const handleSelectItemChange = (
      rowIndex: number,
      option: ItemOption | null,
    ) => {
      if (!option) return;
      const selected =
        option.item || items.find((it) => it.id === option.value);

      if (!selected) return;
      setItems((prev) => {
        if (prev.some((i) => i.id === selected.id)) {
          return prev;
        }

        return [...prev, selected];
      });

      const updated = [...invoiceItems];

      updated[rowIndex] = {
        ...updated[rowIndex],
        item: selected.id ?? 0,
        ...(selected.id ? { item_id: selected.id } : {}),
        item_desc: defaultDescription || updated[rowIndex].item_desc || "",
        price: String(goldPrice ?? selected.item_price ?? 0),
        price_w: String(selected.work_price ?? 0),
        weight: String(selected.item_weight ?? 0),
        g_weight: String(selected.item_g_weight ?? selected.item_weight ?? 0),
        stones: selected.stones ?? null,
        box: (selected as any).box_id ?? updated[rowIndex].box ?? null,
      };

      const w = toNum(updated[rowIndex].weight);
      const gw = toNum(updated[rowIndex].g_weight);
      const pr = toNum(updated[rowIndex].price);
      const prw = toNum(updated[rowIndex].price_w);
      const updatedTotalA = w * pr;
      const updatedTotalW = gw * prw;
      const baseCalc =
        calculateRowBase(payType, updatedTotalA, updatedTotalW) -
        toNum(updated[rowIndex].item_disc_amt);
      const taxCalc =
        (baseCalc * toNum(updated[rowIndex].tax_prc ?? "15")) / 100;

      updated[rowIndex].total_a = String(updatedTotalA);
      updated[rowIndex].total_w = String(updatedTotalW);
      updated[rowIndex].tax = String(taxCalc);
      updated[rowIndex].total = String(baseCalc + taxCalc);

      setInvoiceItems(updated);
    };

    // change total (user edits final total including tax) -> distribute back
    const handleTotalChange = (index: number, value: any) => {
      const updated = [...invoiceItems];

      if (!updated[index]) return;
      const entered = toNum(value);
      const tax_prc = toNum(updated[index].tax_prc ?? "15");
      const totalWithoutTax = entered / (1 + tax_prc / 100);

      updated[index].total = String(entered);

      const distribution = distributeTotalsByPayType({
        row: updated[index],
        totalWithoutTax,
      });

      updated[index] = {
        ...updated[index],
        total_a: distribution.total_a,
        total_w: distribution.total_w,
        ...(distribution.price !== undefined
          ? { price: distribution.price }
          : {}),
        ...(distribution.price_w !== undefined
          ? { price_w: distribution.price_w }
          : {}),
      };

      const { tax } = calculateBaseAndTax(updated[index]);

      updated[index].tax = String(tax);
      setInvoiceItems(updated);
    };

    const handleTotalAChange = (index: number, value: any) => {
      const updated = [...invoiceItems];

      if (!updated[index]) return;
      const num = toNum(value);

      updated[index].total_a = String(num);
      if (toNum(updated[index].weight) > 0)
        updated[index].price = String(num / toNum(updated[index].weight));
      const base =
        toNum(updated[index].total_a) +
        toNum(updated[index].total_w) -
        toNum(updated[index].item_disc_amt);
      const tax = (base * toNum(updated[index].tax_prc ?? "15")) / 100;

      updated[index].tax = String(tax);
      updated[index].total = String(base + tax);
      setInvoiceItems(updated);
    };

    const handleTotalWChange = (index: number, value: any) => {
      const updated = [...invoiceItems];

      if (!updated[index]) return;
      const num = toNum(value);

      updated[index].total_w = String(num);
      if (toNum(updated[index].weight) > 0)
        updated[index].price_w = String(num / toNum(updated[index].weight));
      const base =
        toNum(updated[index].total_a) +
        toNum(updated[index].total_w) -
        toNum(updated[index].item_disc_amt);
      const tax = (base * toNum(updated[index].tax_prc ?? "15")) / 100;

      updated[index].tax = String(tax);
      updated[index].total = String(base + tax);
      setInvoiceItems(updated);
    };

    const { setInputRef, handleKeyDown, focusFirstInRow } =
      useEnterKeyNavigation<InvoiceItemRow>({
        rows: invoiceItems,
        rowHasValue: rowHasItem,
        onAddRow: addRow,
      });

    useImperativeHandle(
      ref,
      () => ({
        focusFirstRow: () => {
          if (!isEditing) return false;

          return focusFirstInRow(0);
        },
      }),
      [focusFirstInRow, isEditing],
    );

    return (
      <div className="flex flex-col gap-2 items-start">
        <button
          className="btn focus:ring-0 focus:ring-offset-0"
          disabled={!isEditing}
          type="button"
          onClick={addRow}
        >
          + {actionLabels.addItem}
        </button>
        <div className="w-full overflow-y-scroll mb-1 max-w-full max-h-[250px]">
          <table className="min-w-[1000px] border text-sm text-center table-fixed">
            <thead className="bg-gray-100 text-xs font-semibold">
              <tr>
                <th className="w-[400px]">{columnLabels.item}</th>
                <th className="w-[60px]">{columnLabels.quantity}</th>
                <th className="w-[100px]">{columnLabels.grossWeight}</th>
                <th className="w-[80px]">{columnLabels.netWeight}</th>
                <th className="w-[80px]">{columnLabels.stones}</th>
                {(payType === INVOICE_PAY_TYPES.VALUE ||
                  payType === INVOICE_PAY_TYPES.VALUE_AND_WAGES) && (
                  <th className="w-[100px]">{columnLabels.pricePerGram}</th>
                )}
                {(payType === INVOICE_PAY_TYPES.WAGES ||
                  payType === INVOICE_PAY_TYPES.VALUE_AND_WAGES) && (
                  <th className="w-[100px]">{columnLabels.wagePerGram}</th>
                )}
                {(payType === INVOICE_PAY_TYPES.VALUE ||
                  payType === INVOICE_PAY_TYPES.VALUE_AND_WAGES) && (
                  <th className="w-[100px]">{columnLabels.totalValue}</th>
                )}
                {(payType === INVOICE_PAY_TYPES.WAGES ||
                  payType === INVOICE_PAY_TYPES.VALUE_AND_WAGES) && (
                  <th className="w-[100px]">{columnLabels.totalWages}</th>
                )}
                <th className="w-[100px]">{columnLabels.discount}</th>
                <th className="w-[80px]">{columnLabels.taxRate}</th>
                <th className="w-[100px]">{columnLabels.tax}</th>
                <th className="w-[120px]">{columnLabels.totalWithTax}</th>
                <th className="w-[200px]">{columnLabels.description}</th>
                <th className="w-[60px]">{columnLabels.delete}</th>
              </tr>
            </thead>
            <tbody>
              {invoiceItems.map((item, index) => {
                type RegisteredCell = {
                  key: string;
                  columnIndex: number;
                  fieldKey: string;
                  displayValue: string;
                  id: string;
                  inputMode: "numeric" | "decimal";
                  step: string;
                  alignMiddle?: boolean;
                  required?: boolean;
                  pattern?: string;
                  onChange: (value: string) => void;
                };

                let col = -1;
                const nextCol = () => {
                  col += 1;

                  return col;
                };
                const registerCells: RegisteredCell[] = [];
                const registerCell = ({
                  key,
                  fieldKey,
                  rawValue,
                  idPrefix,
                  inputMode,
                  step,
                  alignMiddle,
                  required,
                  pattern,
                  onChange,
                  show = true,
                  formatValue = true,
                }: {
                  key: string;
                  fieldKey: string;
                  rawValue: string;
                  idPrefix: string;
                  inputMode: "numeric" | "decimal";
                  step: string;
                  alignMiddle?: boolean;
                  required?: boolean;
                  pattern?: string;
                  onChange: (value: string) => void;
                  show?: boolean;
                  formatValue?: boolean;
                }) => {
                  if (!show) return;
                  const columnIndex = nextCol();
                  const id = `${idPrefix}-${index}${columnIndex}`;
                  const displayValue = formatValue
                    ? getDisplayValue(fieldKey, rawValue)
                    : rawValue;

                  registerCells.push({
                    key,
                    columnIndex,
                    fieldKey,
                    displayValue,
                    id,
                    inputMode,
                    step,
                    alignMiddle,
                    required,
                    pattern,
                    onChange,
                  });
                };

                const qty = toNum(item.qty) || 1;
                const weight = toNum(item.weight);
                const gWeight = toNum(item.g_weight);
                const price = toNum(item.price);
                const priceW = toNum(item.price_w);
                const totalA = qty * weight * price;
                const totalW = qty * gWeight * priceW;
                const rowBase = calculateRowBase(payType, totalA, totalW);
                const base = rowBase - toNum(item.item_disc_amt);
                const tax = (base * toNum(item.tax_prc ?? "15")) / 100;
                const totalWithTax = base + tax;

                const itemSelectCol = nextCol();
                const selectedOption = resolveSelectedOption(
                  item as InvoiceItemRowWithLegacy,
                );
                const handleSelectChange = (option: ItemOption | null) =>
                  handleSelectItemChange(index, option);
                const itemSelectRef = (
                  instance: SelectInstance<ItemOption> | null,
                ) =>
                  setInputRef(
                    index,
                    itemSelectCol,
                  )((instance as unknown as HTMLInputElement | null) || null);

                const showValueCols =
                  payType === INVOICE_PAY_TYPES.VALUE ||
                  payType === INVOICE_PAY_TYPES.VALUE_AND_WAGES;
                const showWageCols =
                  payType === INVOICE_PAY_TYPES.WAGES ||
                  payType === INVOICE_PAY_TYPES.VALUE_AND_WAGES;

                registerCell({
                  key: `qty-${item.id}`,
                  fieldKey: makeFieldKey(item.id, "qty"),
                  rawValue: String(item.qty ?? ""),
                  idPrefix: "qty",
                  inputMode: "numeric",
                  step: "1",
                  alignMiddle: true,
                  pattern: "[0-9]*",
                  onChange: (value) => handleFieldChange(index, "qty", value),
                });

                registerCell({
                  key: `weight-${item.id}`,
                  fieldKey: makeFieldKey(item.id, "weight"),
                  rawValue: String(item.weight ?? ""),
                  idPrefix: "weight",
                  inputMode: "decimal",
                  step: stepFromDigits(weightDigits),
                  alignMiddle: true,
                  onChange: (value) =>
                    handleFieldChange(index, "weight", value),
                });

                registerCell({
                  key: `gweight-${item.id}`,
                  fieldKey: makeFieldKey(item.id, "g_weight"),
                  rawValue: String(item.g_weight ?? ""),
                  idPrefix: "gweight",
                  inputMode: "decimal",
                  step: stepFromDigits(gWeightDigits),
                  alignMiddle: true,
                  onChange: (value) =>
                    handleFieldChange(index, "g_weight", value),
                });

                registerCell({
                  key: `stones-${item.id}`,
                  fieldKey: makeFieldKey(item.id, "stones"),
                  rawValue: String(item.stones ?? ""),
                  idPrefix: "stones",
                  inputMode: "numeric",
                  step: "1",
                  pattern: "[0-9]*",
                  onChange: (value) =>
                    handleFieldChange(
                      index,
                      "stones",
                      sanitizeNumericInput(value, false),
                    ),
                  formatValue: false,
                });

                registerCell({
                  key: `price-${item.id}`,
                  fieldKey: makeFieldKey(item.id, "price"),
                  rawValue: String(item.price ?? ""),
                  idPrefix: "price",
                  inputMode: "decimal",
                  step: stepFromDigits(priceDigits),
                  show: showValueCols,
                  onChange: (value) => handleFieldChange(index, "price", value),
                });

                registerCell({
                  key: `pricew-${item.id}`,
                  fieldKey: makeFieldKey(item.id, "price_w"),
                  rawValue: String(item.price_w ?? ""),
                  idPrefix: "pricew",
                  inputMode: "decimal",
                  step: stepFromDigits(priceWDigits),
                  show: showWageCols,
                  required:
                    payType === INVOICE_PAY_TYPES.WAGES ||
                    payType === INVOICE_PAY_TYPES.VALUE_AND_WAGES,
                  onChange: (value) =>
                    handleFieldChange(index, "price_w", value),
                });

                registerCell({
                  key: `totala-${item.id}`,
                  fieldKey: makeFieldKey(item.id, "total_a"),
                  rawValue: String(item.total_a ?? ""),
                  idPrefix: "totala",
                  inputMode: "decimal",
                  step: stepFromDigits(totalADigits),
                  show: showValueCols,
                  onChange: (value) => handleTotalAChange(index, value),
                });

                registerCell({
                  key: `totalw-${item.id}`,
                  fieldKey: makeFieldKey(item.id, "total_w"),
                  rawValue: String(item.total_w ?? ""),
                  idPrefix: "totalw",
                  inputMode: "decimal",
                  step: stepFromDigits(totalWDigits),
                  show: showWageCols,
                  onChange: (value) => handleTotalWChange(index, value),
                });

                registerCell({
                  key: `discount-${item.id}`,
                  fieldKey: makeFieldKey(item.id, "item_disc_amt"),
                  rawValue: String(item.item_disc_amt ?? ""),
                  idPrefix: "disc",
                  inputMode: "decimal",
                  step: stepFromDigits(itemDiscDigits),
                  onChange: (value) =>
                    handleFieldChange(index, "item_disc_amt", value),
                });

                const taxRateCol = nextCol();

                const storedTotal = Number.isFinite(totalWithTax)
                  ? totalWithTax
                  : toNum(item.total);
                const totalCol = nextCol();
                const totalFieldKey = makeFieldKey(item.id, "total");
                const rawTotalValue =
                  tempTotals[item.id] !== undefined
                    ? tempTotals[item.id]
                    : String(storedTotal ?? "");
                const totalDisplayValue = getDisplayValue(
                  totalFieldKey,
                  rawTotalValue,
                );

                const descCol = nextCol();

                return (
                  <tr key={item.id}>
                    <td className="p-1">
                      <AsyncCreatableSelect
                        debounceTimeout={500}
                        isClearable
                        isSearchable
                        additional={initialItemAdditional}
                        className="text-xs"
                        classNamePrefix="select"
                        components={{ IndicatorSeparator: () => null }}
                        defaultOptions={staticItemOptions}
                        inputId={`item-${index}${itemSelectCol}`}
                        instanceId={`item-select-${index}`}
                        isDisabled={!isEditing}
                        loadOptions={loadItemOptions as any}
                        menuPortalTarget={
                          typeof window !== "undefined" ? document.body : null
                        }
                        menuPosition="fixed"
                        placeholder={placeholders.selectItem}
                        selectRef={itemSelectRef}
                        styles={selectStyles}
                        value={selectedOption}
                        onChange={handleSelectChange}
                        onKeyDown={(e) =>
                          handleKeyDown(e, index, itemSelectCol, {
                            allowEnterDefaultWhenRowMissing: true,
                          })
                        }
                      />
                    </td>
                    {registerCells.map(
                      ({
                        key,
                        columnIndex,
                        fieldKey,
                        displayValue,
                        id,
                        inputMode,
                        step,
                        alignMiddle,
                        required: cellRequired,
                        pattern,
                        onChange,
                      }) => (
                        <td
                          key={key}
                          className={alignMiddle ? "align-middle" : undefined}
                        >
                          <input
                            ref={setInputRef(index, columnIndex)}
                            className="border w-full p-1 text-xs text-center"
                            dir="ltr"
                            disabled={!isEditing}
                            id={id}
                            inputMode={inputMode}
                            pattern={pattern}
                            required={cellRequired}
                            step={step}
                            type="number"
                            value={displayValue}
                            onBlur={() => {
                              if (focusedField === fieldKey)
                                setFocusedField(null);
                            }}
                            onChange={(e) => onChange(e.target.value)}
                            onFocus={(e) => handleNumericFocus(e, fieldKey)}
                            onKeyDown={(e) =>
                              handleKeyDown(e, index, columnIndex)
                            }
                          />
                        </td>
                      ),
                    )}
                    <td>
                      <select
                        ref={(node: HTMLSelectElement | null) =>
                          setInputRef(
                            index,
                            taxRateCol,
                          )(node as unknown as HTMLInputElement | null)
                        }
                        className="border w-full p-1 text-xs text-center"
                        disabled={!isEditing}
                        id={`taxprc-${index}${taxRateCol}`}
                        value={String(Math.round(toNum(item.tax_prc)))}
                        onChange={(e) =>
                          handleFieldChange(index, "tax_prc", e.target.value)
                        }
                        onKeyDown={(e) => handleKeyDown(e, index, taxRateCol)}
                      >
                        {taxRates.map((rate) => (
                          <option key={rate} value={rate}>
                            {rate}%
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{formatAmount(String(item.tax ?? tax), taxDigits)}</td>
                    <td>
                      <input
                        ref={setInputRef(index, totalCol)}
                        className="border w-full p-1 text-xs text-center"
                        dir="ltr"
                        disabled={!isEditing}
                        id={`total-${index}${totalCol}`}
                        inputMode="decimal"
                        step={stepFromDigits(totalDigits)}
                        type="number"
                        value={totalDisplayValue}
                        onBlur={(e) => {
                          handleTotalChange(index, e.target.value);
                          if (focusedField === totalFieldKey)
                            setFocusedField(null);
                        }}
                        onChange={(e) =>
                          setTempTotals((prev) => ({
                            ...prev,
                            [item.id]: e.target.value,
                          }))
                        }
                        onFocus={(e) => handleNumericFocus(e, totalFieldKey)}
                        onKeyDown={(e) => handleKeyDown(e, index, totalCol)}
                      />
                    </td>
                    <td>
                      <input
                        ref={setInputRef(index, descCol)}
                        className="border w-full p-1 text-xs text-center"
                        disabled={!isEditing}
                        id={`desc-${index}${descCol}`}
                        value={item.item_desc ?? ""}
                        onChange={(e) =>
                          handleFieldChange(index, "item_desc", e.target.value)
                        }
                        onKeyDown={(e) =>
                          handleKeyDown(e, index, descCol, { isLastCol: true })
                        }
                      />
                    </td>
                    <td>
                      <button
                        className="text-red-600 font-bold"
                        disabled={!isEditing}
                        tabIndex={-1}
                        onClick={() => removeRow(item.id)}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  },
);

export default InvoiceItemTable;
