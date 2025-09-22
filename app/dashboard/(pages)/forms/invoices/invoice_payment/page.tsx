"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Input, Select, SelectItem, Divider } from "@heroui/react";
import Card from "@/components/Card";
import { motion } from "framer-motion";
import { API_ENDPOINTS } from "@/utilities/api";
import useFractions from "@/utilities/useFractions";
import { toast } from "@/utilities/toast";

const { CREATE_INVOICE_BOX, INVOICE_BOX_LIST } = API_ENDPOINTS;

// أنواع الدفع المتاحة
const PAYMENT_METHODS = [
  { key: "cash", label: "نقداً", icon: "💵" },
  { key: "card", label: "بطاقة ائتمان", icon: "💳" },
  { key: "bank", label: "تحويل بنكي", icon: "🏦" },
  { key: "check", label: "شيك", icon: "📄" },
];

// أزرار الكيباد المبسطة
const KEYPAD_BUTTONS = [
  ["7", "8", "9", "+100"],
  ["4", "5", "6", "+500"],
  ["1", "2", "3", "+1000"],
  ["C", "0", ".", "⌫"]
];

interface PaymentRow {
  id: string;
  boxId: number | null;
  amount: string;
  paymentMethod: string;
  notes: string;
}

interface Box {
  id: number;
  box_name: string;
}

export default function InvoicePaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fractions = useFractions();
  const frac = (fractions as any).frac || 2;

  // البيانات الأساسية
  const [invoiceTotal, setInvoiceTotal] = useState<number>(0);
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // بيانات الدفع المتعددة
  const [paymentRows, setPaymentRows] = useState<PaymentRow[]>([
    {
      id: "1",
      boxId: null,
      amount: "",
      paymentMethod: "cash",
      notes: ""
    }
  ]);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(0);

  // الحصول على بيانات الفاتورة
  useEffect(() => {
    const total = parseFloat(searchParams.get("total") || "0");
    const invNumber = searchParams.get("inv_number") || "";
    const customer = searchParams.get("customer") || "";
    const inv = searchParams.get("inv") || "";
    
    if (!Number.isNaN(total)) {
      setInvoiceTotal(total);
      // تعيين المبلغ الأول تلقائياً
      setPaymentRows(prev => [{
        ...prev[0],
        amount: total.toString()
      }]);
    }
    
    setInvoiceNumber(invNumber || inv);
    setCustomerName(customer);
  }, [searchParams]);

  // جلب الصناديق
  useEffect(() => {
    const fetchBoxes = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(INVOICE_BOX_LIST);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setBoxes(data);
        if (data.length > 0) {
          setPaymentRows(prev => [{
            ...prev[0],
            boxId: data[0].id
          }]);
        }
      } catch (error) {
        console.error("خطأ في جلب الصناديق:", error);
        toast.error("فشل في جلب قائمة الصناديق");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBoxes();
  }, []);

  // حساب الإجماليات
  const paidAmount = paymentRows.reduce((sum, row) => {
    return sum + parseFloat(row.amount || "0");
  }, 0);

  const remainingAmount = invoiceTotal - paidAmount;
  const isOverpaid = paidAmount > invoiceTotal;
  const isFullyPaid = Math.abs(remainingAmount) < 0.01;

  // تحديث صف الدفع
  const updatePaymentRow = (index: number, field: keyof PaymentRow, value: any) => {
    setPaymentRows(prev => {
      const updated = [...prev];
      (updated[index] as any)[field] = value;
      
      // إذا كان هذا الصف الأول، تحديث المبلغ تلقائياً
      if (index === 0 && field === "amount") {
        const otherRowsTotal = updated.slice(1).reduce((sum, row) => {
          return sum + parseFloat(row.amount || "0");
        }, 0);
        
        const newFirstAmount = (invoiceTotal - otherRowsTotal).toString();
        if (Math.abs(parseFloat(value) - parseFloat(newFirstAmount)) > 0.01) {
          updated[0].amount = newFirstAmount;
        }
      }
      
      return updated;
    });
  };

  // إضافة صف دفع جديد
  const addPaymentRow = () => {
    const newRow: PaymentRow = {
      id: Date.now().toString(),
      boxId: null,
      amount: "",
      paymentMethod: "cash",
      notes: ""
    };
    setPaymentRows(prev => [...prev, newRow]);
    setSelectedRowIndex(paymentRows.length);
  };

  // حذف صف دفع
  const removePaymentRow = (index: number) => {
    if (index === 0) return; // لا يمكن حذف الصف الأول
    setPaymentRows(prev => prev.filter((_, i) => i !== index));
    if (selectedRowIndex >= index) {
      setSelectedRowIndex(Math.max(0, selectedRowIndex - 1));
    }
  };

  // معالجة الكيباد
  const handleKeypadInput = (value: string) => {
    if (selectedRowIndex === null) return;
    
    const currentRow = paymentRows[selectedRowIndex];
    const currentAmount = currentRow.amount || "0";
    
    switch (value) {
      case "C":
        updatePaymentRow(selectedRowIndex, "amount", "0");
        break;
      case "⌫":
        updatePaymentRow(selectedRowIndex, "amount", currentAmount.slice(0, -1) || "0");
        break;
      case ".":
        if (!currentAmount.includes(".")) {
          updatePaymentRow(selectedRowIndex, "amount", currentAmount + ".");
        }
        break;
      case "+100":
      case "+500":
      case "+1000":
        const currentNum = parseFloat(currentAmount) || 0;
        const quickAmount = parseInt(value.replace("+", ""));
        updatePaymentRow(selectedRowIndex, "amount", (currentNum + quickAmount).toString());
        break;
      default:
        if (currentAmount === "0") {
          updatePaymentRow(selectedRowIndex, "amount", value);
        } else {
          updatePaymentRow(selectedRowIndex, "amount", currentAmount + value);
        }
        break;
    }
  };

  // حفظ الدفع
  const handleSave = async () => {
    if (paymentRows.length === 0) {
      toast.error("يرجى إدخال بيانات الدفع");
      return;
    }

    const invalidRows = paymentRows.filter(row => 
      !row.boxId || !row.amount || parseFloat(row.amount) <= 0
    );

    if (invalidRows.length > 0) {
      toast.error("يرجى التأكد من ملء جميع الحقول بشكل صحيح");
      return;
    }

    if (isOverpaid) {
      toast.error("المبلغ المدفوع أكبر من قيمة الفاتورة");
      return;
    }

    setIsSaving(true);
    
    try {
      const inv = parseInt(searchParams.get("inv") || "0");
      const com = 1;
      const trans_type = 1;
      const cr_date = new Date().toISOString();
      
      let successCount = 0;
      
      for (const row of paymentRows) {
        if (!row.boxId || !row.amount) continue;
        
        const amtNum = Number(row.amount);
        if (isNaN(amtNum) || amtNum === 0) continue;
        
        const body = {
          id: successCount + 1,
          trans_type,
          amt: amtNum.toFixed(frac),
          acc_change: amtNum.toFixed(frac),
          notes: `${row.paymentMethod === "cash" ? "نقداً" : 
                  row.paymentMethod === "card" ? "بطاقة ائتمان" :
                  row.paymentMethod === "bank" ? "تحويل بنكي" : "شيك"} - ${row.notes || ""}`,
          cr_date,
          cr_user: null,
          upd_date: null,
          upd_user: null,
          com,
          inv: (!isNaN(inv) && inv > 0) ? inv : undefined,
          box: row.boxId,
        };

        const response = await fetch(CREATE_INVOICE_BOX, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          throw new Error(`فشل في حفظ الدفع للصندوق ${row.boxId}`);
        }
        
        successCount++;
      }

      toast.success("تم حفظ الدفع بنجاح");
      
      // إعادة التوجيه
      if (inv > 0) {
        router.push(`/dashboard/forms/invoices/sale/${inv}`);
      } else {
        router.back();
      }
      
    } catch (error) {
      console.error("خطأ في حفظ الدفع:", error);
      toast.error("فشل في حفظ الدفع");
    } finally {
      setIsSaving(false);
    }
  };

  // تصفير الكل
  const clearAll = () => {
    setPaymentRows([{
      id: "1",
      boxId: boxes.length > 0 ? boxes[0].id : null,
      amount: invoiceTotal.toString(),
      paymentMethod: "cash",
      notes: ""
    }]);
    setSelectedRowIndex(0);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 font-cairo overflow-hidden">
      <div className="h-full max-w-7xl mx-auto flex flex-col">
        {/* الهيدر المدمج */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-800">دفع الفاتورة</h1>
              <div className="flex gap-4 text-sm text-gray-600 mt-1">
                {invoiceNumber && <span>رقم الفاتورة: {invoiceNumber}</span>}
                {customerName && <span>العميل: {customerName}</span>}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                color="default"
                variant="bordered"
                size="sm"
                onClick={() => router.back()}
              >
                العودة
              </Button>
              <Button
                color="primary"
                size="sm"
                onClick={handleSave}
                isLoading={isSaving}
                disabled={isOverpaid || !isFullyPaid || isLoading}
              >
                {isSaving ? "جاري الحفظ..." : "حفظ الدفع"}
              </Button>
            </div>
          </div>
        </div>

        {/* المحتوى الرئيسي */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
          {/* الجانب الأيسر - ملخص الدفع */}
          <div className="lg:col-span-1 space-y-4">
            {/* ملخص الدفع */}
            <Card className="p-4 h-fit">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">ملخص الدفع</h3>
              
              <div className="space-y-3">
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-sm text-green-600">قيمة الفاتورة</p>
                  <p className="text-xl font-bold text-green-700">
                    {invoiceTotal.toFixed(frac)} ريال
                  </p>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-sm text-blue-600">المبلغ المدفوع</p>
                  <p className="text-xl font-bold text-blue-700">
                    {paidAmount.toFixed(frac)} ريال
                  </p>
                </div>
                
                <div className={`rounded-lg p-3 text-center ${
                  remainingAmount > 0 ? "bg-red-50" : "bg-emerald-50"
                }`}>
                  <p className={`text-sm ${
                    remainingAmount > 0 ? "text-red-600" : "text-emerald-600"
                  }`}>
                    {remainingAmount > 0 ? "المتبقي" : "المدفوع بالكامل"}
                  </p>
                  <p className={`text-xl font-bold ${
                    remainingAmount > 0 ? "text-red-700" : "text-emerald-700"
                  }`}>
                    {Math.abs(remainingAmount).toFixed(frac)} ريال
                  </p>
                </div>
              </div>

              <Divider className="my-3" />
              
              <div className="space-y-2">
                <Button
                  color="success"
                  variant="bordered"
                  size="sm"
                  onClick={addPaymentRow}
                  className="w-full"
                >
                  + إضافة صندوق
                </Button>
                
                <Button
                  color="warning"
                  variant="bordered"
                  size="sm"
                  onClick={clearAll}
                  className="w-full"
                >
                  تصفير الكل
                </Button>
              </div>
            </Card>

            {/* رسائل الحالة */}
            {isOverpaid && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-center font-semibold text-sm">
                  ⚠️ المبلغ المدفوع أكبر من قيمة الفاتورة
                </p>
              </div>
            )}
            
            {isFullyPaid && !isOverpaid && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 text-center font-semibold text-sm">
                  ✅ تم دفع الفاتورة بالكامل
                </p>
              </div>
            )}
          </div>

          {/* الجانب الأيمن - جدول الدفع والكيباد */}
          <div className="lg:col-span-2 space-y-4">
            {/* جدول الدفع */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                طرق الدفع
                <span className="text-sm text-gray-500 mr-2">
                  (اضغط على الصف لتحديده)
                </span>
              </h3>
              
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {paymentRows.map((row, index) => (
                  <motion.div
                    key={row.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`p-3 rounded-lg border-2 transition-all duration-300 cursor-pointer ${
                      selectedRowIndex === index 
                        ? "border-blue-500 bg-blue-50" 
                        : "border-gray-200 bg-white hover:border-gray-300"
                    } ${parseFloat(row.amount || "0") > invoiceTotal ? "border-red-300 bg-red-50" : ""}`}
                    onClick={() => setSelectedRowIndex(index)}
                  >
                    <div className="grid grid-cols-12 gap-3 items-center">
                      {/* الصندوق */}
                      <div className="col-span-3">
                        <Select
                          label="الصندوق"
                          placeholder={isLoading ? "جاري التحميل..." : "اختر الصندوق"}
                          selectedKeys={row.boxId ? [row.boxId.toString()] : []}
                          onSelectionChange={(keys) => {
                            const selected = Array.from(keys)[0] as string;
                            updatePaymentRow(index, "boxId", selected ? parseInt(selected) : null);
                          }}
                          isDisabled={isLoading}
                          size="sm"
                        >
                          {boxes.map((box) => (
                            <SelectItem key={box.id}>
                              {box.box_name}
                            </SelectItem>
                          ))}
                        </Select>
                      </div>

                      {/* المبلغ */}
                      <div className="col-span-2">
                        <Input
                          label="المبلغ"
                          type="number"
                          placeholder="0"
                          value={row.amount}
                          onChange={(e) => updatePaymentRow(index, "amount", e.target.value)}
                          size="sm"
                          startContent={
                            <div className="pointer-events-none flex items-center">
                              <span className="text-default-400 text-small">ريال</span>
                            </div>
                          }
                        />
                      </div>

                      {/* طريقة الدفع */}
                      <div className="col-span-2">
                        <Select
                          label="طريقة الدفع"
                          selectedKeys={[row.paymentMethod]}
                          onSelectionChange={(keys) => {
                            const selected = Array.from(keys)[0] as string;
                            updatePaymentRow(index, "paymentMethod", selected);
                          }}
                          size="sm"
                        >
                          {PAYMENT_METHODS.map((method) => (
                            <SelectItem key={method.key}>
                              <div className="flex items-center gap-2">
                                <span>{method.icon}</span>
                                <span>{method.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </Select>
                      </div>

                      {/* البيان */}
                      <div className="col-span-3">
                        <Input
                          label="البيان"
                          placeholder="ملاحظات الدفع"
                          value={row.notes}
                          onChange={(e) => updatePaymentRow(index, "notes", e.target.value)}
                          size="sm"
                        />
                      </div>

                      {/* حذف */}
                      <div className="col-span-2 flex justify-center">
                        <Button
                          color="danger"
                          variant="light"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            removePaymentRow(index);
                          }}
                          disabled={index === 0}
                          isIconOnly
                        >
                          🗑️
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>

            {/* الكيباد المبسط */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                لوحة المفاتيح الرقمية
                {selectedRowIndex !== null && (
                  <span className="text-sm text-gray-500 mr-2">
                    (الصف {selectedRowIndex + 1})
                  </span>
                )}
              </h3>
              
              <div className="grid grid-cols-4 gap-2">
                {KEYPAD_BUTTONS.flat().map((button, index) => (
                  <motion.button
                    key={index}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleKeypadInput(button)}
                    disabled={selectedRowIndex === null}
                    className={`p-3 rounded-lg text-lg font-semibold transition-all duration-200 ${
                      button === "C" || button === "⌫"
                        ? "bg-gray-100 border-2 border-gray-200 hover:border-gray-400 hover:bg-gray-200 text-gray-700"
                        : button.startsWith("+")
                        ? "bg-blue-100 border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-200 text-blue-700"
                        : "bg-white border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50"
                    } ${selectedRowIndex === null ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {button}
                  </motion.button>
                ))}
              </div>
              
              {selectedRowIndex === null && (
                <p className="text-center text-gray-500 mt-3 text-sm">
                  اختر صف الدفع لاستخدام لوحة المفاتيح
                </p>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
