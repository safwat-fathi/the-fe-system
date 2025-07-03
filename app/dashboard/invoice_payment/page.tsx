"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@heroui/react";
import { AnimatePresence, motion } from "framer-motion";
import { API_ENDPOINTS } from "@/utilities/api";

const { CREATE_INVOICE_BOX } = API_ENDPOINTS;

const KEYPAD_BUTTONS = [
  ["10+", "3", "2", "1"],
  ["20+", "6", "5", "4"],
  ["50+", "9", "8", "7"],
  ["⌫", "0", "+/-"]
];

export default function InvoicePaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [invoiceTotal, setInvoiceTotal] = useState<number>(0);
  const [paidAmountStr, setPaidAmountStr] = useState<string>("0");
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [boxInputs, setBoxInputs] = useState([{ boxId: null, amount: "" }]);
  const [boxes, setBoxes] = useState<any[]>([]);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);

  // ✅ الدالة هنا في الأعلى
  const handleSave = async () => {
    if (paidAmount > invoiceTotal) {
      alert("المبلغ المدفوع أكبر من قيمة الفاتورة.");
      return;
    }

    const body = {
      boxes: boxInputs.filter((b) => b.boxId && b.amount),
      paid: paidAmount,
      remain: invoiceTotal - paidAmount,
    };

    try {
      const res = await fetch(CREATE_INVOICE_BOX, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error();
      router.push("/dashboard/forms/invoice");
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
    const total = boxInputs.reduce((acc, row) => acc + parseFloat(row.amount || "0"), 0);
    setPaidAmountStr(total.toString());
    setPaidAmount(total);
  }, [boxInputs]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") handleSave();
      if (e.key === "Escape") router.back();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleSave]);

  const updateBoxInput = (index: number, field: string, value: any) => {
    const updated = [...boxInputs];
    updated[index][field] = value;
    setBoxInputs(updated);
  };

  const addBoxRow = () => {
    setBoxInputs([...boxInputs, { boxId: null, amount: "" }]);
  };

  const removeBoxRow = (index: number) => {
    const updated = [...boxInputs];
    updated.splice(index, 1);
    setBoxInputs(updated);
    if (selectedRow === index) setSelectedRow(null);
  };

  const clearAll = () => {
    setBoxInputs([{ boxId: null, amount: "" }]);
    setSelectedRow(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 font-cairo flex items-center justify-center">
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl p-8">
        <div className="grid grid-cols-5 gap-8">
          {/* معلومات الفاتورة */}
          <div className="flex flex-col gap-6">
            <div className="bg-gray-50 rounded-xl shadow-inner p-4 text-center">
              <p className="text-sm text-gray-500">قيمة الفاتورة</p>
              <p className="text-2xl font-bold text-green-600">SR {invoiceTotal.toFixed(2)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl shadow-inner p-4 text-center">
              <p className="text-sm text-gray-500">المبلغ المدفوع</p>
              <p className="text-2xl font-bold text-blue-600">SR {paidAmount.toFixed(2)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl shadow-inner p-4 text-center">
              <p className="text-sm text-gray-500">المتبقي</p>
              <p className="text-2xl font-bold text-red-500">SR {(invoiceTotal - paidAmount).toFixed(2)}</p>
            </div>
            <Button color="primary" className="py-3 text-lg font-semibold rounded-xl" onClick={handleSave}>حفظ</Button>
            <Button color="default" className="py-3 text-lg font-semibold rounded-xl" onClick={() => router.back()}>العودة</Button>
            <Button variant="outline" className="py-2 text-sm rounded-xl" onClick={clearAll}>تصفير الكل</Button>
          </div>

          {/* جدول الصناديق وكيبورد الأرقام */}
          <div className="col-span-3 flex flex-col items-center gap-6">
            <div className="text-6xl font-extrabold text-gray-800 tracking-wide">SR {paidAmountStr}</div>

            <div className="w-full space-y-2">
              <div className="grid grid-cols-3 gap-2 font-semibold text-sm text-gray-600">
                <div>الصندوق</div>
                <div>المبلغ</div>
                <div></div>
              </div>
              {boxInputs.map((row, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedRow(index)}
                  className={`grid grid-cols-3 gap-2 items-center transition-all duration-300 ${parseFloat(row.amount || "0") > invoiceTotal ? "bg-red-100" : ""} ${selectedRow === index ? "ring-2 ring-blue-400" : ""}`}
                >
                  <select
                    className="border rounded-lg px-3 py-2"
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
                    className="border rounded-lg px-3 py-2"
                    placeholder="0"
                    value={row.amount}
                    onChange={(e) => updateBoxInput(index, "amount", e.target.value)}
                  />
                  <Button size="sm" variant="destructive" onClick={() => removeBoxRow(index)}>حذف</Button>
                </div>
              ))}
              <Button variant="light" onClick={addBoxRow} className="mt-2 w-full">+ إضافة صف</Button>
              <div className="text-sm text-gray-500 mt-1 text-end">
                المجموع: <span className={`font-bold ${paidAmount > invoiceTotal ? "text-red-500" : "text-green-600"}`}>SR {paidAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* كيباد الأرقام */}
            <div className="grid grid-cols-4 gap-3 w-full max-w-md mt-6">
              {KEYPAD_BUTTONS.flat().map((btn, index) => (
                <motion.button
                  key={index}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    if (boxInputs.length === 0 || selectedRow === null) return;
                    const currentAmount = boxInputs[selectedRow].amount || "";
                    if (btn === "⌫") {
                      updateBoxInput(selectedRow, "amount", currentAmount.slice(0, -1));
                    } else if (/^\d+$/.test(btn)) {
                      updateBoxInput(selectedRow, "amount", currentAmount + btn);
                    }
                  }}
                  className={`text-lg font-semibold py-3 rounded-xl shadow-sm bg-white border hover:bg-blue-50 transition-colors duration-200 ${btn === "⌫" ? "text-red-500" : ""}`}
                >
                  {btn}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
