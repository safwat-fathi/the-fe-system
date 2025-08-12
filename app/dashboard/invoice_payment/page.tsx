"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@heroui/react";
import { motion } from "framer-motion";
import { API_ENDPOINTS } from "@/utilities/api";
import useFractions from "@/utilities/useFractions";

const { CREATE_INVOICE_BOX } = API_ENDPOINTS;

const KEYPAD_BUTTONS = [
  ["1", "2", "3", "+10"],
  ["4", "5", "6", "+20"],
  ["7", "8", "9", "+50"],
  ["+/-", "0", ".", "⌫"]
];

export default function InvoicePaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fractions = useFractions();
  const frac = (fractions as any).frac || 2;

  const [invoiceTotal, setInvoiceTotal] = useState<number>(0);
  const [paidAmountStr, setPaidAmountStr] = useState<string>("0");
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [boxInputs, setBoxInputs] = useState([{ boxId: null, amount: "", notes: "" }]);
  const [boxes, setBoxes] = useState<any[]>([]);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);

  const handleSave = async () => {
  
  
    if (boxInputs.length === 0 || boxInputs[0].amount === "") {
      alert("يرجى إدخال بيانات الدفع");
      return;
    }
    if (boxInputs.some(row => !row.boxId || !row.amount || parseFloat(row.amount) <= 0)) {
      alert("يرجى التأكد من ملء جميع الحقول بشكل صحيح");
      return;
    }
    const inv = parseInt(searchParams.get("inv") || "0");
    const com = 1; // يمكن جلبه من localStorage أو ثابت حسب النظام
    const trans_type = 1; // أو حسب نوع الحركة
    const cr_date = new Date().toISOString();
    const cr_user = null; // أو اسم المستخدم الحالي إذا توفر
    const upd_date = null; // أو تاريخ التعديل إذا توفر
    const upd_user = null; // أو اسم المستخدم المعدل إذا توفر

    try {
      let sentCount = 0;
      for (let i = 0; i < boxInputs.length; i++) {
        const row = boxInputs[i];
        if (!row.boxId) continue;
        const amtNum = Number(row.amount);
        if (isNaN(amtNum) || amtNum === 0) continue;
        const body = {
          id: sentCount + 1,
          trans_type,
          amt: amtNum.toFixed(frac),
          acc_change: amtNum.toFixed(frac),
          notes: row.notes || "",
          cr_date,
          cr_user,
          upd_date,
          upd_user,
          com,
          inv: (!isNaN(inv) && inv > 0) ? inv : undefined,
          box: row.boxId,
        };
        const res = await fetch(CREATE_INVOICE_BOX, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error();
        sentCount++;
      }
      // إعادة التوجيه لنفس الفاتورة بعد الحفظ
      if (!isNaN(inv) && inv > 0) {
        router.push(`/dashboard/forms/invoice?inv_id=${inv}`);
      } else {
        router.back();
      }
    } catch {
      alert("فشل الحفظ");
    }
  };

  useEffect(() => {
    const total = parseFloat(searchParams.get("total") || "0");
    if (!Number.isNaN(total)) setInvoiceTotal(total);
  }, [searchParams]);

  useEffect(() => {
    fetch("http://149.102.143.102:8000/api/boxes_list")
      .then((res) => res.json())
      .then(setBoxes);
  }, []);

  useEffect(() => {
    const otherRowsTotal = boxInputs
      .slice(1)
      .reduce((acc, row) => acc + parseFloat(row.amount || "0"), 0);

    setPaidAmount(otherRowsTotal);
    setPaidAmountStr(otherRowsTotal.toString());

    const firstAmount = (invoiceTotal - otherRowsTotal).toString();
    if (boxInputs[0]?.amount !== firstAmount) {
      setBoxInputs((prev) => {
        const updated = [...prev];
        if (updated.length === 0) return [{ boxId: null, amount: firstAmount, notes: "" }];
        updated[0] = { ...updated[0], amount: firstAmount };
        return updated;
      });
    }
  }, [boxInputs, invoiceTotal]);

  const updateBoxInput = (index: number, field: keyof typeof boxInputs[0], value: any) => {
    const updated = [...boxInputs];
    (updated[index] as any)[field] = value;
    setBoxInputs(updated);
  };

  const addBoxRow = () => {
    setBoxInputs([...boxInputs, { boxId: null, amount: "", notes: "" }]);
  };

  const removeBoxRow = (index: number) => {
    if (index === 0) return;
    const updated = [...boxInputs];
    updated.splice(index, 1);
    setBoxInputs(updated);
    if (selectedRow === index) setSelectedRow(null);
  };

  const clearAll = () => {
    setBoxInputs([{ boxId: null, amount: invoiceTotal.toString(), notes: "" }]);
    setSelectedRow(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 font-cairo flex items-start justify-center">
      <div className="w-full max-w-7xl bg-white rounded-3xl shadow-2xl p-8 grid grid-cols-12 gap-6">

        {/* اليسار: ملخص الدفع */}
        <div className="col-span-3 flex flex-col gap-6 justify-start">
          <div className="bg-gray-50 rounded-xl p-6 text-center">
            <p className="text-base text-gray-500">قيمة الفاتورة</p>
            <p className="text-3xl font-bold text-green-600">SR {invoiceTotal.toFixed(frac)}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-6 text-center">
            <p className="text-base text-gray-500">المبلغ المدفوع</p>
            <p className="text-3xl font-bold text-blue-600">SR {paidAmount.toFixed(frac)}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-6 text-center">
            <p className="text-base text-gray-500">المتبقي</p>
            <p className="text-3xl font-bold text-red-500">SR {(invoiceTotal - paidAmount).toFixed(frac)}</p>
          </div>
          <Button color="primary" className="py-4 text-xl font-semibold rounded-xl" onClick={handleSave}>حفظ</Button>
          <Button color="default" className="py-4 text-xl font-semibold rounded-xl" onClick={() => router.back()}>العودة</Button>
          <Button variant="bordered" className="py-3 text-md rounded-xl" onClick={clearAll}>تصفير الكل</Button>
        </div>

        {/* اليمين: جدول + كيباد */}
        <div className="col-span-9 flex flex-col gap-4">
          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-3 text-lg font-semibold text-gray-600">
              <div className="col-span-4">الصندوق</div>
              <div className="col-span-4">المبلغ</div>
              <div className="col-span-3">البيان</div>
              <div className="col-span-1"></div>
            </div>
            {boxInputs.map((row, index) => (
              <div
                key={index}
                onClick={() => setSelectedRow(index)}
                className={`grid grid-cols-12 gap-3 items-center transition-all duration-300 ${parseFloat(row.amount || "0") > invoiceTotal ? "bg-red-100" : ""} ${selectedRow === index ? "ring-2 ring-blue-400" : ""}`}
              >
                <select
                  className="col-span-4 border rounded-lg px-4 py-3 text-lg"
                  value={row.boxId || ""}
                  onChange={(e) => updateBoxInput(index, "boxId", parseInt(e.target.value))}
                >
                  <option value="">اختر الصندوق</option>
                  {boxes.map((box) => (
                    <option key={box.id} value={box.id}>{box.box_name}</option>
                  ))}
                </select>
                <input
                  type="number"
                  className="col-span-4 border rounded-lg px-4 py-3 text-lg"
                  placeholder="0"
                  value={
                    row.amount !== ""
                      ? Number(row.amount).toFixed(frac)
                      : ""
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    updateBoxInput(index, "amount", val);
                  }}
                  readOnly={index === 0}
                />
                <input
                  type="text"
                  className="col-span-3 border rounded-lg px-4 py-3 text-lg"
                  placeholder="البيان"
                  value={row.notes || ""}
                  onChange={(e) => updateBoxInput(index, "notes", e.target.value)}
                />
                <Button className="col-span-1" size="lg" color="danger" onClick={() => removeBoxRow(index)} disabled={index === 0}>حذف</Button>
              </div>
            ))}
            <Button variant="light" onClick={addBoxRow} className="mt-3 w-full text-lg">+ إضافة صف</Button>
          </div>

          {/* كيباد الأرقام */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            {KEYPAD_BUTTONS.flat().map((btn, index) => (
              <motion.button
                key={index}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  if (boxInputs.length === 0 || selectedRow === null) return;
                  const currentAmount = boxInputs[selectedRow].amount || "";
                  if (btn === "⌫") {
                    updateBoxInput(selectedRow, "amount", currentAmount.slice(0, -1));
                  } else if (btn === ".") {
                    if (!currentAmount.includes(".")) {
                      updateBoxInput(selectedRow, "amount", currentAmount + ".");
                    }
                  } else if (/^\d+$/.test(btn)) {
                    updateBoxInput(selectedRow, "amount", currentAmount + btn);
                  }
                }}
                className={`text-xl font-bold py-5 rounded-xl shadow-sm bg-white border hover:bg-blue-50 transition-colors duration-200 ${btn === "⌫" ? "text-red-500" : ""}`}
              >
                {btn}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
