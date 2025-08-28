"use client";

import type { InvoiceItem } from "@/types/invoice-item";
import { formatAmount } from "@/utilities/formatAmount";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import CreatableSelect from "react-select/creatable";
import { withAsyncPaginate } from "react-select-async-paginate";

import useFractions from "@/utilities/useFractions";
import { API_BASE_URL, API_ENDPOINTS, fetchData } from "@/utilities/api";

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
  item_disc_amt?: number;
  tax_prc?: number;
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
  isEditing: boolean;
  onItemRemoved?: (removedItem: InvoiceItem) => void; // إضافة callback للحذف
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

  // تحميل قائمة الضرائب من API
  useEffect(() => {
    const loadTaxRates = async () => {
      try {
        const response = await fetchData<any[]>(API_ENDPOINTS.TaxPrcList);
        if (Array.isArray(response) && response.length > 0) {
          const rates = response.map(item => parseFloat(item.tax_prc || item.value || 0));
          setTaxRates([0, ...rates.filter(rate => rate > 0)]);
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
      const num = parseFloat(value);
      (updated[index] as any)[field] = isNaN(num) ? 0 : num;
    } else {
      (updated[index] as any)[field] = value;
    }

    if (field === "weight" || field === "purity") {
      const weightVal = parseFloat(String(updated[index].weight)) || 0;
      const purityVal = parseFloat(String(updated[index].purity)) || 0;

      if (homePurity) {
        const g = (weightVal * purityVal) / homePurity;

        updated[index].g_weight = parseFloat(g.toFixed(gWeightDigits));
      }
    }

    // معادلة عكسية: حساب العيار من الوزن المعاير
    if (field === "g_weight") {
      const gWeightVal = parseFloat(String(updated[index].g_weight)) || 0;
      const weightVal = parseFloat(String(updated[index].weight)) || 0;

      if (homePurity && weightVal > 0) {
        const purity = (gWeightVal * homePurity) / weightVal;
        updated[index].purity = String(parseFloat(purity.toFixed(2)));
        
        // إعادة حساب الإجماليات بعد تغيير الوزن المعاير
        const wCalc = weightVal < 1 && gWeightVal > weightVal ? weightVal * 1000 : weightVal;
        
        // total_a depends on invoice type
        updated[index].total_a =
          payType === 2
            ? 0
            : payType === 1
            ? wCalc * updated[index].price
            : wCalc * updated[index].price;

        // total_w depends on invoice type
        updated[index].total_w =
          payType === 1
            ? 0
            : payType === 2
            ? gWeightVal * updated[index].price_w
            : gWeightVal * updated[index].price_w;

        // total is the sum of total_a and total_w
        updated[index].total = updated[index].total_a + updated[index].total_w;

        // calculate tax
        const base = updated[index].total - (updated[index].item_disc_amt || 0);
        updated[index].tax = base * ((updated[index].tax_prc || 15) / 100);
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
        ? 0
        : payType === 1
        ? updated[index].weight * updated[index].price
        : updated[index].weight * updated[index].price;

    // total_w depends on invoice type
    updated[index].total_w =
      payType === 1
        ? 0
        : payType === 2
        ? updated[index].g_weight * updated[index].price_w
        : updated[index].g_weight * updated[index].price_w;

    // total is the sum of total_a and total_w
    updated[index].total = updated[index].total_a + updated[index].total_w;

    // calculate tax
    const base = updated[index].total - (updated[index].item_disc_amt || 0);
    updated[index].tax = base * ((updated[index].tax_prc || 15) / 100);

    setInvoiceItems(updated);
  };

  /**
   * دالة حذف الصفوف في تفاصيل الفاتورة
   * - إذا كان هناك سجل واحد فقط: تفريغ محتوياته بدلاً من حذفه
   * - إذا كان هناك أكثر من سجل: حذف السجل المحدد
   */
  const removeRow = (id: number) => {
    // إذا كان هناك سجل واحد فقط، لا نحذفه بل نفرغ محتوياته
    if (invoiceItems.length === 1) {
      const updated = [...invoiceItems];
      const index = updated.findIndex(item => item.id === id);
      
      if (index !== -1) {
        // تفريغ محتويات السجل إلى القيم الافتراضية
        // هذا يضمن وجود سجل واحد على الأقل في الفاتورة
        updated[index] = {
          ...updated[index],
          item_id: null,
          item_code: "",
          item_name: "",
          item_desc: "",
          qty: 1,
          weight: 0,
          g_weight: 0,
          k: "",
          price: 0,
          price_w: 0,
          item_disc_amt: 0,
          item_disc_prc: 0,
          note: "",
          purity: "",
          total: 0,
          total_w: 0,
          total_a: 0,
          tax: 0,
          tax_prc: 15,
          stones: "",
          sn: "",
        };
        
        setInvoiceItems(updated);
        return;
      }
    }
    
    // إذا كان هناك أكثر من سجل، احذف السجل المحدد
    const itemToRemove = invoiceItems.find(item => item.id === id);
    if (itemToRemove && onItemRemoved) {
      onItemRemoved(itemToRemove);
    }
    
    const updated = invoiceItems.filter(item => item.id !== id);
    setInvoiceItems(updated);
  };

  const addRow = () => {
    const newItem: InvoiceItem = {
      id: Date.now(),
      item_id: null,
      item_code: "",
      item_name: "",
      qty: 1,
      weight: 0,
      g_weight: 0,
      k: "",
      price: 0,
      price_w: 0,
      item_disc_amt: 0,
      note: "",
      trans_type: 1,
      purity: "",
      total: 0,
      total_w: 0,
      total_a: 0,
      tax: 0,
      tax_prc: 15,
      stones: "",
      item_disc_prc: 0,
      sn: "",
      item_desc: "",
      cr_date: new Date().toISOString(),
      cr_user: "",
      upd_date: new Date().toISOString(),
      upd_user: "",
      com: 0,
      inv: 0,
      item: 0,
    };

    setInvoiceItems([...invoiceItems, newItem]);
  };

  const handleEnter = (
    e: KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    colIndex: number,
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const nextRow = rowIndex + 1;
      const nextCol = 0;

      if (nextRow < invoiceItems.length) {
        const nextInput = inputRefs.current[nextRow]?.[nextCol];
        if (nextInput) {
          nextInput.focus();
        }
      } else {
        addRow();
        setTimeout(() => {
          const newRowInput = inputRefs.current[nextRow]?.[nextCol];
          if (newRowInput) {
            newRowInput.focus();
          }
        }, 100);
      }
    }
  };

  const handleTotalChange = (index: number, value: any) => {
    const num = parseFloat(value) || 0;
    const updated = [...invoiceItems];
    
    if (updated[index]) {
      // حساب الإجمالي بدون ضريبة
      const taxRate = (updated[index].tax_prc ?? 15) / 100;
      const totalWithoutTax = num / (1 + taxRate);
      
      updated[index].total = num;
      
      // تحديث الأسعار بناءً على الإجمالي الجديد
      if (payType === 1) {
        // Gold only - تحديث سعر الجرام
        if (updated[index].weight > 0) {
          updated[index].price = totalWithoutTax / updated[index].weight;
          updated[index].total_a = totalWithoutTax;
          updated[index].total_w = 0;
        }
      } else if (payType === 2) {
        // Wage only - تحديث سعر الأجرة
        if (updated[index].weight > 0) {
          updated[index].price_w = totalWithoutTax / updated[index].weight;
          updated[index].total_a = 0;
          updated[index].total_w = totalWithoutTax;
        }
      } else {
        // Both - توزيع نسبي
        const totalA = updated[index].total_a || 0;
        const totalW = updated[index].total_w || 0;
        const total = totalA + totalW;
        
        if (total > 0) {
          const newTotalA = (totalA / total) * totalWithoutTax;
          const newTotalW = (totalW / total) * totalWithoutTax;
          
          if (updated[index].weight > 0) {
            updated[index].price = newTotalA / updated[index].weight;
            updated[index].price_w = newTotalW / updated[index].weight;
          }
          
          updated[index].total_a = newTotalA;
          updated[index].total_w = newTotalW;
        }
      }
      
      // إعادة حساب الضريبة
      const base = (updated[index].total_a || 0) + (updated[index].total_w || 0) - (updated[index].item_disc_amt ?? 0);
      updated[index].tax = base * taxRate;
      
      setInvoiceItems(updated);
    }
  };

  const handleTotalAChange = (index: number, value: any) => {
    const num = parseFloat(value) || 0;
    const updated = [...invoiceItems];
    
    if (updated[index]) {
      updated[index].total_a = num;
      
      // إعادة حساب سعر الجرام بناءً على الإجمالي الجديد
      if (updated[index].weight && updated[index].weight > 0) {
        updated[index].price = num / updated[index].weight;
      }
      
      // إعادة حساب الإجمالي الكلي
      updated[index].total = (updated[index].total_a || 0) + (updated[index].total_w || 0);
      
      // إعادة حساب الضريبة
      const base = (updated[index].total_a || 0) + (updated[index].total_w || 0) - (updated[index].item_disc_amt ?? 0);
      updated[index].tax = base * ((updated[index].tax_prc ?? 15) / 100);
      
      setInvoiceItems(updated);
    }
  };

  const handleTotalWChange = (index: number, value: any) => {
    const num = parseFloat(value) || 0;
    const updated = [...invoiceItems];
    
    if (updated[index]) {
      updated[index].total_w = num;
      
      // إعادة حساب سعر الأجور بناءً على الإجمالي الجديد
      if (updated[index].weight && updated[index].weight > 0) {
        updated[index].price_w = num / updated[index].weight;
      }
      
      // إعادة حساب الإجمالي الكلي
      updated[index].total = (updated[index].total_a || 0) + (updated[index].total_w || 0);
      
      // إعادة حساب الضريبة
      const base = (updated[index].total_a || 0) + (updated[index].total_w || 0) - (updated[index].item_disc_amt ?? 0);
      updated[index].tax = base * ((updated[index].tax_prc ?? 15) / 100);
      
      setInvoiceItems(updated);
    }
  };

  const setRef = (row: number, col: number, el: HTMLInputElement | null) => {
    if (!inputRefs.current[row]) {
      inputRefs.current[row] = [];
    }
    inputRefs.current[row][col] = el;
  };

  // البحث بالباركود - البحث عن الصنف بالكود المطابق تماماً


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
            <th className="w-[80px]">نسبة الضريبة</th>
            <th className="w-[100px]">الضريبة</th>
                         <th className="w-[120px]">الاجمالي شامل الضريبة</th>
             <th className="w-[200px]">البيان</th>
             <th className="w-[60px]">حذف</th>
          </tr>
        </thead>
        <tbody>
          {invoiceItems.map((item, index) => {
            let colIndex = 0;
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
                       updated[index].item_desc = selected.item_name ?? ""; // تخزين اسم الصنف في item_desc
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
                      // منطق المعايرة: الصنف -> الفئة -> إعدادات النظام
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
                      
                      // إذا كانت المعايرة لا تزال فارغة، استخدم القيمة من إعدادات النظام
                      if (!updated[index].purity || updated[index].purity === "0" || updated[index].purity === "") {
                        updated[index].purity = homePurity.toString();
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
                        item_desc: newItem.item_name, // إضافة اسم الصنف إلى item_desc
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
                    onKeyDown={(e) => handleEnter(e, index, col)}
                  />
                </td>
                <td>
                  <input
                    ref={(el) => setRef(index, ++col, el)}
                    className="border w-full p-1 text-xs text-center appearance-none"
                    style={{ minWidth: 0, maxWidth: "100%" }}
                    type="number"
                    value={parseFloat(item.qty?.toFixed(0) || "0")}
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
                    className="border w-full p-1 text-xs text-center appearance-none"
                    step="any"
                    style={{ minWidth: 0, maxWidth: "100%" }}
                    type="number"
                    value={parseFloat(item.weight?.toFixed(weightDigits) || "0")}
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
                    className="border w-full p-1 text-xs text-center appearance-none"
                    style={{ minWidth: 0, maxWidth: "100%" }}
                    value={item.purity}
                    disabled={!isEditing}
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
                    className="border w-full p-1 text-xs text-center appearance-none"
                    step="any"
                    style={{ minWidth: 0, maxWidth: "100%" }}
                    type="number"
                    value={parseFloat(item.g_weight?.toFixed(gWeightDigits) || "0")}
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
                    className="border w-full p-1 text-xs text-center appearance-none"
                    style={{ minWidth: 0, maxWidth: "100%" }}
                    value={item.stones}
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
                      className="border w-full p-1 text-xs text-center appearance-none"
                      step="any"
                      style={{ minWidth: 0, maxWidth: "100%" }}
                      type="number"
                      value={parseFloat(item.price?.toFixed(priceDigits) || "0")}
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
                      className="border w-full p-1 text-xs text-center appearance-none"
                      step="any"
                      style={{ minWidth: 0, maxWidth: "100%" }}
                      type="number"
                      value={parseFloat(item.price_w?.toFixed(priceWDigits) || "0")}
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
                      className="border w-full p-1 text-xs text-center appearance-none"
                      step="any"
                      style={{ minWidth: 0, maxWidth: "100%" }}
                      type="number"
                      value={parseFloat((item.weight * item.price).toFixed(totalADigits))}
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
                      className="border w-full p-1 text-xs text-center appearance-none"
                      step="any"
                      style={{ minWidth: 0, maxWidth: "100%" }}
                      type="number"
                      value={parseFloat((item.weight * (item.price_w || 0)).toFixed(totalWDigits))}
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
                    className="border w-full p-1 text-xs text-center appearance-none"
                    step="any"
                    style={{ minWidth: 0, maxWidth: "100%" }}
                    type="number"
                    value={parseFloat(item.item_disc_amt?.toFixed(itemDiscDigits) || "0")}
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
                    className="border w-full p-1 text-xs text-center appearance-none"
                    value={parseFloat(item.tax_prc?.toFixed(2) || "15")}
                    disabled={!isEditing}
                    onChange={(e) =>
                      handleFieldChange(index, "tax_prc", e.target.value)
                    }
                    onKeyDown={(e) => handleEnter(e, index, col)}
                  >
                    {taxRates.map(rate => (
                      <option key={rate} value={rate}>{rate}%</option>
                    ))}
                  </select>
                </td>
                <td>{formatAmount(item.tax ?? tax, taxDigits)}</td>
                <td>
                  <input
                    ref={(el) => {
                      inputRefs.current[index][++col] = el;
                    }}
                    className="border w-full p-1 text-xs text-center appearance-none"
                    style={{ minWidth: 0, maxWidth: "100%" }}
                    value={
                      tempTotals[item.id] !== undefined
                        ? tempTotals[item.id]
                        : formatAmount(total + tax, totalDigits)
                    }
                    disabled={!isEditing}
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
                    onKeyDown={(e) => handleEnter(e, index, col)}
                  />
                </td>
                
                <td>
                  <input
                    ref={(el) => {
                      inputRefs.current[index][++col] = el;
                    }}
                    className="border w-full p-1 text-xs text-center appearance-none"
                    style={{ minWidth: 0, maxWidth: "100%" }}
                    value={item.note}
                    disabled={!isEditing}
                    onChange={(e) =>
                      handleFieldChange(index, "note", e.target.value)
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
