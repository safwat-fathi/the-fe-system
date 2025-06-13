"use client";

import type { InvoiceItem } from "@/types/invoice-item";

import CreatableSelect from "react-select/creatable";

interface Item {
  id: number;
  item_code: string;
  item_name: string;
  item_price: number;
  karat: string;
  item_weight?: number;
  item_g_weight?: number;
  stones?: string;
  purity?: string;
  work_price?: number;
}

interface Props {
  items: Item[];
  setItems: (items: Item[]) => void;
  invoiceItems: InvoiceItem[];
  setInvoiceItems: (items: InvoiceItem[]) => void;
  goldPrice: number | null;
  payType: number;
}

export default function InvoiceItemTable({
  items,
  setItems,
  invoiceItems,
  setInvoiceItems,
  goldPrice,
  payType,
}: Props) {
  const handleFieldChange = (
    index: number,
    field: keyof InvoiceItem,
    value: any,
  ) => {
    const updated = [...invoiceItems];

    if (
      [
        "weight",
        "price_per_gram",
        "price_w",
        "quantity",
        "qty",
        "discount",
      ].includes(field)
    ) {
      updated[index][field] = parseFloat(value) || 0;
    } else {
      // @ts-ignore
      updated[index][field] = value;
    }

    updated[index].total_a =
      updated[index].weight * updated[index].price_per_gram;
    updated[index].total_w =
      updated[index].quantity * updated[index].price_w;
    updated[index].total = updated[index].total_a + updated[index].total_w;

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
          quantity: 0,
          weight: 0,
          karat: "",
          price_per_gram: goldPrice ?? 0,
          price_w: goldPrice ?? 0,
          discount: 0,
          note: "",
          trans_type: 2,
          G875: "",
          price: 0,
          g_weight: 0,
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

  return (
    <div className="w-full overflow-x-auto mb-6 max-w-full">
      <table className="min-w-[1000px] border text-sm text-center table-fixed">
        <thead className="bg-gray-100 text-xs font-semibold">
          <tr>
            <th className="w-[400px]">اسم الصنف</th>
            <th className="w-[60px]">العدد</th>
            {(payType === 1 || payType === 3) && (
              <th className="w-[100px]">الوزن القائم</th>
            )}
            {(payType === 2 || payType === 3) && (
              <th className="w-[100px]">وزن معايير</th>
            )}
            <th className="w-[80px]">العيار</th>
            <th className="w-[80px]">المعايرة</th>
            <th className="w-[80px]">الاحجار</th>
            {(payType === 1 || payType === 3) && (
              <th className="w-[100px]">سعر الجرام</th>
            )}
            {(payType === 2 || payType === 3) && (
              <th className="w-[100px]">أجرة الجرام</th>
            )}
            <th className="w-[100px]">اجمالي القيمة</th>
            <th className="w-[100px]">اجمالي الاجور</th>
            <th className="w-[100px]">الاجمالي</th>
            <th className="w-[80px]">الخصم</th>
            <th className="w-[200px]">البيان</th>
            <th className="w-[40px]" />
          </tr>
        </thead>
        <tbody>
          {invoiceItems.map((item, index) => {
            const totalA = item.weight * item.price_per_gram;
            const totalW = item.quantity * item.price_w;
            const total = totalA + totalW - item.discount;

            return (
              <tr key={item.id}>
                <td>
                  <CreatableSelect
                    isClearable
                    isCreatable
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
                      const updated = [...invoiceItems];

                      updated[index].item_id = selected?.id ?? null;
                      updated[index].item_code = selected?.item_code ?? "";
                      updated[index].item_name = selected?.item_name ?? "";
                      updated[index].karat = selected?.karat ?? "";
                      updated[index].price_per_gram =
                        goldPrice ?? selected?.item_price ?? 0;
                      updated[index].price_w =
                        selected?.work_price ?? goldPrice ?? selected?.item_price ?? 0;
                      updated[index].G875 = selected?.purity ?? "";
                      updated[index].stones = selected?.stones ?? "";
                      updated[index].weight = selected?.item_weight
                        ? Number(selected.item_weight)
                        : updated[index].weight;
                      updated[index].quantity = selected?.item_g_weight
                        ? Number(selected.item_g_weight)
                        : updated[index].quantity;
                      updated[index].total_a =
                        updated[index].weight * updated[index].price_per_gram;
                      updated[index].total_w =
                        updated[index].quantity * updated[index].price_w;
                      updated[index].total =
                        updated[index].total_a + updated[index].total_w;

                      setInvoiceItems(updated);
                    }}
                    onCreateOption={(inputValue) => {
                      const newItem = {
                        id: Math.floor(Math.random() * 1000000),
                        item_code: "000000",
                        item_name: inputValue,
                        karat: "",
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
                        karat: newItem.karat,
                        price_per_gram: goldPrice ?? newItem.item_price,
                        price_w: newItem.work_price ?? goldPrice ?? newItem.item_price,
                        weight: newItem.item_weight ?? 0,
                        quantity: newItem.item_g_weight ?? 0,
                        stones: newItem.stones ?? "",
                        G875: newItem.purity ?? "",
                        total_a: (newItem.item_weight ?? 0) * (goldPrice ?? newItem.item_price),
                        total_w: (newItem.item_g_weight ?? 0) * (newItem.work_price ?? goldPrice ?? newItem.item_price),
                        total: ((newItem.item_weight ?? 0) * (goldPrice ?? newItem.item_price)) + ((newItem.item_g_weight ?? 0) * (newItem.work_price ?? goldPrice ?? newItem.item_price)),
                      };
                      setInvoiceItems(updated);
                    }}
                  />
                </td>
                <td>
                  <input
                    className="border w-full p-1 text-xs text-center"
                    style={{ minWidth: 0, maxWidth: "100%" }}
                    type="number"
                    value={item.qty}
                    onChange={(e) =>
                      handleFieldChange(index, "qty", e.target.value)
                    }
                  />
                </td>
                {(payType === 1 || payType === 3) && (
                  <td>
                    <input
                      className="border w-full p-1 text-xs text-center"
                      style={{ minWidth: 0, maxWidth: "100%" }}
                      type="number"
                      value={item.weight}
                      onChange={(e) =>
                        handleFieldChange(index, "weight", e.target.value)
                      }
                    />
                  </td>
                )}
                {(payType === 2 || payType === 3) && (
                  <td>
                    <input
                      className="border w-full p-1 text-xs text-center"
                      style={{ minWidth: 0, maxWidth: "100%" }}
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        handleFieldChange(index, "quantity", e.target.value)
                      }
                    />
                  </td>
                )}
                <td>
                  <input
                    className="border w-full p-1 text-xs text-center"
                    style={{ minWidth: 0, maxWidth: "100%" }}
                    value={item.karat}
                    onChange={(e) =>
                      handleFieldChange(index, "karat", e.target.value)
                    }
                  />
                </td>
                <td>
                  <input
                    className="border w-full p-1 text-xs text-center"
                    style={{ minWidth: 0, maxWidth: "100%" }}
                    value={item.G875}
                    onChange={(e) =>
                      handleFieldChange(index, "G875", e.target.value)
                    }
                  />
                </td>
                <td>
                  <input
                    className="border w-full p-1 text-xs text-center"
                    style={{ minWidth: 0, maxWidth: "100%" }}
                    value={item.stones}
                    onChange={(e) =>
                      handleFieldChange(index, "stones", e.target.value)
                    }
                  />
                </td>
                {(payType === 1 || payType === 3) && (
                  <td>
                    <input
                      className="border w-full p-1 text-xs text-center"
                      style={{ minWidth: 0, maxWidth: "100%" }}
                      type="number"
                      value={item.price_per_gram}
                      onChange={(e) =>
                        handleFieldChange(
                          index,
                          "price_per_gram",
                          e.target.value,
                        )
                      }
                    />
                  </td>
                )}
                {(payType === 2 || payType === 3) && (
                  <td>
                    <input
                      className="border w-full p-1 text-xs text-center"
                      style={{ minWidth: 0, maxWidth: "100%" }}
                      type="number"
                      value={item.price_w}
                      onChange={(e) =>
                        handleFieldChange(index, "price_w", e.target.value)
                      }
                    />
                  </td>
                )}
                <td>{item.total_a.toFixed(2)}</td>
                <td>{item.total_w.toFixed(2)}</td>
                <td>{total.toFixed(2)}</td>
                <td>
                  <input
                    className="border w-full p-1 text-xs text-center"
                    style={{ minWidth: 0, maxWidth: "100%" }}
                    type="number"
                    value={item.discount}
                    onChange={(e) =>
                      handleFieldChange(index, "discount", e.target.value)
                    }
                  />
                </td>
                <td>
                  <input
                    className="border w-full p-1 text-xs text-center"
                    style={{ minWidth: 0, maxWidth: "100%" }}
                    value={item.item_desc}
                    onChange={(e) =>
                      handleFieldChange(index, "item_desc", e.target.value)
                    }
                  />
                </td>
                <td>
                  <button
                    className="text-red-600 font-bold"
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
