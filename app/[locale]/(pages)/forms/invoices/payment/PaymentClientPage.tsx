"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Input,
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";

import Card from "@/components/Card";
import Breadcrumb from "@/components/Breadcrumb";
import useFractions from "@/utilities/useFractions";
import { toast } from "@/utilities/toast";
import { PaidType, type InvoiceBox } from "@/types/models/invoice";
import {
  createInvoiceBoxAction,
  deleteInvoiceBoxAction,
  getInvoiceBoxListAction,
  updateInvoiceBoxAction,
} from "@/app/actions/invoice";

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
  initialInvoiceBoxes: InvoiceBox[];
  initialData: {
    total: number;
    invoiceNumber: string;
    customerName: string;
    invoiceId: string;
    companyId: string;
    invoiceType: string;
    boxId?: string;
  };
}

export default function PaymentClientPage({
  boxes,
  paymentMethods,
  initialData,
  initialInvoiceBoxes = [],
}: PaymentClientPageProps) {
  const t = useTranslations("forms.paymentPage");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const router = useRouter();
  const fractions = useFractions();
  const frac = (fractions as { frac: number }).frac || 2;

  // البيانات الأساسية
  const [invoiceTotal] = useState<number>(initialData.total);
  const [invoiceNumber] = useState<string>(initialData.invoiceNumber);
  const [customerName] = useState<string>(initialData.customerName);
  const [isSaving, setIsSaving] = useState(false);

  const [invoiceBoxLoading, setInvoiceBoxLoading] = useState(false);
  const [showBackDialog, setShowBackDialog] = useState(false);

  // Helper to update payment rows with default method
  const getInitialPaymentRows = (): PaymentRow[] => {
    if (initialInvoiceBoxes && initialInvoiceBoxes.length > 0) {
      return initialInvoiceBoxes.map((box) => ({
        id: String(box.id),
        boxId: box.box,
        amount: String(box.amt),
        paymentMethod: String(box.trans_type),
        notes: box.notes || "",
      }));
    }

    const defaultMethodId =
      paymentMethods.length > 0 ? paymentMethods[0].id.toString() : "";
    const defaultBoxId = initialData.boxId ? parseInt(initialData.boxId) : null;

    return [
      {
        id: "1",
        boxId: defaultBoxId,
        amount: initialData.total > 0 ? initialData.total.toString() : "",
        paymentMethod: defaultMethodId,
        notes: "",
      },
    ];
  };

  const getInvoiceBoxList = async () => {
    try {
      setInvoiceBoxLoading(true);
      const response = await getInvoiceBoxListAction(initialData.invoiceId);

      if (response && response.length > 0) {
        const mappedRows = response.map((box) => ({
          id: String(box.id),
          boxId: box.box,
          amount: String(box.amt),
          paymentMethod: String(box.trans_type),
          notes: box.notes || "",
        }));

        setPaymentRows(mappedRows);
      }
    } catch (error) {
      console.error("Error fetching invoice box list:", error);
    } finally {
      setInvoiceBoxLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if no initial data provided (though we expect it to be passed now)
    if (initialInvoiceBoxes.length === 0) {
      getInvoiceBoxList();
    }
  }, []);

  // بيانات الدفع المتعددة
  const [paymentRows, setPaymentRows] = useState<PaymentRow[]>(
    getInitialPaymentRows(),
  );
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(0);

  // Sync payment rows with initialInvoiceBoxes on mount, then fetch fresh data
  useEffect(() => {
    // First sync with initial data if available to avoid flicker
    if (initialInvoiceBoxes && initialInvoiceBoxes.length > 0) {
      const mappedRows = initialInvoiceBoxes.map((box) => ({
        id: String(box.id),
        boxId: box.box,
        amount: String(box.amt),
        paymentMethod: String(box.trans_type),
        notes: box.notes || "",
      }));

      setPaymentRows(mappedRows);
    }

    // Always fetch fresh data to ensure accuracy and bypass server cache issues
    getInvoiceBoxList();
  }, []);

  // حساب الإجماليات
  const paidAmount = paymentRows.reduce((sum, row) => {
    return sum + parseFloat(row.amount || "0");
  }, 0);

  const [initialOverpayment] = useState<number>(paidAmount - invoiceTotal);

  const remainingAmount = invoiceTotal - paidAmount;
  const isOverpaid = paidAmount - invoiceTotal > 0.01;
  const isPaymentMatchingTotal = Math.abs(remainingAmount) < 0.01;

  // Track if payment has been saved
  const [isSaved, setIsSaved] = useState(false);

  // Check if form has unsaved data (any payment row with a box selected)
  const hasUnsavedData = useCallback(() => {
    if (isSaved) return false;

    return paymentRows.some(
      (row) => row.boxId !== null && row.amount && parseFloat(row.amount) > 0,
    );
  }, [paymentRows, isSaved]);

  // Warn user when trying to leave the page with unsaved data
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedData()) {
        e.preventDefault();
        // Modern browsers ignore custom messages but still show a warning
        e.returnValue = "";

        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedData]);

  // تحديث صف الدفع
  const updatePaymentRow = (
    index: number,
    field: keyof PaymentRow,
    value: string | number | null,
  ) => {
    setPaymentRows((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;

        const updatedRow = { ...row };

        if (field === "boxId") {
          updatedRow.boxId = value as number | null;
        } else if (field === "amount") {
          updatedRow.amount = value as string;
        } else if (field === "paymentMethod") {
          updatedRow.paymentMethod = value as string;
        } else if (field === "notes") {
          updatedRow.notes = value as string;
        } else if (field === "id") {
          updatedRow.id = value as string;
        }

        return updatedRow;
      }),
    );
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

    const defaultBoxId = initialData.boxId ? parseInt(initialData.boxId) : null;

    const newRow: PaymentRow = {
      id: Date.now().toString(),
      boxId: defaultBoxId,
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
    const currentBoxId = paymentRows[index].id;
    deleteInvoiceBoxAction(Number(currentBoxId)).then(() => {
      setPaymentRows((prev) => prev.filter((_, i) => i !== index));
      if (selectedRowIndex >= index) {
        setSelectedRowIndex(Math.max(0, selectedRowIndex - 1));
      }
    });
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

  const InvoiceBoxPayload = (
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
    // Check if payment matches invoice total
    if (!isPaymentMatchingTotal) {
      const diff = Math.abs(remainingAmount).toFixed(frac);

      if (remainingAmount > 0) {
        toast.error(
          t("errors.paymentNotMatching", {
            remaining: diff,
            defaultValue: `المبلغ المدفوع لا يطابق قيمة الفاتورة. المتبقي: ${diff} ريال`,
          }),
        );
      } else {
        toast.error(
          t("errors.overpayment", {
            extra: diff,
            defaultValue: `المبلغ المدفوع يتجاوز قيمة الفاتورة بمقدار: ${diff} ريال`,
          }),
        );
      }

      return;
    }

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
          const body = InvoiceBoxPayload(
            row,
            index,
            inv,
            com,
            Number(row.paymentMethod), // Use selected payment method ID
            cr_date,
          );

          // Check if this payment row corresponds to an existing invoiceBox record
          // by comparing row.id (which is the invoiceBox record ID from initial data)
          const existingBox = initialInvoiceBoxes.find(
            (box) => String(box.id) === row.id,
          );

          if (existingBox) {
            const updateBody = {
              trans_type: Number(row.paymentMethod),
              amt: Number(row.amount).toFixed(frac),
              acc_change: "1",
              notes: row.notes,
              up_date: cr_date,
              com,
              inv: !isNaN(inv) && inv > 0 ? inv : 0,
              box: String(row.boxId),
            };

            return updateInvoiceBoxAction(existingBox.id, updateBody).then(
              (result) => {
                if (!result) {
                  throw new Error(`فشل في حفظ الدفع للصندوق ${row.boxId}`);
                }

                return result;
              },
            );
          } else {
            return createInvoiceBoxAction(body).then((result) => {
              if (!result) {
                throw new Error(`فشل في حفظ الدفع للصندوق ${row.boxId}`);
              }

              return result;
            });
          }

          // return createInvoiceBoxAction(body).then((result) => {
          //   if (!result) {
          //     throw new Error(`فشل في حفظ الدفع للصندوق ${row.boxId}`);
          //   }

          //   return result;
          // });
        });

      await Promise.all(promises);

      // Mark as saved to disable the beforeunload warning
      setIsSaved(true);

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

  // Save current invoice box state and navigate back (without requiring full payment completion)
  const handleGoBackWithBoxSave = async () => {
    const currentOverpayment = paidAmount - invoiceTotal;

    if (initialOverpayment > 0.01 && currentOverpayment > 0.01) {
      toast.error(
        "لا يمكن الخروج بدون حفظ لأن الفاتورة كانت تحتوي على زيادة في البداية ولم يتم تسويتها.",
      );
      return;
    }
    setIsSaving(true);
    try {
      const inv = parseInt(initialData.invoiceId || "0");
      const com = parseInt(initialData.companyId);
      const cr_date = new Date().toISOString();

      const validRows = paymentRows.filter((row) => {
        if (!row.boxId) return false;
        const amtNum = Number(row.amount || "0");

        return !isNaN(amtNum) && amtNum >= 0;
      });

      if (validRows.length > 0) {
        const promises = validRows.map((row) => {
          const body = {
            trans_type: Number(row.paymentMethod),
            amt: Number(row.amount || "0").toFixed(frac),
            acc_change: "1",
            notes: row.notes,
            cr_date,
            com,
            inv: !isNaN(inv) && inv > 0 ? inv : 0,
            box: String(row.boxId),
          };

          // Check if this payment row corresponds to an existing invoiceBox record
          // by comparing row.id (which is the invoiceBox record ID from initial data)
          const existingBox = initialInvoiceBoxes.find(
            (box) => String(box.id) === row.id,
          );

          if (existingBox) {
            return updateInvoiceBoxAction(existingBox.id, {
              ...body,
              up_date: cr_date,
            });
          } else {
            return createInvoiceBoxAction(body);
          }
        });

        await Promise.all(promises);
      }

      setIsSaved(true);
      setShowBackDialog(false);

      const invType = initialData.invoiceType || "sale";
      const invNumber = initialData.invoiceNumber || "";

      router.push(
        `/forms/invoices?type=${invType}&mode=preview&id=${invNumber}`,
      );
    } catch (error) {
      console.error("Error saving invoice box state:", error);
      toast.error(t("errors.saveError"));
    } finally {
      setIsSaving(false);
    }
  };

  const getPaymentStatusStyles = () => {
    if (remainingAmount > 0)
      return { bg: "bg-red-50", text: "text-red-600", value: "text-red-700" };
    if (remainingAmount < -0.01)
      return {
        bg: "bg-orange-50",
        text: "text-orange-600",
        value: "text-orange-700",
      };

    return {
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      value: "text-emerald-700",
    };
  };

  const statusStyles = getPaymentStatusStyles();

  let statusText: string;

  if (remainingAmount > 0) {
    statusText = t("remaining");
  } else if (remainingAmount < -0.01) {
    statusText = t("overpaymentAmount");
  } else {
    statusText = t("fullyPaidStatus");
  }

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
              isLoading={isSaving}
              size="sm"
              onPress={handleSave}
              disabled={invoiceBoxLoading}
            >
              {isSaving ? t("saving") : t("savePayment")}
            </Button>

            <Button
              className="h-8"
              color="default"
              size="sm"
              variant="bordered"
              startContent={
                !isRtl ? <ArrowLeftIcon className="w-4 h-4" /> : undefined
              }
              endContent={
                isRtl ? <ArrowLeftIcon className="w-4 h-4" /> : undefined
              }
              onPress={() => {
                if (hasUnsavedData()) {
                  setShowBackDialog(true);
                } else {
                  setIsSaved(true);
                  const invType = initialData.invoiceType || "sale";
                  const invNumber = initialData.invoiceNumber || "";

                  router.push(
                    `/forms/invoices?type=${invType}&mode=preview&id=${invNumber}`,
                  );
                }
              }}
            >
              {t("back")}
            </Button>

            {/* رسائل الحالة */}
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
                  className={`rounded-lg p-2 sm:p-3 text-center ${statusStyles.bg}`}
                >
                  <p className={`text-xs sm:text-sm ${statusStyles.text}`}>
                    {statusText}
                  </p>
                  <p
                    className={`text-lg sm:text-xl font-bold ${statusStyles.value}`}
                  >
                    {Math.abs(remainingAmount).toFixed(frac)} ريال
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Back Confirmation Dialog */}
      <Modal
        isOpen={showBackDialog}
        onClose={() => setShowBackDialog(false)}
        isDismissable={false}
        size="md"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <p className="text-lg font-semibold">{t("backDialog.title")}</p>
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-amber-100">
                <svg
                  className="w-8 h-8 text-amber-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
              </div>
              <p className="text-gray-700 text-center text-sm leading-relaxed">
                {t("backDialog.message")}
              </p>
            </div>
          </ModalBody>
          <ModalFooter className="gap-3">
            <Button
              className="font-medium min-w-[100px]"
              color="default"
              variant="flat"
              onPress={() => setShowBackDialog(false)}
            >
              {t("backDialog.cancel")}
            </Button>
            <Button
              className="font-medium min-w-[100px]"
              color="warning"
              variant="flat"
              isLoading={isSaving}
              onPress={handleGoBackWithBoxSave}
            >
              {t("backDialog.goBackAnyway")}
            </Button>
            <Button
              className="font-medium min-w-[100px] bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md"
              color="success"
              variant="solid"
              isLoading={isSaving}
              onPress={() => {
                setShowBackDialog(false);
                handleSave();
              }}
            >
              {t("backDialog.save")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
