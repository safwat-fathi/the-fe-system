"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Input, Select, SelectItem } from "@heroui/react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

import Card from "@/components/Card";
import Breadcrumb from "@/components/Breadcrumb";
import { API_ENDPOINTS } from "@/utilities/api";
import useFractions from "@/utilities/useFractions";
import { toast } from "@/utilities/toast";
import { PaidType } from "@/types/models/invoice";
import { getPaidTypeListAction } from "@/app/actions/invoice";
import { getBoxesAction } from "@/app/actions/boxes";

const { CREATE_INVOICE_BOX } = API_ENDPOINTS;

interface PaymentRow {
  id: string;
  boxId: number | null;
  amount: string;
  paymentMethod: string;
  notes: string;
}

interface Box {
  id: number;
  cust_name: string;
}

export default function InvoicePaymentPage() {
  const t = useTranslations("forms.paymentPage");
  const router = useRouter();
  const searchParams = useSearchParams();
  const fractions = useFractions();
  const frac = (fractions as any).frac || 2;

  // البيانات الأساسية
  const [invoiceTotal, setInvoiceTotal] = useState<number>(0);
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaidType[]>([]);

  // بيانات الدفع المتعددة
  const [paymentRows, setPaymentRows] = useState<PaymentRow[]>([
    {
      id: "1",
      boxId: null,
      amount: "",
      paymentMethod: "",
      notes: "",
    },
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
      setPaymentRows((prev) => [
        {
          ...prev[0],
          amount: total.toString(),
        },
      ]);
    }

    setInvoiceNumber(invNumber || inv);
    setCustomerName(customer);
  }, [searchParams]);

  // Get company ID and transaction type from URL
  const companyId = searchParams.get("com") || "1";
  const transType = parseInt(searchParams.get("trans_type") || "2"); // Default to SALES (2)

  // جلب الصناديق
  useEffect(() => {
    const fetchBoxes = async () => {
      const response = await getBoxesAction();

      if (response && response.length > 0) {
        setBoxes(response);
      }
    };

    fetchBoxes();
  }, []);

  // Helper to update payment rows with default method
  const updatePaymentRowsWithDefault = (
    rows: PaymentRow[],
    defaultMethodId: string,
  ): PaymentRow[] =>
    rows.map((row) => ({
      ...row,
      paymentMethod:
        row.paymentMethod === "cash" || row.paymentMethod === ""
          ? defaultMethodId
          : row.paymentMethod,
    }));

  // جلب أنواع الدفع
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      const response = await getPaidTypeListAction();

      if (!response?.results || response.results.length === 0) return;

      setPaymentMethods(response.results);
      const defaultMethodId = response.results[0].id.toString();

      setPaymentRows((prev) =>
        updatePaymentRowsWithDefault(prev, defaultMethodId),
      );
    };

    fetchPaymentMethods();
  }, []);

  // حساب الإجماليات
  const paidAmount = paymentRows.reduce((sum, row) => {
    return sum + parseFloat(row.amount || "0");
  }, 0);

  const remainingAmount = invoiceTotal - paidAmount;
  const isOverpaid = paidAmount > invoiceTotal;
  const isFullyPaid = Math.abs(remainingAmount) < 0.01;

  // تحديث صف الدفع
  const updatePaymentRow = (
    index: number,
    field: keyof PaymentRow,
    value: any,
  ) => {
    setPaymentRows((prev) => {
      const updated = [...prev];

      (updated[index] as any)[field] = value;

      return updated;
    });
  };

  // إضافة صف دفع جديد
  const addPaymentRow = () => {
    const newRow: PaymentRow = {
      id: Date.now().toString(),
      boxId: null,
      amount: "",
      paymentMethod:
        paymentMethods.length > 0 ? paymentMethods[0].id.toString() : "",
      notes: "",
    };

    setPaymentRows((prev) => [...prev, newRow]);
    setSelectedRowIndex(paymentRows.length);
  };

  // حذف صف دفع
  const removePaymentRow = (index: number) => {
    if (index === 0) return; // لا يمكن حذف الصف الأول
    setPaymentRows((prev) => prev.filter((_, i) => i !== index));
    if (selectedRowIndex >= index) {
      setSelectedRowIndex(Math.max(0, selectedRowIndex - 1));
    }
  };

  // Helper function to get payment method label
  const getPaymentMethodLabel = (methodId: string): string => {
    const method = paymentMethods.find((m) => m.id.toString() === methodId);

    return method ? method.code_desc : "";
  };

  // Helper function to validate payment rows
  const validatePaymentRows = (): boolean => {
    if (paymentRows.length === 0) {
      toast.error(t("errors.enterPayment"));

      return false;
    }

    const invalidRows = paymentRows.filter(
      (row) => !row.boxId || !row.amount || parseFloat(row.amount) <= 0,
    );

    if (invalidRows.length > 0) {
      toast.error(t("errors.fillFields"));

      return false;
    }

    if (isOverpaid) {
      toast.error(t("errors.overpaid"));

      return false;
    }

    return true;
  };

  // Helper function to create invoice box payload
  const createInvoiceBoxPayload = (
    row: PaymentRow,
    successCount: number,
    inv: number,
    com: number,
    trans_type: number,
    cr_date: string,
  ) => {
    const amtNum = Number(row.amount);
    const paymentLabel = getPaymentMethodLabel(row.paymentMethod);

    return {
      id: successCount + 1,
      trans_type,
      amt: amtNum.toFixed(frac),
      acc_change: amtNum.toFixed(frac),
      notes: `${paymentLabel} - ${row.notes || ""}`,
      cr_date,
      cr_user: null,
      upd_date: null,
      upd_user: null,
      com,
      inv: !isNaN(inv) && inv > 0 ? inv : undefined,
      box: row.boxId,
    };
  };

  // حفظ الدفع
  const handleSave = async () => {
    if (!validatePaymentRows()) {
      return;
    }

    setIsSaving(true);

    try {
      const inv = parseInt(searchParams.get("inv") || "0");
      const com = parseInt(companyId);
      const trans_type = transType;
      const cr_date = new Date().toISOString();

      let successCount = 0;

      for (const row of paymentRows) {
        if (!row.boxId || !row.amount) continue;

        const amtNum = Number(row.amount);

        if (isNaN(amtNum) || amtNum === 0) continue;

        const body = createInvoiceBoxPayload(
          row,
          successCount,
          inv,
          com,
          trans_type,
          cr_date,
        );

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

      toast.success(t("errors.saveSuccess"));

      // إعادة التوجيه
      if (inv > 0) {
        router.push(`/forms/invoices/sale/${inv}`);
      } else {
        router.back();
      }
    } catch (error) {
      console.error("خطأ في حفظ الدفع:", error);
      toast.error(t("errors.saveError"));
    } finally {
      setIsSaving(false);
    }
  };

  // تصفير الكل
  // const clearAll = () => {
  //   setPaymentRows([
  //     {
  //       id: "1",
  //       boxId: boxes.length > 0 ? boxes[0].id : null,
  //       amount: invoiceTotal.toString(),
  //       paymentMethod: "cash",
  //       notes: "",
  //     },
  //   ]);
  //   setSelectedRowIndex(0);
  // };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 sm:p-4 font-cairo">
      <div className="h-full max-w-7xl mx-auto flex flex-col">
        <Breadcrumb />
        {/* الهيدر المدمج */}
        <div className="bg-white rounded-2xl shadow-lg p-3 sm:p-4 mb-3">
          <div className="flex justify-between items-center gap-3">
            <div className="flex-1 w-full">
              <h1 className="text-lg sm:text-xl font-bold text-gray-800">
                {t("title")}
              </h1>
              <div className="flex flex-col sm:flex-row gap-2 text-xs sm:text-sm text-gray-600 mt-1">
                {invoiceNumber && (
                  <span>{t("invoiceNumber", { number: invoiceNumber })}</span>
                )}
                {customerName && (
                  <span>{t("customer", { name: customerName })}</span>
                )}
              </div>
            </div>

            {/* <Button
                className="flex-1"
                color="default"
                size="sm"
                variant="bordered"
                onClick={() => router.back()}
              >
                العودة
              </Button> */}
            <Button
              className="flex-1"
              color="default"
              disabled={isOverpaid || !isFullyPaid}
              isLoading={isSaving}
              size="sm"
              onPress={handleSave}
            >
              {isSaving ? t("saving") : t("savePayment")}
            </Button>

            {/* رسائل الحالة */}
            {isOverpaid && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-center font-semibold text-sm">
                  {t("overpaid")}
                </p>
              </div>
            )}

            {isFullyPaid && !isOverpaid && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 text-center font-semibold text-sm">
                  {t("fullyPaid")}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* المحتوى الرئيسي */}
        <div className="flex-1 grid grid-cols-4 gap-3 sm:gap-4">
          {/* الجانب الأيمن - جدول الدفع والكيباد */}
          <div className="space-y-3 col-span-3">
            {/* جدول الدفع */}
            <Card className="p-2 sm:p-1">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">
                {t("paymentMethods")}
                {/* <span className="text-xs sm:text-sm text-gray-500 mr-2 block sm:inline">
                  (اضغط على الصف لتحديده)
                </span> */}
              </h3>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                <Button
                  className="w-full"
                  color="success"
                  size="sm"
                  variant="bordered"
                  onPress={addPaymentRow}
                >
                  {t("addBox")}
                </Button>
                {paymentRows.map((row, index) => (
                  <motion.div
                    key={row.id}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-lg border-2 transition-all duration-300 cursor-pointer ${
                      selectedRowIndex === index
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    } ${parseFloat(row.amount || "0") > invoiceTotal ? "border-red-300 bg-red-50" : ""}`}
                    exit={{ opacity: 0, y: -20 }}
                    initial={{ opacity: 0, y: 20 }}
                    onClick={() => setSelectedRowIndex(index)}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-2 sm:gap-3 items-center">
                      {/* الصندوق */}
                      <div className="md:col-span-3">
                        <Select
                          label={t("box")}
                          placeholder={t("selectBox")}
                          selectedKeys={row.boxId ? [row.boxId.toString()] : []}
                          size="sm"
                          onSelectionChange={(keys) => {
                            const selected = Array.from(keys)[0] as string;

                            updatePaymentRow(
                              index,
                              "boxId",
                              selected ? parseInt(selected) : null,
                            );
                          }}
                        >
                          {boxes.map((box) => (
                            <SelectItem key={box.id} textValue={box.cust_name}>
                              {box.cust_name}
                            </SelectItem>
                          ))}
                        </Select>
                      </div>

                      {/* المبلغ */}
                      <div className="md:col-span-2">
                        <Input
                          label={t("amount")}
                          placeholder="0"
                          size="sm"
                          startContent={
                            <div className="pointer-events-none flex items-center">
                              <span className="text-default-400 text-small">
                                ريال
                              </span>
                            </div>
                          }
                          type="number"
                          value={row.amount}
                          onChange={(e) =>
                            updatePaymentRow(index, "amount", e.target.value)
                          }
                        />
                      </div>

                      {/* طريقة الدفع */}
                      <div className="md:col-span-2">
                        <Select
                          label={t("paymentMethod")}
                          selectedKeys={
                            row.paymentMethod ? [row.paymentMethod] : []
                          }
                          size="sm"
                          onSelectionChange={(keys) => {
                            const selected = Array.from(keys)[0] as string;

                            updatePaymentRow(index, "paymentMethod", selected);
                          }}
                        >
                          {paymentMethods.map((method) => (
                            <SelectItem
                              key={method.id.toString()}
                              textValue={method.code_desc}
                            >
                              <div className="flex items-center gap-2">
                                <span>{method.code_desc}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </Select>
                      </div>

                      {/* البيان */}
                      <div className="md:col-span-3">
                        <Input
                          label={t("description")}
                          placeholder={t("description")}
                          size="sm"
                          value={row.notes}
                          onChange={(e) =>
                            updatePaymentRow(index, "notes", e.target.value)
                          }
                        />
                      </div>

                      {/* حذف */}
                      <div className="md:col-span-2 flex justify-center mt-2 md:mt-0">
                        <Button
                          isIconOnly
                          color="danger"
                          disabled={index === 0}
                          size="sm"
                          variant="light"
                          onClick={(e) => {
                            e.stopPropagation();
                            removePaymentRow(index);
                          }}
                        >
                          🗑️
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>

            {/* الكيباد المبسط
            <Card className="p-3 sm:p-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">
                لوحة المفاتيح الرقمية
                {selectedRowIndex !== null && (
                  <span className="text-xs sm:text-sm text-gray-500 mr-2 block sm:inline">
                    (الصف {selectedRowIndex + 1})
                  </span>
                )}
              </h3>

              <div className="grid grid-cols-4 gap-1 sm:gap-2">
                {KEYPAD_BUTTONS.flat().map((button, index) => (
                  <motion.button
                    key={index}
                    className={`p-2 sm:p-3 rounded-lg text-base sm:text-lg font-semibold transition-all duration-200 ${
                      button === "C" || button === "⌫"
                        ? "bg-gray-100 border-2 border-gray-200 hover:border-gray-400 hover:bg-gray-200 text-gray-700"
                        : button.startsWith("+")
                          ? "bg-blue-100 border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-200 text-blue-700"
                          : "bg-white border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50"
                    } ${selectedRowIndex === null ? "opacity-50 cursor-not-allowed" : ""}`}
                    disabled={selectedRowIndex === null}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleKeypadInput(button)}
                  >
                    {button}
                  </motion.button>
                ))}
              </div>

              {selectedRowIndex === null && (
                <p className="text-center text-gray-500 mt-3 text-xs sm:text-sm">
                  اختر صف الدفع لاستخدام لوحة المفاتيح
                </p>
              )}
            </Card> */}
          </div>

          {/* الجانب الأيسر - ملخص الدفع */}
          <div className="space-y-3">
            {/* ملخص الدفع */}
            <Card className="p-2 sm:p-1 h-fit">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">
                {t("paymentSummary")}
              </h3>

              <div className="space-y-2 sm:space-y-3">
                <div className="bg-green-50 rounded-lg p-2 sm:p-3 text-center">
                  <p className="text-xs sm:text-sm text-green-600">
                    {t("invoiceValue")}
                  </p>
                  <p className="text-lg sm:text-xl font-bold text-green-700">
                    {invoiceTotal.toFixed(frac)} ريال
                  </p>
                </div>

                <div className="bg-blue-50 rounded-lg p-2 sm:p-3 text-center">
                  <p className="text-xs sm:text-sm text-blue-600">
                    {t("paidAmount")}
                  </p>
                  <p className="text-lg sm:text-xl font-bold text-blue-700">
                    {paidAmount.toFixed(frac)} ريال
                  </p>
                </div>

                <div
                  className={`rounded-lg p-2 sm:p-3 text-center ${
                    remainingAmount > 0 ? "bg-red-50" : "bg-emerald-50"
                  }`}
                >
                  <p
                    className={`text-xs sm:text-sm ${
                      remainingAmount > 0 ? "text-red-600" : "text-emerald-600"
                    }`}
                  >
                    {remainingAmount > 0
                      ? t("remaining")
                      : t("fullyPaidStatus")}
                  </p>
                  <p
                    className={`text-lg sm:text-xl font-bold ${
                      remainingAmount > 0 ? "text-red-700" : "text-emerald-700"
                    }`}
                  >
                    {Math.abs(remainingAmount).toFixed(frac)} ريال
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
