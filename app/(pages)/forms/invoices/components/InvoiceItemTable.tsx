"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import CreatableSelect from "react-select/creatable";
import { withAsyncPaginate } from "react-select-async-paginate";

import { formatAmount } from "@/utilities/formatAmount";
import useFractions from "@/utilities/useFractions";
import {
  INVOICE_PAY_TYPES,
  type InvoiceDetail,
  type InvoicePayType,
} from "@/types/models/invoice";
import itemService from "@/services/api/item.service";
import taxRateService from "@/services/api/tax-rate.service";

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
  invoiceItems: InvoiceDetail[];
  setInvoiceItems: (items: InvoiceDetail[]) => void;
  goldPrice: number | null;
  payType: InvoicePayType;
  categories: Category[];
  homePurity: number;
  isEditing: boolean;
  onItemRemoved?: (removedItem: InvoiceDetail) => void;
}

export default function InvoiceItemTable({
  items,
  setItems,
  invoiceItems,
  setInvoiceItems,
  goldPrice,
  payType,
  categories,
  homePurity,
  isEditing,
  onItemRemoved,
}: Props) {
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

  const inputRefs = useRef<(HTMLInputElement | null)[][]>([]);
  const [tempTotals, setTempTotals] = useState<Record<number, string>>({});
  const [taxRates, setTaxRates] = useState<number[]>([0, 5, 10, 15, 20]);

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

  const buildOption = (item: Item) => {
    const code = item.item_code ?? String(item.id);
    const name = item.item_name ?? "";
    const label = name ? `${code} - ${name}` : code;

    return {
      value: item.id,
      label,
      item,
    };
  };

  const staticItemOptions = useMemo(
    () => items.map((it) => buildOption(it)),
    [items],
  );

  const loadItemOptions = async (
    search: string,
    _loaded: any,
    { page }: { page: number },
  ) => {
    const trimmed = search.trim();

    if (!trimmed) {
      return {
        options: staticItemOptions,
        hasMore: false,
        additional: { page: 1 },
      };
    }

    try {
      const response = await itemService.searchItems({
        query: trimmed,
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
      const normalizedResults = (response?.results ?? []).map(normalizeItem);
      const term = trimmed.toLowerCase();

      setItems((prev) => {
        const existingIds = new Set(prev.map((item) => item.id));
        const additions = normalizedResults.filter(
          (remoteItem) => !existingIds.has(remoteItem.id),
        );

        return additions.length > 0 ? [...prev, ...additions] : prev;
      });

      const decorated = normalizedResults
        .map((it) => {
          const itemCode = (it.item_code ?? "").toLowerCase();
          const itemName = (it.item_name ?? "").toLowerCase();

          return {
            option: buildOption(it),
            codeMatch: itemCode.indexOf(term),
            nameMatch: itemName.indexOf(term),
          };
        })
        .filter((entry) => entry.codeMatch !== -1 || entry.nameMatch !== -1)
        .sort((a, b) => {
          const aCode = a.codeMatch === -1 ? Infinity : a.codeMatch;
          const bCode = b.codeMatch === -1 ? Infinity : b.codeMatch;

          if (aCode !== bCode) return aCode - bCode;
          const aName = a.nameMatch === -1 ? Infinity : a.nameMatch;
          const bName = b.nameMatch === -1 ? Infinity : b.nameMatch;

          return aName - bName;
        });

      const options = decorated.map(({ option }) => option);

      return {
        options,
        hasMore: Boolean(response?.next),
        additional: { page: page + 1 },
      };
    } catch (error) {
      console.error("فشل تحميل الأصناف:", error);

      return { options: [], hasMore: false, additional: { page } };
    }
  };

  useEffect(() => {
    invoiceItems.forEach((_, i) => {
      if (!inputRefs.current[i]) inputRefs.current[i] = [];
    });
  }, [invoiceItems.length]);

  // utility to parse string numeric fields to number safely
  const toNum = (v: any) => {
    const n = parseFloat(String(v ?? "0"));

    return Number.isNaN(n) ? 0 : n;
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
    field: keyof InvoiceDetail,
    value: any,
  ) => {
    const updated = [...invoiceItems];

    if (!updated[index]) return;

    // store as string where interface expects a string
    // fields in interface that are strings and represent numbers:
    const numericStringFields: (keyof InvoiceDetail)[] = [
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
      } as InvoiceDetail;
    } else {
      // non-numeric fields (strings)
      updated[index] = { ...updated[index], [field]: value } as InvoiceDetail;
    }

    // recalc totals & tax using numeric conversion
    const qty = toNum(updated[index].qty);
    const weight = toNum(updated[index].weight);
    const g_weight = toNum(updated[index].g_weight);
    const price = toNum(updated[index].price);
    const price_w = toNum(updated[index].price_w);
    const item_disc_amt = toNum(updated[index].item_disc_amt);
    const tax_prc = toNum(updated[index].tax_prc ?? "15");

    // decide totals per payType
    let total_a = 0;
    let total_w = 0;

    if (payType === INVOICE_PAY_TYPES.VALUE) {
      total_a = weight * price;
      total_w = 0;
    } else if (payType === INVOICE_PAY_TYPES.WAGES) {
      total_a = 0;
      total_w = g_weight * price_w;
    } else {
      total_a = weight * price;
      total_w = g_weight * price_w;
    }

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
    } as InvoiceDetail;

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
        item_desc: "",
        sn: "",
      } as InvoiceDetail;
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
      item_desc: "",
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
    setInvoiceItems((prev) => [...prev, newItem]);
  };

  const focusNode = (node: any) => {
    try {
      node?.focus?.();
    } catch {}
  };

  const focusFirstInRow = (row: number) => {
    const rowRefs = inputRefs.current[row] || [];

    for (let i = 0; i < rowRefs.length; i++) {
      const el = rowRefs[i];

      if (el) {
        focusNode(el);
        return true;
      }
    }

    return false;
  };

  const focusFirstInRowAsync = (row: number, tries = 6) => {
    const tick = (left: number) => {
      if (focusFirstInRow(row)) return;
      if (left <= 0) return;
      if (typeof requestAnimationFrame !== "undefined") {
        requestAnimationFrame(() => tick(left - 1));
      } else {
        setTimeout(() => tick(left - 1), 16);
      }
    };
    tick(tries);
  };

  // After adding a row, ensure focus lands on the first cell with retries
  const focusNewRowFirstCell = (row: number) => {
    // Immediate attempt
    focusFirstInRow(row);
    // Short rAF retry sequence
    focusFirstInRowAsync(row, 8);
    // Timed fallbacks in case rAF misses due to async mount
    setTimeout(() => focusFirstInRow(row), 0);
    setTimeout(() => focusFirstInRow(row), 40);
    setTimeout(() => focusFirstInRow(row), 100);
  };

  const handleEnter = (
    e: KeyboardEvent,
    rowIndex: number,
    colIndex: number,
    isLastCol?: boolean,
  ) => {
		const key = e.key;
    console.log("🚀 ~ :450 ~ handleEnter ~ key:", key)
    console.log("🚀 ~ :449 ~ handleEnter ~ isLastCol:", isLastCol)

    if (key !== "Tab" && key !== "Enter") return;

    // Allow Shift+Tab native backward movement
    if (key === "Tab" && (e as any).shiftKey) return;

    const rowRefs = inputRefs.current[rowIndex] || [];
    const lastColIndex = rowRefs.length - 1;
    const atLastCol = typeof isLastCol === "boolean" ? isLastCol : colIndex >= lastColIndex;
    const isLastRow = rowIndex === invoiceItems.length - 1;

    if (key === "Enter") {
      e.preventDefault();

      if (!atLastCol) {
        const nextInRow = rowRefs[colIndex + 1];
        if (nextInRow) focusNode(nextInRow);
        return;
      }

			console.log('********444');
      // last col behavior: same as Tab
      if (!isLastRow) {
        focusFirstInRow(rowIndex + 1);
        return;
      }
			

      addRow();
      focusNewRowFirstCell(rowIndex + 1);
      return;
    }

    // Tab
    if (!atLastCol) {
      // let browser handle within-row next field
      return;
    }

    // last column
    e.preventDefault();
    if (!isLastRow) {
      focusFirstInRow(rowIndex + 1);
      return;
    }

    addRow();
    focusNewRowFirstCell(rowIndex + 1);
  };

  // change total (user edits final total including tax) -> distribute back
  const handleTotalChange = (index: number, value: any) => {
    const updated = [...invoiceItems];

    if (!updated[index]) return;
    const entered = toNum(value);
    const tax_prc = toNum(updated[index].tax_prc ?? "15");
    const totalWithoutTax = entered / (1 + tax_prc / 100);

    // set total
    updated[index].total = String(entered);

    // distribute to total_a/total_w depending on payType, preserve proportions if present
    const existingA = toNum(updated[index].total_a);
    const existingW = toNum(updated[index].total_w);
    const sumExisting = existingA + existingW;

    if (payType === INVOICE_PAY_TYPES.VALUE) {
      updated[index].total_a = String(totalWithoutTax);
      updated[index].total_w = "0";
      if (toNum(updated[index].weight) > 0)
        updated[index].price = String(
          totalWithoutTax / toNum(updated[index].weight),
        );
    } else if (payType === INVOICE_PAY_TYPES.WAGES) {
      updated[index].total_w = String(totalWithoutTax);
      updated[index].total_a = "0";
      if (toNum(updated[index].weight) > 0)
        updated[index].price_w = String(
          totalWithoutTax / toNum(updated[index].weight),
        );
    } else {
      // split according to existing ratio; if none, put all into total_a
      if (sumExisting > 0) {
        const newA = (existingA / sumExisting) * totalWithoutTax;
        const newW = (existingW / sumExisting) * totalWithoutTax;

        updated[index].total_a = String(newA);
        updated[index].total_w = String(newW);
        if (toNum(updated[index].weight) > 0) {
          updated[index].price = String(newA / toNum(updated[index].weight));
          updated[index].price_w = String(newW / toNum(updated[index].weight));
        }
      } else {
        updated[index].total_a = String(totalWithoutTax);
        updated[index].total_w = "0";
        if (toNum(updated[index].weight) > 0)
          updated[index].price = String(
            totalWithoutTax / toNum(updated[index].weight),
          );
      }
    }

    // recalc tax
    const base =
      toNum(updated[index].total_a) +
      toNum(updated[index].total_w) -
      toNum(updated[index].item_disc_amt);
    const tax = (base * tax_prc) / 100;

    updated[index].tax = String(tax);
    // total already set to entered
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

  const setRef = (row: number, col: number) => (el: any) => {
    if (!inputRefs.current[row]) inputRefs.current[row] = [];
    inputRefs.current[row][col] = el as HTMLInputElement | null;
  };

  return (
    <div className="w-full overflow-auto mb-6 max-w-full max-h-[250px]">
      <div className="flex justify-between mb-2">
        <button
          className="btn focus:ring-0 focus:ring-offset-0"
          disabled={!isEditing}
          type="button"
          onClick={addRow}
        >
          + صف
        </button>
      </div>

      <table className="min-w-[1000px] border text-sm text-center table-fixed">
        <thead className="bg-gray-100 text-xs font-semibold">
          <tr>
            <th className="w-[400px]">الصنف</th>
            <th className="w-[60px]">العدد</th>
            <th className="w-[100px]">الوزن القائم</th>
            <th className="w-[80px]">الوزن المعاير</th>
            <th className="w-[80px]">الاحجار</th>
            {(payType === INVOICE_PAY_TYPES.VALUE ||
              payType === INVOICE_PAY_TYPES.VALUE_AND_WAGES) && (
              <th className="w-[100px]">سعر الجرام</th>
            )}
            {(payType === INVOICE_PAY_TYPES.WAGES ||
              payType === INVOICE_PAY_TYPES.VALUE_AND_WAGES) && (
              <th className="w-[100px]">أجرة الجرام</th>
            )}
            {(payType === INVOICE_PAY_TYPES.VALUE ||
              payType === INVOICE_PAY_TYPES.VALUE_AND_WAGES) && (
              <th className="w-[100px]">اجمالي القيمة</th>
            )}
            {(payType === INVOICE_PAY_TYPES.WAGES ||
              payType === INVOICE_PAY_TYPES.VALUE_AND_WAGES) && (
              <th className="w-[100px]">اجمالي الاجور</th>
            )}
            <th className="w-[100px]">الخصم</th>
            <th className="w-[80px]">نسبة الضريبة</th>
            <th className="w-[100px]">الضريبة</th>
            <th className="w-[120px]">الاجمالي شامل الضريبة</th>
            <th className="w-[200px]">البيان</th>
            <th className="w-[60px]">حذف</th>
          </tr>
        </thead>
        <tbody>
          {invoiceItems.map((item, index) => {
            
            let col = -1;
            const weight = toNum(item.weight);
            const gWeight = toNum(item.g_weight);
            const price = toNum(item.price);
            const priceW = toNum(item.price_w);

            // calculate totals client-side for display (base calculations)
            const totalA = weight * price;
            const totalW = gWeight * priceW;
            let rowBase = 0;

            if (payType === INVOICE_PAY_TYPES.VALUE) rowBase = totalA;
            else if (payType === INVOICE_PAY_TYPES.WAGES) rowBase = totalW;
            else rowBase = totalA + totalW;

            const base = rowBase - toNum(item.item_disc_amt);
            const tax = (base * toNum(item.tax_prc ?? "15")) / 100;
            const totalWithTax = base + tax;

            return (
              <tr key={item.id}>
                <td className="p-1">
                  {(() => {
                    const thisCol = ++col;
                    return (
                      <AsyncCreatableSelect
                        selectRef={(instance) => {
                          if (!inputRefs.current[index])
                            inputRefs.current[index] = [];
                          inputRefs.current[index][thisCol] =
                            instance as unknown as HTMLInputElement | null;
                        }}
                        inputId={`item-${index}${thisCol}`}
                    isClearable
                    isSearchable
                    additional={{ page: 1 }}
                    className="text-xs"
                    classNamePrefix="select"
                    components={{ IndicatorSeparator: () => null }}
                    defaultOptions={staticItemOptions}
                    formatCreateLabel={(inputValue) =>
                      `إضافة صنف جديد: "${inputValue}"`
                    }
                    instanceId={`item-select-${index}`}
                    isDisabled={!isEditing}
                    loadOptions={loadItemOptions}
                    menuPortalTarget={
                      typeof window !== "undefined" ? document.body : null
                    }
                    menuPosition="fixed"
                    placeholder="اختر الصنف..."
                    styles={{
                      control: (base) => ({
                        ...base,
                        minHeight: 30,
                        height: 30,
                      }),
                      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    }}
                    value={(() => {
                      const rawId = item.item ?? (item as any).item_id;
                      const itemId = Number(rawId ?? 0);

                      if (!Number.isFinite(itemId) || itemId <= 0) return null;

                      const existing = items.find((it) => it.id === itemId);

                      if (existing) return buildOption(existing);

                      return buildOption({
                        id: itemId,
                        item_code: item.item_code ?? String(itemId),
                        item_name:
                          item.item_desc ?? item.item_code ?? String(itemId),
                      });
                    })()}
                    onChange={(opt: any) => {
                      const selected =
                        opt?.item || items.find((it) => it.id === opt?.value);

                      if (!selected) return;
                      // cache option if missing
                      setItems((prev) => {
                        if (prev.some((i) => i.id === selected.id)) {
                          return prev;
                        }

                        return [...prev, selected];
                      });

                      const updated = [...invoiceItems];

                      updated[index] = {
                        ...updated[index],
                        item: selected.id ?? 0,
                        // keep both to avoid stale reads in save mapper
                        ...(selected.id ? { item_id: selected.id } : {}),
                        item_desc:
                          selected.item_name ??
                          selected.item_code ??
                          String(selected.id),
                        // populate fields present in interface as strings
                        price: String(goldPrice ?? selected.item_price ?? 0),
                        price_w: String(selected.work_price ?? 0),
                        weight: String(selected.item_weight ?? 0),
                        g_weight: String(
                          selected.item_g_weight ?? selected.item_weight ?? 0,
                        ),
                        stones: selected.stones ?? null,
                      } as InvoiceDetail;

                      // recalc totals
                      const w = toNum(updated[index].weight);
                      const gw = toNum(updated[index].g_weight);
                      const pr = toNum(updated[index].price);
                      const prw = toNum(updated[index].price_w);
                      const totalA = w * pr;
                      const totalW = gw * prw;
                      const baseCalc =
                        (payType === INVOICE_PAY_TYPES.VALUE
                          ? totalA
                          : payType === INVOICE_PAY_TYPES.WAGES
                            ? totalW
                            : totalA + totalW) -
                        toNum(updated[index].item_disc_amt);
                      const taxCalc =
                        (baseCalc * toNum(updated[index].tax_prc ?? "15")) /
                        100;

                      updated[index].total_a = String(totalA);
                      updated[index].total_w = String(totalW);
                      updated[index].tax = String(taxCalc);
                      updated[index].total = String(baseCalc + taxCalc);

                      setInvoiceItems(updated);
                    }}
                    onCreateOption={(inputValue) => {
                      const newItem = {
                        id: Math.floor(Math.random() * 1000000),
                        item_code: "000000",
                        item_name: inputValue,
                        item_price: 0,
                        item_weight: 0,
                        item_g_weight: 0,
                        work_price: 0,
                      } as Item;

                      setItems((prev) => [...prev, newItem]);
                      const updated = [...invoiceItems];

                      updated[index] = {
                        ...updated[index],
                        item: newItem.id,
                        item_id: newItem.id,
                        item_desc: newItem.item_name,
                        price: String(goldPrice ?? newItem.item_price ?? 0),
                        price_w: String(newItem.work_price ?? 0),
                        weight: String(newItem.item_weight ?? 0),
                        g_weight: String(
                          newItem.item_g_weight ?? newItem.item_weight ?? 0,
                        ),
                      } as InvoiceDetail;
                      setInvoiceItems(updated);
                    }}
                        onKeyDown={(e) => handleEnter(e, index, thisCol)}
                      />
                    );
                  })()}
                </td>

                <td className="align-middle">
                  {(() => {
                    const thisCol = ++col;
                    return (
                      <input
                        id={`qty-${index}${thisCol}`}
                        ref={setRef(index, thisCol)}
                        className="border w-full p-1 text-xs text-center align-middle"
                        disabled={!isEditing}
                        dir="ltr"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        step={1}
                        type="number"
                        value={String(item.qty ?? "")}
                        onChange={(e) =>
                          handleFieldChange(index, "qty", e.target.value)
                        }
                        onKeyDown={(e) => handleEnter(e, index, thisCol)}
                      />
                    );
                  })()}
                </td>

                <td className="align-middle">
                  {(() => {
                    const thisCol = ++col;
                    return (
                      <input
                        ref={setRef(index, thisCol)}
                        id={`weight-${index}${thisCol}`}
                        className="border w-full p-1 text-xs text-center align-middle"
                        disabled={!isEditing}
                        dir="ltr"
                        inputMode="decimal"
                        type="number"
                        step={stepFromDigits(weightDigits)}
                        value={String(item.weight ?? "")}
                        onChange={(e) =>
                          handleFieldChange(index, "weight", e.target.value)
                        }
                        onKeyDown={(e) => handleEnter(e, index, thisCol)}
                      />
                    );
                  })()}
                </td>

                <td className="align-middle">
                  {(() => {
                    const thisCol = ++col;
                    return (
                      <input
                        ref={setRef(index, thisCol)}
                        id={`gweight-${index}${thisCol}`}
                        className="border w-full p-1 text-xs text-center align-middle"
                        disabled={!isEditing}
                        dir="ltr"
                        inputMode="decimal"
                        type="number"
                        step={stepFromDigits(gWeightDigits)}
                        value={String(item.g_weight ?? "")}
                        onChange={(e) =>
                          handleFieldChange(index, "g_weight", e.target.value)
                        }
                        onKeyDown={(e) => handleEnter(e, index, thisCol)}
                      />
                    );
                  })()}
                </td>

                <td>
                  {(() => {
                    const thisCol = ++col;
                    return (
                      <input
                        ref={setRef(index, thisCol)}
                        id={`stones-${index}${thisCol}`}
                        className="border w-full p-1 text-xs text-center"
                        disabled={!isEditing}
                        dir="ltr"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        type="number"
                        step={1}
                        value={String(item.stones ?? "")}
                        onChange={(e) =>
                          handleFieldChange(
                            index,
                            "stones",
                            sanitizeNumericInput(e.target.value, false),
                          )
                        }
                        onKeyDown={(e) => handleEnter(e, index, thisCol)}
                      />
                    );
                  })()}
                </td>

                {(payType === INVOICE_PAY_TYPES.VALUE ||
                  payType === INVOICE_PAY_TYPES.VALUE_AND_WAGES) && (
                  <td>
                    {(() => {
                      const thisCol = ++col;
                      return (
                        <input
                          ref={setRef(index, thisCol)}
                          id={`price-${index}${thisCol}`}
                          className="border w-full p-1 text-xs text-center"
                          disabled={!isEditing}
                          dir="ltr"
                          inputMode="decimal"
                          type="number"
                          step={stepFromDigits(priceDigits)}
                          value={String(item.price ?? "")}
                          onChange={(e) =>
                            handleFieldChange(index, "price", e.target.value)
                          }
                          onKeyDown={(e) => handleEnter(e, index, thisCol)}
                        />
                      );
                    })()}
                  </td>
                )}

                {(payType === INVOICE_PAY_TYPES.WAGES ||
                  payType === INVOICE_PAY_TYPES.VALUE_AND_WAGES) && (
                  <td>
                    {(() => {
                      const thisCol = ++col;
                      return (
                        <input
                          ref={setRef(index, thisCol)}
                          id={`pricew-${index}${thisCol}`}
                          className="border w-full p-1 text-xs text-center"
                          disabled={!isEditing}
                          required={
                            payType === INVOICE_PAY_TYPES.WAGES ||
                            payType === INVOICE_PAY_TYPES.VALUE_AND_WAGES
                          }
                          dir="ltr"
                          inputMode="decimal"
                          type="number"
                          step={stepFromDigits(priceWDigits)}
                          value={String(item.price_w ?? "")}
                          onChange={(e) =>
                            handleFieldChange(index, "price_w", e.target.value)
                          }
                          onKeyDown={(e) => handleEnter(e, index, thisCol)}
                        />
                      );
                    })()}
                  </td>
                )}

                {(payType === INVOICE_PAY_TYPES.VALUE ||
                  payType === INVOICE_PAY_TYPES.VALUE_AND_WAGES) && (
                  <td>
                    {(() => {
                      const thisCol = ++col;
                      return (
                        <input
                          ref={setRef(index, thisCol)}
                          id={`totala-${index}${thisCol}`}
                          className="border w-full p-1 text-xs text-center"
                          disabled={!isEditing}
                          dir="ltr"
                          inputMode="decimal"
                          type="number"
                          step={stepFromDigits(totalADigits)}
                          value={String(item.total_a ?? "")}
                          onChange={(e) =>
                            handleTotalAChange(index, e.target.value)
                          }
                          onKeyDown={(e) => handleEnter(e, index, thisCol)}
                        />
                      );
                    })()}
                  </td>
                )}

                {(payType === INVOICE_PAY_TYPES.WAGES ||
                  payType === INVOICE_PAY_TYPES.VALUE_AND_WAGES) && (
                  <td>
                    {(() => {
                      const thisCol = ++col;
                      return (
                        <input
                          ref={setRef(index, thisCol)}
                          id={`totalw-${index}${thisCol}`}
                          className="border w-full p-1 text-xs text-center"
                          disabled={!isEditing}
                          dir="ltr"
                          inputMode="decimal"
                          type="number"
                          step={stepFromDigits(totalWDigits)}
                          value={String(item.total_w ?? "")}
                          onChange={(e) =>
                            handleTotalWChange(index, e.target.value)
                          }
                          onKeyDown={(e) => handleEnter(e, index, thisCol)}
                        />
                      );
                    })()}
                  </td>
                )}

                <td>
                  {(() => {
                    const thisCol = ++col;
                    return (
                      <input
                        ref={setRef(index, thisCol)}
                        id={`disc-${index}${thisCol}`}
                        className="border w-full p-1 text-xs text-center"
                        disabled={!isEditing}
                        dir="ltr"
                        inputMode="decimal"
                        type="number"
                        step={stepFromDigits(itemDiscDigits)}
                        value={String(item.item_disc_amt ?? "")}
                        onChange={(e) =>
                          handleFieldChange(index, "item_disc_amt", e.target.value)
                        }
                        onKeyDown={(e) => handleEnter(e, index, thisCol)}
                      />
                    );
                  })()}
                </td>

                <td>
                  {(() => {
                    const thisCol = ++col;
                    return (
                      <select
                        ref={setRef(index, thisCol)}
                        id={`taxprc-${index}${thisCol}`}
                        className="border w-full p-1 text-xs text-center"
                        disabled={!isEditing}
                        value={String(Math.round(toNum(item.tax_prc)))}
                        onChange={(e) =>
                          handleFieldChange(index, "tax_prc", e.target.value)
                        }
                        onKeyDown={(e) => handleEnter(e, index, thisCol)}
                      >
                    {taxRates.map((rate) => (
                      <option key={rate} value={rate}>
                        {rate}%
                      </option>
                    ))}
                      </select>
                    );
                  })()}
                </td>

                <td>{formatAmount(String(item.tax ?? tax), taxDigits)}</td>

                <td>
                  {(() => {
                    const thisCol = ++col;
                    return (
                      <input
                        ref={setRef(index, thisCol)}
                        id={`total-${index}${thisCol}`}
                        className="border w-full p-1 text-xs text-center"
                        disabled={!isEditing}
                        type="number"
                        dir="ltr"
                        inputMode="decimal"
                        step={stepFromDigits(totalDigits)}
                        value={
                          tempTotals[item.id] !== undefined
                            ? tempTotals[item.id]
                            : Number.isFinite(totalWithTax)
                              ? String(Number(totalWithTax.toFixed(totalDigits)))
                              : ""
                        }
                        onBlur={(e) => {
                          handleTotalChange(index, e.target.value);
                        }}
                        onChange={(e) =>
                          setTempTotals((prev) => ({
                            ...prev,
                            [item.id]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => handleEnter(e, index, thisCol)}
                      />
                    );
                  })()}
                </td>

                <td>
                  {(() => {
                    const thisCol = ++col;
                    return (
                      <input
                        ref={setRef(index, thisCol)}
                        id={`desc-${index}${thisCol}`}
                        className="border w-full p-1 text-xs text-center"
                        disabled={!isEditing}
                        value={item.item_desc ?? ""}
                        onChange={(e) =>
                          handleFieldChange(index, "item_desc", e.target.value)
                        }
                        onKeyDown={(e) => handleEnter(e, index, thisCol, true)}
                      />
                    );
                  })()}
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
  );
}
