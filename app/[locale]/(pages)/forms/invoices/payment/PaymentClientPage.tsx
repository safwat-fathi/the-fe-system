"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select, SelectItem } from "@heroui/react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

import Card from "@/components/Card";
import Breadcrumb from "@/components/Breadcrumb";
import useFractions from "@/utilities/useFractions";
import { toast } from "@/utilities/toast";
import { PaidType } from "@/types/models/invoice";
import { createInvoiceBoxAction } from "@/app/actions/invoice";

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

interface PaymentClientPageProps {
  boxes: Box[];
  paymentMethods: PaidType[];
  initialData: {
    total: number;
    invoiceNumber: string;
    customerName: string;
    invoiceId: string;
    companyId: string;
    invoiceType: string;
  };
}

export default function PaymentClientPage({
  boxes,
  paymentMethods,
  initialData,
}: PaymentClientPageProps) {
  const t = useTranslations("forms.paymentPage");
  const router = useRouter();
  const fractions = useFractions();
  const frac = (fractions as { frac: number }).frac || 2;

  // البيانات الأساسية
  const [invoiceTotal] = useState<number>(initialData.total);
  const [invoiceNumber] = useState<string>(initialData.invoiceNumber);
  const [customerName] = useState<string>(initialData.customerName);
  const [isSaving, setIsSaving] = useState(false);

  // Helper to update payment rows with default method
  const getInitialPaymentRows = (): PaymentRow[] => {
    const defaultMethodId =
      paymentMethods.length > 0 ? paymentMethods[0].id.toString() : "";

    return [
      {
        id: "1",
        boxId: null,
        amount: initialData.total > 0 ? initialData.total.toString() : "",
        paymentMethod: defaultMethodId,
        notes: "",
      },
    ];
  };

  // بيانات الدفع المتعددة
  const [paymentRows, setPaymentRows] = useState<PaymentRow[]>(
    getInitialPaymentRows(),
  );
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(0);

  // حساب الإجماليات
  const paidAmount = paymentRows.reduce((sum, row) => {
    return sum + parseFloat(row.amount || "0");
  }, 0);

  const remainingAmount = invoiceTotal - paidAmount;
  const isOverpaid = paidAmount > invoiceTotal;
  const isPaymentMatchingTotal = Math.abs(remainingAmount) < 0.01;

  // تحديث صف الدفع
  const updatePaymentRow = (
    index: number,
    field: keyof PaymentRow,
    value: string | number | null,
  ) => {
    setPaymentRows((prev) => {
      const updated = [...prev];
      const row = updated[index];

      // @ts-expect-error - Dynamic assignment to typed object
      row[field] = value;

      return updated;
    });
  };

  // إضافة صف دفع جديد
  const addPaymentRow = () => {
    // Calculate current paid amount from existing rows
    const currentPaidAmount = paymentRows.reduce((sum, row) => {
      return sum + parseFloat(row.amount || "0");
    }, 0);

    // Calculate remaining amount
    const currentRemaining = Math.max(0, invoiceTotal - currentPaidAmount);

    // Format amount based on fraction setting, or keep empty if 0
    const defaultAmount =
      currentRemaining > 0 ? currentRemaining.toFixed(frac) : "";

    const newRow: PaymentRow = {
      id: Date.now().toString(),
      boxId: null,
      amount: defaultAmount,
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

  const createInvoiceBoxPayload = (
    row: PaymentRow,
    _successCount: number,
    inv: number,
    com: number,
    trans_type: number,
    cr_date: string,
  ) => {
    const amtNum = Number(row.amount);

    return {
      trans_type,
      amt: amtNum.toFixed(frac),
      acc_change: "1",
      notes: row.notes,
      cr_date,
      com,
      inv: !isNaN(inv) && inv > 0 ? inv : 0,
      box: String(row.boxId), // Convert to string as per dto
    };
  };

  // حفظ الدفع
  const handleSave = async () => {
    if (!validatePaymentRows()) {
      return;
    }

    setIsSaving(true);

    try {
      const inv = parseInt(initialData.invoiceId || "0");
      const com = parseInt(initialData.companyId);
      const cr_date = new Date().toISOString();

      const promises = paymentRows
        .filter((row) => {
          if (!row.boxId || !row.amount) return false;
          const amtNum = Number(row.amount);

          return !isNaN(amtNum) && amtNum !== 0;
        })
        .map((row, index) => {
          const body = createInvoiceBoxPayload(
            row,
            index,
            inv,
            com,
            Number(row.paymentMethod), // Use selected payment method ID
            cr_date,
          );

          return createInvoiceBoxAction(body).then((result) => {
            if (!result) {
              throw new Error(`فشل في حفظ الدفع للصندوق ${row.boxId}`);
            }

            return result;
          });
        });

      await Promise.all(promises);

      toast.success(t("errors.saveSuccess"));

      // Redirect to invoice preview page
      const invType = initialData.invoiceType || "sale";
      const invNumber = initialData.invoiceNumber || "";

      router.push(
        `/forms/invoices?type=${invType}&mode=preview&id=${invNumber}`,
      );
    } catch (error) {
      console.error("خطأ في حفظ الدفع:", error);
      toast.error(t("errors.saveError"));
    } finally {
      setIsSaving(false);
    }
  };

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

            <Button
              className="flex-1"
              color="default"
              disabled={isOverpaid || !isPaymentMatchingTotal}
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

            {isPaymentMatchingTotal && !isOverpaid && (
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
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 text-start">
                {t("paymentMethods")}
              </h3>

              <div className="space-y-3">
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
          </div>

          {/* الجانب الأيسر - ملخص الدفع */}
          <div className="space-y-3">
            {/* ملخص الدفع */}
            <Card className="p-2 sm:p-1 h-fit">
              <h3 className="text-base text-start sm:text-lg font-semibold text-gray-800 mb-3">
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
