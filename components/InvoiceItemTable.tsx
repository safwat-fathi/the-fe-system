"use client";

import type { InvoiceItem } from "@/types/invoice-item";

import { useEffect, useRef, type KeyboardEvent } from "react";
import CreatableSelect from "react-select/creatable";

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
}

export default function InvoiceItemTable({
  items,
  setItems,
  invoiceItems,
  setInvoiceItems,
  goldPrice,
  payType,
  categories,
}: Props) {
  const inputRefs = useRef<(HTMLInputElement | null)[][]>([]);

  // prepare refs array when rows change
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
      updated[index][field] = parseFloat(value) || 0;
    } else {
      // @ts-ignore
      updated[index][field] = value;
    }

    // total_a = weight * price
    updated[index].total_a = updated[index].weight * updated[index].price;
    // total_w = weight * wagePrice
    updated[index].total_w = updated[index].weight * updated[index].price_w;
    // total = total_a + total_w - discount
    updated[index].total =
      updated[index].total_a +
      updated[index].total_w -
      (updated[index].item_disc_amt ?? 0);
    // tax amount based on total after discount
    updated[index].tax =
      (updated[index].total * (updated[index].tax_prc ?? 15)) / 100;
    updated[index].total_t = updated[index].total + updated[index].tax;

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
          qty: 0,
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
          total_t: 0,
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

  const handleEnter = (
    e: KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    colIndex: number,
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();

      const nextCol = colIndex + 1;
      const rowRefs = inputRefs.current[rowIndex];
      let nextRef: HTMLInputElement | null | undefined = rowRefs?.[nextCol];

      if (!nextRef) {
        const nextRowRefs = inputRefs.current[rowIndex + 1];

        nextRef = nextRowRefs?.[0];
      }

      nextRef?.focus();
    }
  };

  const handleTotalChange = (index: number, value: any) => {
    const updated = [...invoiceItems];
    const taxRate = (updated[index].tax_prc ?? 15) / 100;
    const totalWithTax = parseFloat(value) || 0;
    const baseTotal = totalWithTax / (1 + taxRate);

    let pricePart = updated[index].price;
    let wagePart = updated[index].price_w;

    if (updated[index].weight > 0) {
      if (payType === 1) {
        pricePart = baseTotal / updated[index].weight;
        updated[index].price = pricePart;
      } else if (payType === 2) {
        wagePart = baseTotal / updated[index].weight;
        updated[index].price_w = wagePart;
      } else {
        pricePart =
          (baseTotal - updated[index].weight * updated[index].price_w) /
          updated[index].weight;
        updated[index].price = pricePart;
      }
    }

    updated[index].total_a = updated[index].weight * updated[index].price;
    updated[index].total_w = updated[index].weight * updated[index].price_w;
    updated[index].total =
      updated[index].total_a +
      updated[index].total_w -
      (updated[index].item_disc_amt ?? 0);
    updated[index].tax = updated[index].total * taxRate;
    updated[index].total_t = updated[index].total + updated[index].tax;

    setInvoiceItems(updated);
  };

  const setRef = (
  row: number,
  col: number,
  el: HTMLInputElement | null
) => {
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
            <th className="w-[100px]">وزن معايير</th>
            <th className="w-[80px]">العيار</th>
            <th className="w-[80px]">المعايرة</th>
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
            <th className="w-[120px]">الاجمالي شامل الضريبة</th>
            <th className="w-[100px]">الخصم</th>
            <th className="w-[100px]">الضريبة</th>
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
                  <CreatableSelect
                    isClearable
                    isSearchable
                    className="text-xs"
                    classNamePrefix="select"
                    components={{ IndicatorSeparator: () => null }}
                    formatCreateLabel={(inputValue) =>
                      `إضافة صنف جديد: "${inputValue}"`
                    }
                    instanceId={`item-select-${index}`}
                    menuPortalTarget={
                      typeof window !== "undefined" ? document.body : null
                    }
                    menuPosition="fixed"
                    options={items.map((it) => ({
                      value: it.id,
                      label: `${it.item_code} - ${it.item_name}`,
                    }))}
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
                            label: `${item.item_code ?? item.item_id} - ${item.item_name}`,
                          }
                        : null
                    }
                    onChange={(selectedOption) => {
                      const selected = items.find(
                        (itm) => itm.id === selectedOption?.value,
                      );
                      console.log("selected item raw:", selected);

                      const updated = [...invoiceItems];

                      updated[index].item_id = selected?.id ?? null;
                      updated[index].item_code = selected?.item_code ?? "";
                      updated[index].item_name = selected?.item_name ?? "";
                      const selk = selected?.k ?? "";
                      const selPurity = selected?.purity ?? "";
                      updated[index].k = selected?.k ?? "";
                      updated[index].price = goldPrice ?? Number(selected?.item_price ?? 0);
                      updated[index].price_w = Number(selected?.work_price ?? 0);
                      updated[index].purity = selected?.purity ?? "";
                      updated[index].stones = selected?.stones ?? "";
                      
                      if (
                        selected?.item_weight !== undefined &&
                        selected?.item_weight !== null &&
                        selected.item_weight !== ""
                      ) {
                        updated[index].weight = Number(selected?.item_weight ?? 0);
                        updated[index].g_weight = Number(selected?.item_g_weight ?? selected?.item_weight ?? 0);
                      }
                      if (
                        selected?.item_g_weight !== undefined &&
                        selected?.item_g_weight !== null &&
                        selected.item_g_weight !== ""
                      ) {
                        updated[index].g_weight = Number(
                          selected.item_g_weight,
                        );
                      }
                      if (
                        ((selk === "" || selk === "0") ||
                          (selPurity === "" || selPurity === "0")) &&
                        selected?.cat
                      ) {
                        const cat = categories.find(
                          (c) => c.id === selected.cat,
                        );

                        if (cat) {
                          if (!selk || selk === "0")
                            updated[index].k = (cat.gauge ?? cat.k ?? "") as string;
                          if (!selPurity || selPurity === "0")
                            updated[index].purity = cat.purity ?? "";
                        }
                      }
                      // total_a = weight * price
                      updated[index].total_a =
                        updated[index].weight * updated[index].price;
                      // total_w = weight * wagePrice
                      updated[index].total_w =
                        updated[index].weight * updated[index].price_w;
                      // total = total_a + total_w - discount
                      updated[index].total =
                        updated[index].total_a +
                        updated[index].total_w -
                        (updated[index].item_disc_amt ?? 0);
                      // tax amount based on total after discount
                      updated[index].tax =
                        (updated[index].total *
                          (updated[index].tax_prc ?? 15)) /
                        100;

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
                        // total_a = weight * price
                        total_a:
                          (newItem.item_weight ?? 0) *
                          (goldPrice ?? newItem.item_price),
                        // total_w = weight * wagePrice
                        total_w:
                          (newItem.item_weight ?? 0) *
                          (newItem.work_price ?? 0),
                        // total = total_a + total_w - discount
                        total:
                          (newItem.item_weight ?? 0) *
                            (goldPrice ?? newItem.item_price) +
                          (newItem.item_weight ?? 0) *
                            (newItem.work_price ?? 0) -
                          (newItem.item_disc_amt ?? 0),
                        tax:
                          ((newItem.item_weight ?? 0) *
                            (goldPrice ?? newItem.item_price) +
                            (newItem.item_weight ?? 0) *
                              (newItem.work_price ?? 0) -
                            (newItem.item_disc_amt ?? 0)) *
                          ((newItem.tax_prc ?? 15) / 100),
                        total_t:
                          (newItem.item_weight ?? 0) *
                            (goldPrice ?? newItem.item_price) +
                          (newItem.item_weight ?? 0) *
                            (newItem.work_price ?? 0) -
                          (newItem.item_disc_amt ?? 0) +
                          ((newItem.item_weight ?? 0) *
                            (goldPrice ?? newItem.item_price) +
                            (newItem.item_weight ?? 0) *
                              (newItem.work_price ?? 0) -
                            (newItem.item_disc_amt ?? 0)) *
                            ((newItem.tax_prc ?? 15) / 100),
                      };
                      setInvoiceItems(updated);
                    }}
                  />
                </td>
                <td>
                  <input
                    ref={(el) => setRef(index, ++col, el)}
                    className="border w-full p-1 text-xs text-center"
                    style={{ minWidth: 0, maxWidth: "100%" }}
                    type="number"
                    value={item.qty}
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
                    style={{ minWidth: 0, maxWidth: "100%" }}
                    type="number"
                    value={item.weight}
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
                    style={{ minWidth: 0, maxWidth: "100%" }}
                    type="number"
                    value={item.g_weight}
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
                    style={{ minWidth: 0, maxWidth: "100%" }}
                    value={item.k}
                    onChange={(e) =>
                      handleFieldChange(index, "k", e.target.value)
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
                    style={{ minWidth: 0, maxWidth: "100%" }}
                    value={item.purity}
                    onChange={(e) =>
                      handleFieldChange(index, "purity", e.target.value)
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
                    style={{ minWidth: 0, maxWidth: "100%" }}
                    value={item.stones}
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
                      style={{ minWidth: 0, maxWidth: "100%" }}
                      type="number"
                      value={item.price}
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
                      style={{ minWidth: 0, maxWidth: "100%" }}
                      type="number"
                      value={item.price_w}
                      onChange={(e) =>
                        handleFieldChange(index, "price_w", e.target.value)
                      }
                      onKeyDown={(e) => handleEnter(e, index, col)}
                    />
                  </td>
                )}
                {(payType === 1 || payType === 3) && (
                  <td>{(item.total_a ?? 0).toFixed(2)}</td>
                )}
                {(payType === 2 || payType === 3) && (
                  <td>{(item.total_w ?? 0).toFixed(2)}</td>
                )}
                <td>
                  <input
                    ref={(el) => {
                      inputRefs.current[index][++col] = el;
                    }}
                    className="border w-full p-1 text-xs text-center"
                    style={{ minWidth: 0, maxWidth: "100%" }}
                    type="number"
                    value={item.total_t ?? total + tax}
                    onChange={(e) =>
                      handleTotalChange(index, e.target.value)
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
                    style={{ minWidth: 0, maxWidth: "100%" }}
                    type="number"
                    value={item.item_disc_amt}
                    onChange={(e) =>
                      handleFieldChange(index, "item_disc_amt", e.target.value)
                    }
                    onKeyDown={(e) => handleEnter(e, index, col)}
                  />
                </td>
                <td>{(item.tax ?? tax).toFixed(2)}</td>
                <td>
                  <input
                    ref={(el) => {
                      inputRefs.current[index][++col] = el;
                    }}
                    className="border w-full p-1 text-xs text-center"
                    style={{ minWidth: 0, maxWidth: "100%" }}
                    value={item.item_desc}
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
