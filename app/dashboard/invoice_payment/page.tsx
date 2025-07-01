"use client";

import type { InvoiceBox } from "@/types/invoice-box";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Input, Select, SelectItem } from "@heroui/react";
import toast from "react-hot-toast";

import NumericKeypad from "@/components/NumericKeypad";
import { API_ENDPOINTS } from "@/utilities/api";

const {
  INVOICE_BOX_LIST,
  CREATE_INVOICE_BOX,
  UPDATE_INVOICE_BOX,
  DELETE_INVOICE_BOX,
} = API_ENDPOINTS;

export default function InvoicePaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [boxes, setBoxes] = useState<InvoiceBox[]>([]);
  const [selectedBox, setSelectedBox] = useState<number | null>(null);

  const [invoiceTotal, setInvoiceTotal] = useState<number>(0);
  const [paidAmountStr, setPaidAmountStr] = useState<string>("0");
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentId, setPaymentId] = useState<number | null>(null);

  const remainingAmount = invoiceTotal - paidAmount;

  useEffect(() => {
    fetch(INVOICE_BOX_LIST)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setBoxes(data);
        else if (Array.isArray(data.results)) setBoxes(data.results);
      })
      .catch((err) => console.error("Failed to load boxes", err));
  }, []);

  useEffect(() => {
    const total = parseFloat(searchParams.get("total") || "0");

    if (!Number.isNaN(total)) setInvoiceTotal(total);
  }, [searchParams]);

  const body = {
    box: selectedBox,
    paid: paidAmount,
    remain: remainingAmount,
  };

  const handleSave = async () => {
    try {
      const res = await fetch(CREATE_INVOICE_BOX, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error();
      toast.success("تم الحفظ بنجاح");
      router.push("/dashboard/forms/invoice");
    } catch {
      toast.error("فشل الحفظ");
    }
  };

  const handleUpdate = async () => {
    if (!paymentId) return;
    try {
      const res = await fetch(UPDATE_INVOICE_BOX(paymentId), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error();
      toast.success("تم التحديث بنجاح");
      router.push("/dashboard/forms/invoice");
    } catch {
      toast.error("فشل التحديث");
    }
  };

  const handleDelete = async () => {
    if (!paymentId) return;
    if (!confirm("هل تريد الحذف؟")) return;
    try {
      const res = await fetch(DELETE_INVOICE_BOX(paymentId), {
        method: "DELETE",
      });

      if (!res.ok) throw new Error();
      toast.success("تم الحذف بنجاح");
      router.push("/dashboard/forms/invoice");
    } catch {
      toast.error("فشل الحذف");
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto font-cairo">
      <h1 className="text-2xl font-bold mb-6">دفعة فاتورة</h1>
      <div className="flex flex-col gap-4">
        <Select
          label="الصندوق"
          selectedKeys={selectedBox ? [String(selectedBox)] : []}
          onSelectionChange={(keys) => {
            const id = Number(Array.from(keys)[0]);

            setSelectedBox(id);
          }}
        >
          {boxes.map((box) => (
            <SelectItem key={box.id} textValue={box.box_name} value={box.id}>
              {box.box_name}
            </SelectItem>
          ))}
        </Select>

        <Input
          label="اجمالي الفاتورة"
          type="number"
          value={invoiceTotal.toString()}
          onChange={(e) => setInvoiceTotal(parseFloat(e.target.value) || 0)}
        />

        <Input
          label="المبلغ المدفوع"
          type="text"
          value={paidAmountStr}
          onChange={(e) => {
            const val = e.target.value;

            setPaidAmountStr(val);
            setPaidAmount(parseFloat(val) || 0);
          }}
        />

        <NumericKeypad
          onBackspace={() => {
            const next = paidAmountStr.slice(0, -1) || "0";

            setPaidAmountStr(next);
            setPaidAmount(parseFloat(next) || 0);
          }}
          onDigit={(d) => {
            const next = (
              paidAmountStr === "0" ? d : paidAmountStr + d
            ).replace(/^0+(?=\d)/, "");

            setPaidAmountStr(next);
            setPaidAmount(parseFloat(next) || 0);
          }}
        />

        <Input
          readOnly
          label="المتبقي"
          type="number"
          value={remainingAmount.toString()}
        />

        <Input
          label="معرف العملية (للتعديل أو الحذف)"
          type="number"
          value={paymentId ? paymentId.toString() : ""}
          onChange={(e) => setPaymentId(parseInt(e.target.value) || null)}
        />

        <div className="flex gap-2 mt-2">
          <Button color="success" onPress={handleSave}>
            حفظ
          </Button>
          <Button color="primary" onPress={handleUpdate}>
            تحديث
          </Button>
          <Button color="danger" onPress={handleDelete}>
            حذف
          </Button>
        </div>
      </div>
    </div>
  );
}
