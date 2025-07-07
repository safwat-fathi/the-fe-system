"use client";

import type { InvoiceItem } from "@/types/invoice-item";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import CreatableSelect from "react-select/creatable";
import { withAsyncPaginate } from "react-select-async-paginate";

import useFractions from "@/utilities/useFractions";
import { API_BASE_URL } from "@/utilities/api";

const AsyncCreatableSelect = withAsyncPaginate(CreatableSelect);

interface Item {
  id: number;
  item_code: string;
  item_name: string;
  item_price: number;
  k?: string;
  item_weight?: number;
  item_g_weight?: number;
  stones?: string;
  purity?: string;
  work_price?: number;
  cat?: number;
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
  invoiceItems: InvoiceItem[];
  setInvoiceItems: (items: InvoiceItem[]) => void;
  goldPrice: number | null;
  payType: number; // 1=gold, 2=wage, 3=both
  categories: Category[];
  homePurity: number;
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
}: Props) {
  const weightDigits = useFractions("weight") as number;
  const gWeightDigits = useFractions("g_weight") as number;
  const priceDigits = useFractions("price") as number;
  const priceWDigits = useFractions("price_w") as number;
  const totalADigits = useFractions("total_a") as number;
  const totalWDigits = useFractions("total_w") as number;
  const itemDiscDigits = useFractions("item_disc_amt") as number;
  const totalDigits = useFractions("total") as number;
  const taxDigits = useFractions("tax") as number;
  const inputRefs = useRef<(HTMLElement | null)[][]>([]);
  const [tempTotals, setTempTotals] = useState<Record<number, string>>({});
  const [searchValue, setSearchValue] = useState("");


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
          .filter((opt) => opt.codeMatch !== -1 || opt.nameMatch !== -1)
          .sort((a, b) => {
            const aCode = a.codeMatch === -1 ? Infinity : a.codeMatch;
            const bCode = b.codeMatch === -1 ? Infinity : b.codeMatch;
            if (aCode !== bCode) return aCode - bCode;
            const aName = a.nameMatch === -1 ? Infinity : a.nameMatch;
            const bName = b.nameMatch === -1 ? Infinity : b.nameMatch;
            return aName - bName;
          })
          .map(({ value, label, item }) => ({ value, label, item }))
      : [];

    return {
      options,
      hasMore: !!json.next,
      additional: { page: page + 1 },
    };
  } catch (e) {
    console.error("failed to load items", e);

    return { options: [], hasMore: false, additional: { page: page } };
  }
};

// عند عرض الصنف المحدد
const getItemSelectValue = (item: InvoiceItem) => {
  return item.item_id
    ? {
        value: item.item_id,
        label: `${item.item_code ?? ""} - ${item.item_name ?? ""}`,
      }
    : null;
};

useEffect(() => {
    invoiceItems.forEach((_, i) => {
      if (!inputRefs.current[i]) {
        inputRefs.current[i] = [];
      }
    });
  }, [invoiceItems.length]);

  const handleFieldChange = (
    index: number,
    field: keyof InvoiceItem,
    value: any,
  ) => {
    const updated = [...invoiceItems];

    if (
      [
        "weight",
        "price",
        "price_w",
        "g_weight",
        "qty",
        "item_disc_amt",
      ].includes(field)
    ) {
      const num = parseFloat(value) || 0;
      const map: Record<string, number> = {
        weight: weightDigits,
        price: priceDigits,
        price_w: priceWDigits,
        g_weight: gWeightDigits,
        item_disc_amt: itemDiscDigits,
      };
      const digits = map[field];
      updated[index][field] =
        digits !== undefined ? parseFloat(num.toFixed(digits)) : num;
    } else {
      // @ts-ignore
      updated[index][field] = value;
    }

    if (field === "weight" || field === "purity") {
      const weightVal = parseFloat(String(updated[index].weight)) || 0;
      const purityVal = parseFloat(String(updated[index].purity)) || 0;

      if (homePurity) {
        const g = (weightVal * purityVal) / homePurity;

        updated[index].g_weight = parseFloat(g.toFixed(gWeightDigits));
      }
    }

    const wCalc =
      updated[index].weight < 1 &&
      updated[index].g_weight > updated[index].weight
        ? updated[index].weight * 1000
        : updated[index].weight;

    // total_a depends on invoice type
    updated[index].total_a =
      payType === 2
        ? wCalc * updated[index].price_w
        : wCalc * updated[index].price;
    // total_w = weight * wagePrice
    updated[index].total_w = wCalc * updated[index].price_w;
    const baseTotal =
      (payType === 1
        ? updated[index].total_a
        : payType === 2
          ? updated[index].total_w
          : updated[index].total_a + updated[index].total_w) -
      (updated[index].item_disc_amt ?? 0);

    // tax amount based on total after discount
    updated[index].tax = (baseTotal * (updated[index].tax_prc ?? 15)) / 100;
    // total includes tax
    updated[index].total = baseTotal + updated[index].tax;

    setInvoiceItems(updated);

    const isLastRow = index === invoiceItems.length - 1;
    const isRowFilled =
      updated[index].item_id ||
      updated[index].item_name ||
      updated[index].weight > 0;

    if (isLastRow && isRowFilled) {
      setInvoiceItems([
        ...updated,
        {
          id: Date.now(),
          item_id: null,
          item_code: "",
          qty: 1,
          g_weight: 0,
          weight: 0,
          k: "",
          price: goldPrice ?? 0,
          price_w: goldPrice ?? 0,
          note: "",
          trans_type: 2,
          purity: "",
          total: 0,
          total_w: 0,
          total_a: 0,
          inv_note: "",
          tax: 0,
          tax_prc: 15,
          stones: "",
          item_disc_prc: 0,
          item_disc_amt: 0,
          sn: "",
          item_desc: "",
          cr_date: "",
          cr_user: "",
          upd_date: "",
          upd_user: "",
          com: 0,
          inv: 0,
          item: 0,
        },
      ]);
    }
  };

  const removeRow = (id: number) => {
    const updated = invoiceItems.filter((row) => row.id !== id);

    setInvoiceItems(updated);
  };

  const addRow = () => {
    setInvoiceItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        item_id: null,
        item_code: "",
        qty: 1,
        g_weight: 0,
        weight: 0,
        k: "",
        price: goldPrice ?? 0,
        price_w: goldPrice ?? 0,
        note: "",
        trans_type: 2,
        purity: "",
        total: 0,
        total_w: 0,
        total_a: 0,
        inv_note: "",
        tax: 0,
        tax_prc: 15,
        stones: "",
        item_disc_prc: 0,
        item_disc_amt: 0,
        sn: "",
        item_desc: "",
        cr_date: "",
        cr_user: "",
        upd_date: "",
        upd_user: "",
        com: 0,
        inv: 0,
        item: 0,
      },
    ]);
  };

  const handleKey = (
    e: KeyboardEvent<any>,
    rowIndex: number,
    colIndex: number,
  ) => {
    const rows = inputRefs.current;

    const focusCell = (r: number, c: number) => {
      setTimeout(() => rows[r]?.[c]?.focus(), 0);
    };

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (rows[rowIndex - 1]?.[colIndex]) {
        rows[rowIndex - 1][colIndex]?.focus();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (rows[rowIndex + 1]?.[colIndex]) {
        rows[rowIndex + 1][colIndex]?.focus();
      } else {
        addRow();
        focusCell(rowIndex + 1, colIndex);
      }
      return;
    }

    if (e.key === "ArrowLeft" || (e.key === "Tab" && e.shiftKey)) {
      e.preventDefault();
      let r = rowIndex;
      let c = colIndex - 1;
      if (c < 0 && rows[rowIndex - 1]) {
        r = rowIndex - 1;
        c = rows[r].length - 1;
      }
      if (rows[r]?.[c]) rows[r][c]?.focus();
      return;
    }

    if (
      e.key === "ArrowRight" ||
      e.key === "Enter" ||
      (e.key === "Tab" && !e.shiftKey)
    ) {
      e.preventDefault();
      let r = rowIndex;
      let c = colIndex + 1;
      if (!rows[r]?.[c]) {
        r = rowIndex + 1;
        c = 0;
        if (!rows[r]) addRow();
        focusCell(r, c);
      } else {
        rows[r][c]?.focus();
      }
    }
  };

  const handleTotalChange = (index: number, value: any) => {
    const updated = [...invoiceItems];
    const taxRate = (updated[index].tax_prc ?? 15) / 100;
    const totalWithTax = parseFloat(value) || 0;
    const baseWithoutDisc = totalWithTax / (1 + taxRate);
    const baseTotal = baseWithoutDisc + (updated[index].item_disc_amt ?? 0);

    if (updated[index].weight > 0) {
      const w =
        updated[index].weight < 1 &&
        updated[index].g_weight > updated[index].weight
          ? updated[index].weight * 1000
          : updated[index].weight;

      if (payType === 1) {
        updated[index].price = baseTotal / w;
      } else if (payType === 2) {
        updated[index].price_w = baseTotal / w;
      } else {
        updated[index].price = (baseTotal - w * updated[index].price_w) / w;
      }
      updated[index].total_a =
        payType === 2 ? w * updated[index].price_w : w * updated[index].price;
      updated[index].total_w = w * updated[index].price_w;
    } else {
      // when weight is zero simply store the entered total
      updated[index].total = parseFloat(totalWithTax.toFixed(totalDigits));
      updated[index].tax = parseFloat(
        (totalWithTax - baseWithoutDisc).toFixed(totalDigits),
      );
      setInvoiceItems(updated);

      return;
    }

    const base =
      (payType === 1
        ? updated[index].total_a
        : payType === 2
          ? updated[index].total_w
          : updated[index].total_a + updated[index].total_w) -
      (updated[index].item_disc_amt ?? 0);

    updated[index].tax = parseFloat((base * taxRate).toFixed(taxDigits));
    updated[index].total = parseFloat(
      (base + updated[index].tax).toFixed(totalDigits),
    );

    setInvoiceItems(updated);
  };

  const handleTotalAChange = (index: number, value: any) => {
    const updated = [...invoiceItems];
    const totalA = parseFloat(value) || 0;

    if (updated[index].weight > 0) {
      const w =
        updated[index].weight < 1 &&
        updated[index].g_weight > updated[index].weight
          ? updated[index].weight * 1000
          : updated[index].weight;

      updated[index].price = parseFloat((totalA / w).toFixed(priceDigits));
    }

    updated[index].total_a = parseFloat(totalA.toFixed(totalADigits));

    const baseTotal =
      (payType === 1
        ? updated[index].total_a
        : payType === 2
          ? updated[index].total_w
          : updated[index].total_a + updated[index].total_w) -
      (updated[index].item_disc_amt ?? 0);

    updated[index].tax = (baseTotal * (updated[index].tax_prc ?? 15)) / 100;
    updated[index].total = baseTotal + updated[index].tax;

    setInvoiceItems(updated);
  };

  const handleTotalWChange = (index: number, value: any) => {
    const updated = [...invoiceItems];
    const totalW = parseFloat(value) || 0;

    if (updated[index].weight > 0) {
      const w =
        updated[index].weight < 1 &&
        updated[index].g_weight > updated[index].weight
          ? updated[index].weight * 1000
          : updated[index].weight;

      updated[index].price_w = parseFloat((totalW / w).toFixed(priceWDigits));
    }

    updated[index].total_w = parseFloat(totalW.toFixed(totalWDigits));

    const baseTotal =
      (payType === 1
        ? updated[index].total_a
        : payType === 2
          ? updated[index].total_w
          : updated[index].total_a + updated[index].total_w) -
      (updated[index].item_disc_amt ?? 0);

    updated[index].tax = (baseTotal * (updated[index].tax_prc ?? 15)) / 100;
    updated[index].total = baseTotal + updated[index].tax;

    setInvoiceItems(updated);
  };

  const setRef = (row: number, col: number, el: HTMLElement | null) => {
    if (!inputRefs.current[row]) inputRefs.current[row] = [];
    inputRefs.current[row][col] = el;
  };

  return (
    <div className="w-full overflow-x-auto mb-6 max-w-full">
      <table className="min-w-[1000px] border text-sm text-center table-fixed">
        <thead className="bg-gray-100 text-xs font-semibold">
          <tr>
            <th className="w-[400px]">الصنف</th>
            <th className="w-[60px]">العدد</th>
            <th className="w-[100px]">الوزن القائم</th>
            <th className="w-[80px]">المعايرة</th>
            <th className="w-[100px]">الوزن المعاير</th>
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
            <th className="w-[100px]">الضريبة</th>
            <th className="w-[120px]">الاجمالي شامل الضريبة</th>
            <th className="w-[200px]">البيان</th>
            <th className="w-[60px]">حذف</th>
          </tr>
        </thead>
        <tbody>
          {invoiceItems.map((item, index) => {
            // totals for display
            const totalA = item.weight * item.price;
            const totalW = item.weight * item.price_w; // wagePrice
            let rowTotal = 0;

            if (payType === 1) {
              rowTotal = totalA;
            } else if (payType === 2) {
              rowTotal = totalW;
            } else {
              rowTotal = totalA + totalW;
            }
            const total = rowTotal - (item.item_disc_amt ?? 0);
            const tax = (total * (item.tax_prc ?? 15)) / 100;
            let col = -1;

            return (
              <tr key={item.id}>
                <td>
                  <AsyncCreatableSelect
                    ref={(el) => {
                      inputRefs.current[index][++col] = el as unknown as HTMLElement;
                    }}
                    onKeyDown={(e) => handleKey(e, index, col)}
                    isClearable
                    isSearchable
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
                        item.item_id
                          ? {
                              value: item.item_id,
                              label: `${item.item_code ?? ""} - ${item.item_name ?? ""}`,
                            }
                          : null
                      }
                    onChange={(selectedOption) => {
                      // selectedOption may carry full item data via `item` field
                      // or fallback to items state by id
                      // @ts-ignore
                      const opt: any = selectedOption;
                      const selected =
                        opt?.item || items.find((itm) => itm.id === opt?.value);

                      if (!selected) return;

                      // cache option in items list if not already present
                      if (!items.find((i) => i.id === selected.id)) {
                        setItems([...items, selected]);
                      }


                      const updated = [...invoiceItems];

                      updated[index].item_id = selected.id ?? null;
                      updated[index].item_code = selected.item_code ?? "";
                      updated[index].item_name = selected.item_name ?? "";
                      const selk = selected.k ?? "";
                      const selPurity = selected.purity ?? "";

                      updated[index].k = selected.k ?? "";
                      updated[index].price =
                        goldPrice ?? Number(selected.item_price ?? 0);
                      updated[index].price_w = Number(selected.work_price ?? 0);
                      updated[index].purity = selected.purity ?? "";
                      updated[index].stones = selected.stones ?? "";

                      if (
                        selected.item_weight !== undefined &&
                        selected.item_weight !== null &&
                        selected.item_weight !== ""
                      ) {
                        updated[index].weight = Number(
                          selected.item_weight ?? 0,
                        );
                        updated[index].g_weight = Number(
                          selected.item_g_weight ?? selected.item_weight ?? 0,
                        );
                      }
                      if (
                        selected.item_g_weight !== undefined &&
                        selected.item_g_weight !== null &&
                        selected.item_g_weight !== ""
                      ) {
                        updated[index].g_weight = Number(
                          selected.item_g_weight,
                        );
                      }
                      if (
                        (selk === "" ||
                          selk === "0" ||
                          selPurity === "" ||
                          selPurity === "0") &&
                        selected.cat
                      ) {
                        const cat = categories.find(
                          (c) => c.id === selected.cat,
                        );

                        if (cat) {
                          if (!selk || selk === "0")
                            updated[index].k = (cat.gauge ??
                              cat.k ??
                              "") as string;
                          if (!selPurity || selPurity === "0")
                            updated[index].purity = cat.purity ?? "";
                        }
                      }
                      // total_a varies by invoice type
                      updated[index].total_a =
                        payType === 2
                          ? updated[index].weight * updated[index].price_w
                          : updated[index].weight * updated[index].price;
                      // total_w = weight * wagePrice
                      updated[index].total_w =
                        updated[index].weight * updated[index].price_w;
                      const base =
                        (payType === 1
                          ? updated[index].total_a
                          : payType === 2
                            ? updated[index].total_w
                            : updated[index].total_a + updated[index].total_w) -
                        (updated[index].item_disc_amt ?? 0);

                      updated[index].tax =
                        (base * (updated[index].tax_prc ?? 15)) / 100;
                      updated[index].total = base + updated[index].tax;

                      setInvoiceItems(updated);
                    }}
                    onCreateOption={(inputValue) => {
                      const newItem = {
                        id: Math.floor(Math.random() * 1000000),
                        item_code: "000000",
                        item_name: inputValue,
                        k: "",
                        item_price: 0,
                        item_weight: 0,
                        item_g_weight: 0,
                        stones: "",
                        purity: "",
                        work_price: 0,
                      };

                      setItems([...items, newItem]);
                      const updated = [...invoiceItems];

                      const totalA =
                        (newItem.item_weight ?? 0) *
                        (goldPrice ?? newItem.item_price);
                      const totalW =
                        (newItem.item_weight ?? 0) * (newItem.work_price ?? 0);
                      const base =
                        (payType === 1
                          ? totalA
                          : payType === 2
                            ? totalW
                            : totalA + totalW) - (newItem.item_disc_amt ?? 0);

                      updated[index] = {
                        ...updated[index],
                        item_id: newItem.id,
                        item_code: newItem.item_code,
                        item_name: newItem.item_name,
                        k: newItem.k || "",
                        price: goldPrice ?? newItem.item_price,
                        price_w: newItem.work_price ?? 0,
                        weight: newItem.item_weight ?? 0,
                        g_weight:
                          newItem.item_g_weight !== undefined &&
                          newItem.item_g_weight !== null &&
                          newItem.item_g_weight !== ""
                            ? Number(newItem.item_g_weight)
                            : Number(newItem.item_weight ?? 0),
                        stones: newItem.stones ?? "",
                        purity: newItem.purity ?? "",
                        total_a: totalA,
                        total_w: totalW,
                        total: base + base * ((newItem.tax_prc ?? 15) / 100),
                        tax: base * ((newItem.tax_prc ?? 15) / 100),
                      };
                      setInvoiceItems(updated);
                    }}
                  />
                </td>
                <td>
                  <input
                    ref={(el) => setRef(index, ++col, el)}
                    className="border w-full p-1 text-xs text-center appearance-none"
                    style={{ minWidth: 0, maxWidth: "100%" }}
                    type="number"
                    value={item.qty}
                    onChange={(e) =>
                      handleFieldChange(index, "qty", e.target.value)
                    }
                    onKeyDown={(e) => handleKey(e, index, col)}
                  />
                </td>
                <td>
                  <input
                    ref={(el) => {
                      inputRefs.current[index][++col] = el;
                    }}
                    className="border w-full p-1 text-xs text-center appearance-none"
                    style={{ minWidth: 0, maxWidth: "100%" }}
                    type="number"
                    value={Number(item.weight).toFixed(weightDigits)}
                    onChange={(e) =>
                      handleFieldChange(index, "weight", e.target.value)
                    }
                    onKeyDown={(e) => handleKey(e, index, col)}
                  />
                </td>
                <td>
                  <input
                    ref={(el) => {
                      inputRefs.current[index][++col] = el;
                    }}
                    className="border w-full p-1 text-xs text-center appearance-none"
                    style={{ minWidth: 0, maxWidth: "100%" }}
                    value={item.purity}
                    onChange={(e) =>
                      handleFieldChange(index, "purity", e.target.value)
                    }
                    onKeyDown={(e) => handleKey(e, index, col)}
                  />
                </td>
                <td>
                  <input
                    ref={(el) => {
                      inputRefs.current[index][++col] = el;
                    }}
                    className="border w-full p-1 text-xs text-center appearance-none"
                    style={{ minWidth: 0, maxWidth: "100%" }}
                    type="number"
                    value={Number(item.g_weight).toFixed(gWeightDigits)}
                    onChange={(e) =>
                      handleFieldChange(index, "g_weight", e.target.value)
                    }
                    onKeyDown={(e) => handleKey(e, index, col)}
                  />
                </td>
                <td>
                  <input
                    ref={(el) => {
                      inputRefs.current[index][++col] = el;
                    }}
                    className="border w-full p-1 text-xs text-center appearance-none"
                    style={{ minWidth: 0, maxWidth: "100%" }}
                    value={item.stones}
                    onChange={(e) =>
                      handleFieldChange(index, "stones", e.target.value)
                    }
                    onKeyDown={(e) => handleKey(e, index, col)}
                  />
                </td>
                {(payType === 1 || payType === 3) && (
                  <td>
                    <input
                      ref={(el) => {
                        inputRefs.current[index][++col] = el;
                      }}
                      className="border w-full p-1 text-xs text-center appearance-none"
                      style={{ minWidth: 0, maxWidth: "100%" }}
                      type="number"
                      value={Number(item.price).toFixed(priceDigits)}
                      onChange={(e) =>
                        handleFieldChange(index, "price", e.target.value)
                      }
                      onKeyDown={(e) => handleKey(e, index, col)}
                    />
                  </td>
                )}
                {(payType === 2 || payType === 3) && (
                  <td>
                    <input
                      ref={(el) => {
                        inputRefs.current[index][++col] = el;
                      }}
                      className="border w-full p-1 text-xs text-center appearance-none"
                      style={{ minWidth: 0, maxWidth: "100%" }}
                      type="number"
                      value={Number(item.price_w).toFixed(priceWDigits)}
                      onChange={(e) =>
                        handleFieldChange(index, "price_w", e.target.value)
                      }
                      onKeyDown={(e) => handleKey(e, index, col)}
                    />
                  </td>
                )}
                {(payType === 1 || payType === 3) && (
                  <td>
                    <input
                      ref={(el) => {
                        inputRefs.current[index][++col] = el;
                      }}
                      className="border w-full p-1 text-xs text-center appearance-none"
                      style={{ minWidth: 0, maxWidth: "100%" }}
                      type="number"
                      value={Number(item.total_a).toFixed(totalADigits)}
                      onChange={(e) =>
                        handleTotalAChange(index, e.target.value)
                      }
                      onKeyDown={(e) => handleKey(e, index, col)}
                    />
                  </td>
                )}
                {(payType === 2 || payType === 3) && (
                  <td>
                    <input
                      ref={(el) => {
                        inputRefs.current[index][++col] = el;
                      }}
                      className="border w-full p-1 text-xs text-center appearance-none"
                      style={{ minWidth: 0, maxWidth: "100%" }}
                      type="number"
                      value={Number(item.total_w).toFixed(totalWDigits)}
                      onChange={(e) =>
                        handleTotalWChange(index, e.target.value)
                      }
                      onKeyDown={(e) => handleKey(e, index, col)}
                    />
                  </td>
                )}
                <td>
                  <input
                    ref={(el) => {
                      inputRefs.current[index][++col] = el;
                    }}
                    className="border w-full p-1 text-xs text-center appearance-none"
                    style={{ minWidth: 0, maxWidth: "100%" }}
                    type="number"
                    value={Number(item.item_disc_amt).toFixed(itemDiscDigits)}
                    onChange={(e) =>
                      handleFieldChange(index, "item_disc_amt", e.target.value)
                    }
                    onKeyDown={(e) => handleKey(e, index, col)}
                  />
                </td>
                <td>{(item.tax ?? tax).toFixed(taxDigits)}</td>
                <td>
                  <input
                    ref={(el) => {
                      inputRefs.current[index][++col] = el;
                    }}
                    className="border w-full p-1 text-xs text-center appearance-none"
                    style={{ minWidth: 0, maxWidth: "100%" }}
                    type="number"
                    value={
                      tempTotals[item.id] !== undefined
                        ? tempTotals[item.id]
                        : (item.total ?? total + tax).toFixed(totalDigits)
                    }
                    onBlur={(e) => {
                      setTempTotals((prev) => {
                        const { [item.id]: removed, ...rest } = prev;

                        return rest;
                      });
                      handleTotalChange(index, e.target.value);
                    }}
                    onChange={(e) =>
                      setTempTotals((prev) => ({
                        ...prev,
                        [item.id]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => handleKey(e, index, col)}
                  />
                </td>
                <td>
                  <input
                    ref={(el) => {
                      inputRefs.current[index][++col] = el;
                    }}
                    className="border w-full p-1 text-xs text-center appearance-none"
                    style={{ minWidth: 0, maxWidth: "100%" }}
                    value={item.item_desc}
                    onChange={(e) =>
                      handleFieldChange(index, "item_desc", e.target.value)
                    }
                    onKeyDown={(e) => handleKey(e, index, col)}
                  />
                </td>
                <td>
                  <button
                    className="text-red-600 font-bold"
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
