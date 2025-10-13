"use client";

import React, { useEffect, useRef, useState, type KeyboardEvent } from "react";
import CreatableSelect from "react-select/creatable";
import { withAsyncPaginate } from "react-select-async-paginate";
import { formatAmount } from "@/utilities/formatAmount";
import useFractions from "@/utilities/useFractions";
import { API_BASE_URL, API_ENDPOINTS, fetchData } from "@/utilities/api";
import type { InvoiceDetail } from "@/types/models/invoice";

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
  setItems: (items: Item[]) => void;
  invoiceItems: InvoiceDetail[];
  setInvoiceItems: (items: InvoiceDetail[]) => void;
  goldPrice: number | null;
  payType: number; // 1=gold, 2=wage, 3=both
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

  const inputRefs = useRef<(HTMLInputElement | null)[][]>([]);
  const [tempTotals, setTempTotals] = useState<Record<number, string>>({});
  const [taxRates, setTaxRates] = useState<number[]>([0, 5, 10, 15, 20]);

  // load tax rates from API
  useEffect(() => {
    const loadTaxRates = async () => {
      try {
        const response = await fetchData<any[]>(API_ENDPOINTS.TaxPrcList);
        if (Array.isArray(response) && response.length > 0) {
          const rates = response.map((item) =>
            parseFloat(item.tax_prc ?? item.value ?? 0),
          );
          setTaxRates([0, ...rates.filter((r) => r > 0)]);
        }
      } catch (error) {
        console.error("فشل في تحميل قائمة الضرائب:", error);
      }
    };

    loadTaxRates();
  }, []);

  const loadItemOptions = async (
    search: string,
    _loaded: any,
    { page }: { page: number },
  ) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}SearchItemsList/?q=${encodeURIComponent(search)}&page=${page}`,
      );
      const json = await res.json();
      const term = search.toLowerCase();

      const options = Array.isArray(json.results)
        ? json.results
            .map((it: any) => {
              const itemCode = (it.item_code ?? it.code ?? "").toLowerCase();
              const itemName = (it.item_name ?? it.name ?? "").toLowerCase();
              const codeMatch = itemCode.indexOf(term);
              const nameMatch = itemName.indexOf(term);

              return {
                value: it.id,
                label: `${it.item_code ?? it.code ?? "غير معروف"} - ${it.item_name ?? it.name ?? ""}`,
                item: it,
                codeMatch,
                nameMatch,
              };
            })
            .filter((opt: any) => opt.codeMatch !== -1 || opt.nameMatch !== -1)
            .sort((a: any, b: any) => {
              const aCode = a.codeMatch === -1 ? Infinity : a.codeMatch;
              const bCode = b.codeMatch === -1 ? Infinity : b.codeMatch;
              if (aCode !== bCode) return aCode - bCode;
              const aName = a.nameMatch === -1 ? Infinity : a.nameMatch;
              const bName = b.nameMatch === -1 ? Infinity : b.nameMatch;
              return aName - bName;
            })
            .map(({ value, label, item }: any) => ({ value, label, item }))
        : [];

      return {
        options,
        hasMore: !!json.next,
        additional: { page: page + 1 },
      };
    } catch (e) {
      console.error("failed to load items", e);
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
      // normalize value into string
      const n = toNum(value);
      updated[index] = {
        ...updated[index],
        [field]: String(n),
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
    if (payType === 1) {
      total_a = weight * price;
      total_w = 0;
    } else if (payType === 2) {
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
    setInvoiceItems([...invoiceItems, newItem]);
  };

  const handleEnter = (
    e: KeyboardEvent,
    rowIndex: number,
    colIndex: number,
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const nextRow = rowIndex + 1;
      const nextCol = 0;
      if (nextRow < invoiceItems.length) {
        const nextInput = inputRefs.current[nextRow]?.[nextCol];
        if (nextInput) nextInput.focus();
      } else {
        addRow();
        setTimeout(() => {
          const newRowInput = inputRefs.current[nextRow]?.[nextCol];
          if (newRowInput) newRowInput.focus();
        }, 100);
      }
    }
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

    if (payType === 1) {
      updated[index].total_a = String(totalWithoutTax);
      updated[index].total_w = "0";
      if (toNum(updated[index].weight) > 0)
        updated[index].price = String(
          totalWithoutTax / toNum(updated[index].weight),
        );
    } else if (payType === 2) {
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
    setTempTotals((prev) => {
      const copy = { ...prev };
      delete copy[updated[index].id];
      return copy;
    });
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

  const setRef = (row: number, col: number, el: HTMLInputElement | null) => {
    if (!inputRefs.current[row]) inputRefs.current[row] = [];
    inputRefs.current[row][col] = el;
  };

  return (
    <div className="w-full overflow-x-auto mb-6 max-w-full">
      <div className="flex justify-between mb-2">
        <button
          type="button"
          className="btn"
          onClick={addRow}
          disabled={!isEditing}
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
            {(payType === 1 || payType === 3) && (
              <th className="w-[100px]">سعر الجرام</th>
            )}
            {(payType === 2 || payType === 3) && (
              <th className="w-[100px]">أجرة الجرام</th>
            )}
            {(payType === 1 || payType === 3) && (
              <th className="w-[100px]">اجمالي القيمة</th>
            )}
            {(payType === 2 || payType === 3) && (
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
            if (payType === 1) rowBase = totalA;
            else if (payType === 2) rowBase = totalW;
            else rowBase = totalA + totalW;

            const base = rowBase - toNum(item.item_disc_amt);
            const tax = (base * toNum(item.tax_prc ?? "15")) / 100;
            const totalWithTax = base + tax;

            return (
              <tr key={item.id}>
                <td className="p-1">
                  <AsyncCreatableSelect
                    ref={(el: any) => {
                      inputRefs.current[index][++col] =
                        el as unknown as HTMLInputElement;
                    }}
                    isClearable
                    isSearchable
                    isDisabled={!isEditing}
                    additional={{ page: 1 }}
                    className="text-xs"
                    classNamePrefix="select"
                    components={{ IndicatorSeparator: () => null }}
                    formatCreateLabel={(inputValue) =>
                      `إضافة صنف جديد: "${inputValue}"`
                    }
                    instanceId={`item-select-${index}`}
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
                    value={
                      item.item && item.item > 0
                        ? {
                            value: item.item,
                            label: item.item_desc ?? `${item.item}`,
                          }
                        : null
                    }
                    onChange={(opt: any) => {
                      const selected =
                        opt?.item || items.find((it) => it.id === opt?.value);
                      if (!selected) return;
                      // cache option if missing
                      if (!items.find((i) => i.id === selected.id))
                        setItems([...items, selected]);

                      const updated = [...invoiceItems];
                      updated[index] = {
                        ...updated[index],
                        item: selected.id ?? 0,
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
                        (payType === 1
                          ? totalA
                          : payType === 2
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
                      setItems([...items, newItem]);
                      const updated = [...invoiceItems];
                      updated[index] = {
                        ...updated[index],
                        item: newItem.id,
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
                    onKeyDown={(e) => handleEnter(e, index, col)}
                  />
                </td>

                <td>
                  <input
                    ref={(el) => setRef(index, ++col, el)}
                    className="border w-full p-1 text-xs text-center"
                    type="number"
                    step="1"
                    value={Number.parseInt(String(item.qty || "0"), 10) || 0}
                    disabled={!isEditing}
                    onChange={(e) =>
                      handleFieldChange(index, "qty", e.target.value)
                    }
                    onKeyDown={(e) => handleEnter(e, index, col)}
                  />
                </td>

                <td>
                  <input
                    ref={(el) => {
                      inputRefs.current[index][++col] = el;
                    }}
                    className="border w-full p-1 text-xs text-center"
                    step="any"
                    type="number"
                    value={toNum(item.weight).toFixed(weightDigits)}
                    disabled={!isEditing}
                    onChange={(e) =>
                      handleFieldChange(index, "weight", e.target.value)
                    }
                    onKeyDown={(e) => handleEnter(e, index, col)}
                  />
                </td>

                <td>
                  <input
                    ref={(el) => {
                      inputRefs.current[index][++col] = el;
                    }}
                    className="border w-full p-1 text-xs text-center"
                    step="any"
                    type="number"
                    value={toNum(item.g_weight).toFixed(gWeightDigits)}
                    disabled={!isEditing}
                    onChange={(e) =>
                      handleFieldChange(index, "g_weight", e.target.value)
                    }
                    onKeyDown={(e) => handleEnter(e, index, col)}
                  />
                </td>

                <td>
                  <input
                    ref={(el) => {
                      inputRefs.current[index][++col] = el;
                    }}
                    className="border w-full p-1 text-xs text-center"
                    value={String(item.stones ?? "")}
                    disabled={!isEditing}
                    onChange={(e) =>
                      handleFieldChange(index, "stones", e.target.value)
                    }
                    onKeyDown={(e) => handleEnter(e, index, col)}
                  />
                </td>

                {(payType === 1 || payType === 3) && (
                  <td>
                    <input
                      ref={(el) => {
                        inputRefs.current[index][++col] = el;
                      }}
                      className="border w-full p-1 text-xs text-center"
                      step="any"
                      type="number"
                      value={toNum(item.price).toFixed(priceDigits)}
                      disabled={!isEditing}
                      onChange={(e) =>
                        handleFieldChange(index, "price", e.target.value)
                      }
                      onKeyDown={(e) => handleEnter(e, index, col)}
                    />
                  </td>
                )}

                {(payType === 2 || payType === 3) && (
                  <td>
                    <input
                      ref={(el) => {
                        inputRefs.current[index][++col] = el;
                      }}
                      className="border w-full p-1 text-xs text-center"
                      step="any"
                      type="number"
                      value={toNum(item.price_w).toFixed(priceWDigits)}
                      disabled={!isEditing}
                      onChange={(e) =>
                        handleFieldChange(index, "price_w", e.target.value)
                      }
                      onKeyDown={(e) => handleEnter(e, index, col)}
                    />
                  </td>
                )}

                {(payType === 1 || payType === 3) && (
                  <td>
                    <input
                      ref={(el) => {
                        inputRefs.current[index][++col] = el;
                      }}
                      className="border w-full p-1 text-xs text-center"
                      step="any"
                      type="number"
                      value={toNum(item.total_a).toFixed(totalADigits)}
                      disabled={!isEditing}
                      onChange={(e) =>
                        handleTotalAChange(index, e.target.value)
                      }
                      onKeyDown={(e) => handleEnter(e, index, col)}
                    />
                  </td>
                )}

                {(payType === 2 || payType === 3) && (
                  <td>
                    <input
                      ref={(el) => {
                        inputRefs.current[index][++col] = el;
                      }}
                      className="border w-full p-1 text-xs text-center"
                      step="any"
                      type="number"
                      value={toNum(item.total_w).toFixed(totalWDigits)}
                      disabled={!isEditing}
                      onChange={(e) =>
                        handleTotalWChange(index, e.target.value)
                      }
                      onKeyDown={(e) => handleEnter(e, index, col)}
                    />
                  </td>
                )}

                <td>
                  <input
                    ref={(el) => {
                      inputRefs.current[index][++col] = el;
                    }}
                    className="border w-full p-1 text-xs text-center"
                    step="any"
                    type="number"
                    value={toNum(item.item_disc_amt).toFixed(itemDiscDigits)}
                    disabled={!isEditing}
                    onChange={(e) =>
                      handleFieldChange(index, "item_disc_amt", e.target.value)
                    }
                    onKeyDown={(e) => handleEnter(e, index, col)}
                  />
                </td>

                <td>
                  <select
                    ref={(el) => {
                      inputRefs.current[index][++col] = el;
                    }}
                    className="border w-full p-1 text-xs text-center"
                    value={toNum(item.tax_prc).toFixed(0)}
                    disabled={!isEditing}
                    onChange={(e) =>
                      handleFieldChange(index, "tax_prc", e.target.value)
                    }
                    onKeyDown={(e) => handleEnter(e, index, col)}
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
                    ref={(el) => {
                      inputRefs.current[index][++col] = el;
                    }}
                    className="border w-full p-1 text-xs text-center"
                    value={
                      tempTotals[item.id] !== undefined
                        ? tempTotals[item.id]
                        : formatAmount(String(totalWithTax), totalDigits)
                    }
                    disabled={!isEditing}
                    onBlur={(e) => {
                      setTempTotals((prev) => {
                        const copy = { ...prev };
                        delete copy[item.id];
                        return copy;
                      });
                      handleTotalChange(index, e.target.value);
                    }}
                    onChange={(e) =>
                      setTempTotals((prev) => ({
                        ...prev,
                        [item.id]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => handleEnter(e, index, col)}
                  />
                </td>

                <td>
                  <input
                    ref={(el) => {
                      inputRefs.current[index][++col] = el;
                    }}
                    className="border w-full p-1 text-xs text-center"
                    value={item.item_desc ?? ""}
                    disabled={!isEditing}
                    onChange={(e) =>
                      handleFieldChange(index, "item_desc", e.target.value)
                    }
                    onKeyDown={(e) => handleEnter(e, index, col)}
                  />
                </td>

                <td>
                  <button
                    className="text-red-600 font-bold"
                    tabIndex={-1}
                    onClick={() => removeRow(item.id)}
                    disabled={!isEditing}
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
