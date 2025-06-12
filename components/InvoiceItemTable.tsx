"use client";

import CreatableSelect from "react-select/creatable";
import type { InvoiceItem } from "@/types/invoice-item";

interface Item {
  id: number;
  item_code: string;
  item_name: string;
  item_price: number;
  karat: string;
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
  const handleFieldChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...invoiceItems];

    if (["weight", "price_per_gram", "price_w", "quantity", "discount"].includes(field)) {
      updated[index][field] = parseFloat(value) || 0;
    } else {
      // @ts-ignore
      updated[index][field] = value;
    }

    setInvoiceItems(updated);

    const isLastRow = index === invoiceItems.length - 1;
    const isRowFilled = updated[index].item_id || updated[index].item_name || updated[index].weight > 0;

    if (isLastRow && isRowFilled) {
      setInvoiceItems([
        ...updated,
        {
          id: Date.now(),
          item_id: null,
          item_code: "",
          quantity: 1,
          weight: 0,
          karat: "",
          price_per_gram: goldPrice ?? 0,
          price_w: goldPrice ?? 0,
          discount: 0,
          note: "",
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
            {(payType === 1 || payType === 3) && (
              <th className="w-[100px]">الوزن القائم</th>
            )}
            {(payType === 2 || payType === 3) && (
              <th className="w-[100px]">وزن معايير</th>
            )}
            <th className="w-[80px]">العيار</th>
            {(payType === 1 || payType === 3) && (
              <th className="w-[100px]">سعر الجرام</th>
            )}
            {(payType === 2 || payType === 3) && (
              <th className="w-[100px]">أجرة الجرام</th>
            )}
            <th className="w-[80px]">الخصم</th>
            <th className="w-[80px]">نسبة الضريبة</th>
            <th className="w-[100px]">الضريبة</th>
            <th className="w-[100px]">المبلغ</th>
            <th className="w-[130px]">الإجمالي شامل الضريبة</th>
            <th className="w-[200px]">البيان</th>
            <th className="w-[40px]"></th>
          </tr>
        </thead>
        <tbody>
          {invoiceItems.map((item, index) => {
            const baseQty = payType === 2 ? item.quantity : item.weight;
            const totalBeforeTax = baseQty * item.price_per_gram;
            const tax = (totalBeforeTax - item.discount) * 0.15;
            const total = totalBeforeTax - item.discount + tax;

            return (
              <tr key={item.id}>
                <td>
                  <CreatableSelect
                    instanceId={`item-select-${index}`}
                    className="text-xs"
                    classNamePrefix="select"
                    isSearchable
                    isClearable
                    isCreatable
                    options={items.map((it) => ({
                      value: it.id,
                      label: `${it.item_code} - ${it.item_name}`,
                    }))}
                    formatCreateLabel={(inputValue) => `إضافة صنف جديد: "${inputValue}"`}
                    onCreateOption={(inputValue) => {
                      const newItem = {
                        id: Math.floor(Math.random() * 1000000),
                        item_code: "000000",
                        item_name: inputValue,
                        karat: "",
                        item_price: 0,
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
                        price_w: goldPrice ?? newItem.item_price,
                      };
                      setInvoiceItems(updated);
                    }}
                    onChange={(selectedOption) => {
                      const selected = items.find((itm) => itm.id === selectedOption?.value);
                      const updated = [...invoiceItems];
                      updated[index].item_id = selected?.id ?? null;
                      updated[index].item_code = selected?.item_code ?? "";
                      updated[index].item_name = selected?.item_name ?? "";
                      updated[index].karat = selected?.karat ?? "";
                      updated[index].price_per_gram = goldPrice ?? selected?.item_price ?? 0;
                      updated[index].price_w = goldPrice ?? selected?.item_price ?? 0;
                      setInvoiceItems(updated);
                    }}
                    value={
                      item.item_id
                        ? {
                            value: item.item_id,
                            label: `${item.item_code ?? item.item_id} - ${item.item_name}`,
                          }
                        : null
                    }
                    placeholder="اختر الصنف..."
                    styles={{
                      control: (base) => ({ ...base, minHeight: 30, height: 30 }),
                      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    }}
                    menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                    menuPosition="fixed"
                    components={{ IndicatorSeparator: () => null }}
                  />
                </td>
                {(payType === 1 || payType === 3) && (
                  <td>
                    <input
                      type="number"
                      className="border w-full p-1 text-xs text-center"
                      style={{ minWidth: 0, maxWidth: "100%" }}
                      value={item.weight}
                      onChange={(e) => handleFieldChange(index, "weight", e.target.value)}
                    />
                  </td>
                )}
                {(payType === 2 || payType === 3) && (
                  <td>
                    <input
                      type="number"
                      className="border w-full p-1 text-xs text-center"
                      style={{ minWidth: 0, maxWidth: "100%" }}
                      value={item.quantity}
                      onChange={(e) => handleFieldChange(index, "quantity", e.target.value)}
                    />
                  </td>
                )}
                <td>
                  <input
                    className="border w-full p-1 text-xs text-center"
                    style={{ minWidth: 0, maxWidth: "100%" }}
                    value={item.karat}
                    onChange={(e) => handleFieldChange(index, "karat", e.target.value)}
                  />
                </td>
                {(payType === 1 || payType === 3) && (
                  <td>
                    <input
                      type="number"
                      className="border w-full p-1 text-xs text-center"
                      style={{ minWidth: 0, maxWidth: "100%" }}
                      value={item.price_per_gram}
                      onChange={(e) => handleFieldChange(index, "price_per_gram", e.target.value)}
                    />
                  </td>
                )}
                {(payType === 2 || payType === 3) && (
                  <td>
                    <input
                      type="number"
                      className="border w-full p-1 text-xs text-center"
                      style={{ minWidth: 0, maxWidth: "100%" }}
                      value={item.price_w}
                      onChange={(e) => handleFieldChange(index, "price_w", e.target.value)}
                    />
                  </td>
                )}
                <td>
                  <input
                    type="number"
                    className="border w-full p-1 text-xs text-center"
                    style={{ minWidth: 0, maxWidth: "100%" }}
                    value={item.discount}
                    onChange={(e) => handleFieldChange(index, "discount", e.target.value)}
                  />
                </td>
                <td>15%</td>
                <td>{tax.toFixed(2)}</td>
                <td>{(totalBeforeTax - item.discount).toFixed(2)}</td>
                <td>{total.toFixed(2)}</td>
                <td>
                  <input
                    className="border w-full p-1 text-xs text-center"
                    style={{ minWidth: 0, maxWidth: "100%" }}
                    value={item.note}
                    onChange={(e) => handleFieldChange(index, "note", e.target.value)}
                  />
                </td>
                <td>
                  <button className="text-red-600 font-bold" onClick={() => removeRow(item.id)}>
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

