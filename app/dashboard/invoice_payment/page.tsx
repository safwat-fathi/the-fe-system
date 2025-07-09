"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@heroui/react";
import { motion } from "framer-motion";
import { API_ENDPOINTS } from "@/utilities/api";
import useFractions from "@/utilities/useFractions";

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
  const { frac } = useFractions();

  const [invoiceTotal, setInvoiceTotal] = useState<number>(0);
  const [paidAmountStr, setPaidAmountStr] = useState<string>("0");
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [boxInputs, setBoxInputs] = useState([{ boxId: null, amount: "" }]);
  const [boxes, setBoxes] = useState<any[]>([]);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);

  const handleSave = async () => {

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
    const otherRowsTotal = boxInputs
      .slice(1)
      .reduce((acc, row) => acc + parseFloat(row.amount || "0"), 0);

    setPaidAmount(otherRowsTotal);
    setPaidAmountStr(otherRowsTotal.toString());

    const firstAmount = (invoiceTotal - otherRowsTotal).toString();
    if (boxInputs[0]?.amount !== firstAmount) {
      setBoxInputs((prev) => {
        const updated = [...prev];
        if (updated.length === 0) return [{ boxId: null, amount: firstAmount }];
        updated[0] = { ...updated[0], amount: firstAmount };
        return updated;
      });
    }
  }, [boxInputs, invoiceTotal]);

  const updateBoxInput = (index: number, field: string, value: any) => {
    const updated = [...boxInputs];
    updated[index][field] = value;
    setBoxInputs(updated);
  };

  const addBoxRow = () => {
    setBoxInputs([...boxInputs, { boxId: null, amount: "" }]);
  };

  const removeBoxRow = (index: number) => {
    if (index === 0) return;
    const updated = [...boxInputs];
    updated.splice(index, 1);
    setBoxInputs(updated);
    if (selectedRow === index) setSelectedRow(null);
  };

  const clearAll = () => {
    setBoxInputs([{ boxId: null, amount: invoiceTotal.toString() }]);
    setSelectedRow(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 font-cairo flex items-start justify-center">
      <div className="w-full max-w-7xl bg-white rounded-3xl shadow-2xl p-8 grid grid-cols-12 gap-6">

        {/* المبالغ في اليسار */}
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
          <Button variant="outline" className="py-3 text-md rounded-xl" onClick={clearAll}>تصفير الكل</Button>
        </div>

        {/* جدول الصناديق في المنتصف */}
        <div className="col-span-6 flex flex-col gap-4">
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-lg font-semibold text-gray-600">
              <div>الصندوق</div>
              <div>المبلغ</div>
              <div></div>
            </div>
            {boxInputs.map((row, index) => (
              <div
                key={index}
                onClick={() => setSelectedRow(index)}
                className={`grid grid-cols-3 gap-3 items-center transition-all duration-300 ${parseFloat(row.amount || "0") > invoiceTotal ? "bg-red-100" : ""} ${selectedRow === index ? "ring-2 ring-blue-400" : ""}`}
              >
                <select
                  className="border rounded-lg px-4 py-3 text-lg"
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
                  className="border rounded-lg px-4 py-3 text-lg"
                  placeholder="0"
                  value={row.amount}
                  onChange={(e) => updateBoxInput(index, "amount", e.target.value)}
                  readOnly={index === 0}
                />
                <Button size="lg" variant="destructive" onClick={() => removeBoxRow(index)} disabled={index === 0}>حذف</Button>
              </div>
            ))}
            <Button variant="light" onClick={addBoxRow} className="mt-3 w-full text-lg">+ إضافة صف</Button>
          </div>
        </div>

        {/* كيباد الأرقام في أسفل اليمين */}
        <div className="col-span-3 flex flex-col justify-end items-end">
          <div className="grid grid-cols-4 gap-4 w-full max-w-md">
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
