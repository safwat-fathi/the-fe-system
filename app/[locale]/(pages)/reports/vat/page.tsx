"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Button,
  Chip,
  Select,
  SelectItem,
  Tabs,
  Tab,
  Card,
  CardBody,
  CardHeader,
  type ChipProps,
} from "@heroui/react";
import {
  PrinterIcon,
  ArrowDownTrayIcon,
  TableCellsIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import Breadcrumb from "@/components/Breadcrumb";
import { API_ENDPOINTS, fetchData } from "@/utilities/api";
import { formatDateTime } from "@/utilities/dateUtils";
import { formatAmount } from "@/utilities/formatAmount";
import useFractions from "@/utilities/useFractions";
import {
  INVOICE_TYPES,
  getInvoiceTypeLabel,
  getInvoiceTypeColor,
} from "@/constants";
import VATSummary from "@/components/VATSummary";

interface VATReportData {
  // بيانات المبيعات
  salesStandardRate: {
    amount: number;
    adjustmentAmount: number;
    vatAmount: number;
  };
  salesZeroRate: {
    amount: number;
    adjustmentAmount: number;
    vatAmount: number;
  };
  salesExempt: {
    amount: number;
    adjustmentAmount: number;
    vatAmount: number;
  };

  // بيانات المشتريات
  purchasesStandardRate: {
    amount: number;
    adjustmentAmount: number;
    vatAmount: number;
  };
  purchasesExpenses: {
    amount: number;
    adjustmentAmount: number;
    vatAmount: number;
  };
  purchasesZeroRate: {
    amount: number;
    adjustmentAmount: number;
    vatAmount: number;
  };
  purchasesExempt: {
    amount: number;
    adjustmentAmount: number;
    vatAmount: number;
  };
}

interface VATInvoice {
  inv_id: number;
  inv_date: string;
  cust_name: string;
  trans_type: number;
  inv_amt: number;
  tax: number;
  adjustment_amount?: number;
  vat_rate: number;
}

export default function VATReportPage() {
  const fractions = useFractions() as { frac: number; frac2: number };
  const [invoices, setInvoices] = useState<VATInvoice[]>([]);
  const [activeTab, setActiveTab] = useState("summary");

  // فلاتر
  const [costCenter, setCostCenter] = useState("");
  const [branch, setBranch] = useState("");
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0], // بداية السنة
    end: new Date().toISOString().split("T")[0], // اليوم الحالي
  });

  const loadInvoices = useCallback(async () => {
    try {
      const data = await fetchData<VATInvoice[]>(API_ENDPOINTS.INVOICES_LIST);

      setInvoices(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("خطأ في تحميل الفواتير");
      console.error("Error loading invoices:", error);
    }
  }, []);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  // تصفية الفواتير حسب التاريخ
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const invDate = new Date(inv.inv_date);
      const startDate = dateRange.start ? new Date(dateRange.start) : null;
      const endDate = dateRange.end ? new Date(dateRange.end) : null;

      const dateMatch =
        (!startDate || invDate >= startDate) &&
        (!endDate || invDate <= endDate);

      return dateMatch;
    });
  }, [invoices, dateRange]);

  // حساب بيانات تقرير الضريبة
  const vatReportData = useMemo((): VATReportData => {
    const data: VATReportData = {
      salesStandardRate: { amount: 0, adjustmentAmount: 0, vatAmount: 0 },
      salesZeroRate: { amount: 0, adjustmentAmount: 0, vatAmount: 0 },
      salesExempt: { amount: 0, adjustmentAmount: 0, vatAmount: 0 },
      purchasesStandardRate: { amount: 0, adjustmentAmount: 0, vatAmount: 0 },
      purchasesExpenses: { amount: 0, adjustmentAmount: 0, vatAmount: 0 },
      purchasesZeroRate: { amount: 0, adjustmentAmount: 0, vatAmount: 0 },
      purchasesExempt: { amount: 0, adjustmentAmount: 0, vatAmount: 0 },
    };

    filteredInvoices.forEach((inv) => {
      const amount = inv.inv_amt || 0;
      const vatAmount = inv.tax || 0;
      const adjustmentAmount = inv.adjustment_amount || 0;

      // تصنيف حسب نوع المعاملة
      if (inv.trans_type === INVOICE_TYPES.SALES) {
        // فواتير البيع
        if (inv.vat_rate === 15) {
          data.salesStandardRate.amount += amount;
          data.salesStandardRate.adjustmentAmount += adjustmentAmount;
          data.salesStandardRate.vatAmount += vatAmount;
        } else if (inv.vat_rate === 0) {
          data.salesZeroRate.amount += amount;
          data.salesZeroRate.adjustmentAmount += adjustmentAmount;
          data.salesZeroRate.vatAmount += vatAmount;
        } else {
          data.salesExempt.amount += amount;
          data.salesExempt.adjustmentAmount += adjustmentAmount;
          data.salesExempt.vatAmount += vatAmount;
        }
      } else if (inv.trans_type === INVOICE_TYPES.PURCHASE) {
        // فواتير الشراء
        if (inv.vat_rate === 15) {
          // تصنيف المشتريات والمصروفات حسب نوع الفاتورة
          if (inv.inv_id && inv.inv_id.toString().includes("EXP")) {
            // مصروفات
            data.purchasesExpenses.amount += amount;
            data.purchasesExpenses.adjustmentAmount += adjustmentAmount;
            data.purchasesExpenses.vatAmount += vatAmount;
          } else {
            // مشتريات
            data.purchasesStandardRate.amount += amount;
            data.purchasesStandardRate.adjustmentAmount += adjustmentAmount;
            data.purchasesStandardRate.vatAmount += vatAmount;
          }
        } else if (inv.vat_rate === 0) {
          data.purchasesZeroRate.amount += amount;
          data.purchasesZeroRate.adjustmentAmount += adjustmentAmount;
          data.purchasesZeroRate.vatAmount += vatAmount;
        } else {
          data.purchasesExempt.amount += amount;
          data.purchasesExempt.adjustmentAmount += adjustmentAmount;
          data.purchasesExempt.vatAmount += vatAmount;
        }
      } else if (inv.trans_type === INVOICE_TYPES.SALES_RETURN) {
        // مردود البيع - يخصم من المبيعات
        if (inv.vat_rate === 15) {
          data.salesStandardRate.adjustmentAmount += Math.abs(amount);
          data.salesStandardRate.vatAmount -= Math.abs(vatAmount);
        } else if (inv.vat_rate === 0) {
          data.salesZeroRate.adjustmentAmount += Math.abs(amount);
          data.salesZeroRate.vatAmount -= Math.abs(vatAmount);
        } else {
          data.salesExempt.adjustmentAmount += Math.abs(amount);
          data.salesExempt.vatAmount -= Math.abs(vatAmount);
        }
      } else if (inv.trans_type === INVOICE_TYPES.PURCHASE_RETURN) {
        // مردود الشراء - يخصم من المشتريات
        if (inv.vat_rate === 15) {
          data.purchasesStandardRate.adjustmentAmount += Math.abs(amount);
          data.purchasesStandardRate.vatAmount -= Math.abs(vatAmount);
        } else if (inv.vat_rate === 0) {
          data.purchasesZeroRate.adjustmentAmount += Math.abs(amount);
          data.purchasesZeroRate.vatAmount -= Math.abs(vatAmount);
        } else {
          data.purchasesExempt.adjustmentAmount += Math.abs(amount);
          data.purchasesExempt.vatAmount -= Math.abs(vatAmount);
        }
      }
    });

    return data;
  }, [filteredInvoices]);

  // حساب الإجماليات
  const totals = useMemo(() => {
    const totalSalesAmount =
      vatReportData.salesStandardRate.amount +
      vatReportData.salesZeroRate.amount +
      vatReportData.salesExempt.amount;

    const totalSalesAdjustment =
      vatReportData.salesStandardRate.adjustmentAmount +
      vatReportData.salesZeroRate.adjustmentAmount +
      vatReportData.salesExempt.adjustmentAmount;

    const totalSalesVAT =
      vatReportData.salesStandardRate.vatAmount +
      vatReportData.salesZeroRate.vatAmount +
      vatReportData.salesExempt.vatAmount;

    const totalPurchasesAmount =
      vatReportData.purchasesStandardRate.amount +
      vatReportData.purchasesExpenses.amount +
      vatReportData.purchasesZeroRate.amount +
      vatReportData.purchasesExempt.amount;

    const totalPurchasesAdjustment =
      vatReportData.purchasesStandardRate.adjustmentAmount +
      vatReportData.purchasesExpenses.adjustmentAmount +
      vatReportData.purchasesZeroRate.adjustmentAmount +
      vatReportData.purchasesExempt.adjustmentAmount;

    const totalPurchasesVAT =
      vatReportData.purchasesStandardRate.vatAmount +
      vatReportData.purchasesExpenses.vatAmount +
      vatReportData.purchasesZeroRate.vatAmount +
      vatReportData.purchasesExempt.vatAmount;

    const netVAT = totalSalesVAT - totalPurchasesVAT;

    return {
      totalSalesAmount,
      totalSalesAdjustment,
      totalSalesVAT,
      totalPurchasesAmount,
      totalPurchasesAdjustment,
      totalPurchasesVAT,
      netVAT,
    };
  }, [vatReportData]);

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    toast.success("تم تصدير التقرير بنجاح");
  };

  const clearFilters = () => {
    setCostCenter("");
    setBranch("");
    setDateRange({
      start: new Date(new Date().getFullYear(), 0, 1)
        .toISOString()
        .split("T")[0],
      end: new Date().toISOString().split("T")[0],
    });
  };

  return (
    <div className="font-cairo space-y-4 p-4">
      <Breadcrumb />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            تقرير الضريبة المضافة
          </h1>
          <p className="text-gray-500 mt-1">
            تقرير ضريبة القيمة المضافة للمبيعات والمشتريات
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            startContent={<PrinterIcon className="h-4 w-4" />}
            variant="bordered"
            onPress={handlePrint}
          >
            طباعة
          </Button>
          <Button
            color="primary"
            startContent={<ArrowDownTrayIcon className="h-4 w-4" />}
            onPress={handleExport}
          >
            تصدير
          </Button>
        </div>
      </div>

      {/* الفلاتر */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Select
              className="input-field"
              placeholder="مركز التكلفة"
              selectedKeys={costCenter ? [costCenter] : []}
              onSelectionChange={(keys) =>
                setCostCenter(Array.from(keys)[0] as string)
              }
            >
              <SelectItem key="all">جميع مراكز التكلفة</SelectItem>
              <SelectItem key="center1">مركز التكلفة 1</SelectItem>
              <SelectItem key="center2">مركز التكلفة 2</SelectItem>
            </Select>

            <Select
              className="input-field"
              placeholder="الفرع"
              selectedKeys={branch ? [branch] : []}
              onSelectionChange={(keys) =>
                setBranch(Array.from(keys)[0] as string)
              }
            >
              <SelectItem key="all">جميع الفروع</SelectItem>
              <SelectItem key="branch1">الفرع الرئيسي</SelectItem>
              <SelectItem key="branch2">الفرع الفرعي</SelectItem>
            </Select>

            <Input
              className="input-field"
              placeholder="من تاريخ"
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, start: e.target.value }))
              }
            />

            <Input
              className="input-field"
              placeholder="إلى تاريخ"
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, end: e.target.value }))
              }
            />

            <Button
              className="btn-secondary"
              variant="bordered"
              onPress={clearFilters}
            >
              مسح الفلاتر
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* ملخص سريع */}
      <VATSummary
        netVAT={totals.netVAT}
        period={`${dateRange.start} - ${dateRange.end}`}
        totalInvoices={filteredInvoices.length}
        totalPurchasesVAT={totals.totalPurchasesVAT}
        totalSalesVAT={totals.totalSalesVAT}
      />

      {/* التبويبات */}
      <Tabs
        className="w-full"
        selectedKey={activeTab}
        onSelectionChange={(key) => setActiveTab(key as string)}
      >
        <Tab
          key="summary"
          title={
            <div className="flex items-center gap-2">
              <DocumentTextIcon className="h-4 w-4" />
              <span>التقرير الإجمالي</span>
            </div>
          }
        >
          {/* التقرير الإجمالي */}
          <div className="space-y-6">
            {/* ضريبة القيمة المضافة على المبيعات */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-green-600">
                  ضريبة القيمة المضافة على المبيعات
                </h3>
              </CardHeader>
              <CardBody>
                <Table aria-label="VAT on Sales">
                  <TableHeader>
                    <TableColumn>الوصف</TableColumn>
                    <TableColumn className="text-center">المبلغ</TableColumn>
                    <TableColumn className="text-center">
                      مبلغ التعديل (المرتجع)
                    </TableColumn>
                    <TableColumn className="text-center">
                      مبلغ الضريبة المضافة
                    </TableColumn>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>المبيعات الخاضعة للنسبة الأساسية</TableCell>
                      <TableCell className="text-center">
                        {formatAmount(
                          vatReportData.salesStandardRate.amount,
                          fractions.frac,
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {formatAmount(
                          vatReportData.salesStandardRate.adjustmentAmount,
                          fractions.frac,
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {formatAmount(
                          vatReportData.salesStandardRate.vatAmount,
                          fractions.frac,
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        المبيعات المحلية الخاضعة للنسبة الصفرية
                      </TableCell>
                      <TableCell className="text-center">
                        {formatAmount(
                          vatReportData.salesZeroRate.amount,
                          fractions.frac,
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {formatAmount(
                          vatReportData.salesZeroRate.adjustmentAmount,
                          fractions.frac,
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {formatAmount(
                          vatReportData.salesZeroRate.vatAmount,
                          fractions.frac,
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>المبيعات المعفاة من الضريبة</TableCell>
                      <TableCell className="text-center">
                        {formatAmount(
                          vatReportData.salesExempt.amount,
                          fractions.frac,
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {formatAmount(
                          vatReportData.salesExempt.adjustmentAmount,
                          fractions.frac,
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {formatAmount(
                          vatReportData.salesExempt.vatAmount,
                          fractions.frac,
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow className="font-bold bg-gray-50">
                      <TableCell>إجمالي المبيعات</TableCell>
                      <TableCell className="text-center">
                        {formatAmount(totals.totalSalesAmount, fractions.frac)}
                      </TableCell>
                      <TableCell className="text-center">
                        {formatAmount(
                          totals.totalSalesAdjustment,
                          fractions.frac,
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {formatAmount(totals.totalSalesVAT, fractions.frac)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardBody>
            </Card>

            {/* ضريبة القيمة المضافة على المشتريات */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-blue-600">
                  ضريبة القيمة المضافة على المشتريات
                </h3>
              </CardHeader>
              <CardBody>
                <Table aria-label="VAT on Purchases">
                  <TableHeader>
                    <TableColumn>الوصف</TableColumn>
                    <TableColumn className="text-center">المبلغ</TableColumn>
                    <TableColumn className="text-center">
                      مبلغ التعديل (المرتجع)
                    </TableColumn>
                    <TableColumn className="text-center">
                      مبلغ الضريبة المضافة
                    </TableColumn>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>المشتريات الخاضعة للنسبة الأساسية</TableCell>
                      <TableCell className="text-center">
                        {formatAmount(
                          vatReportData.purchasesStandardRate.amount,
                          fractions.frac,
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {formatAmount(
                          vatReportData.purchasesStandardRate.adjustmentAmount,
                          fractions.frac,
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {formatAmount(
                          vatReportData.purchasesStandardRate.vatAmount,
                          fractions.frac,
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>المصروفات الخاضعة للنسبة الأساسية</TableCell>
                      <TableCell className="text-center">
                        {formatAmount(
                          vatReportData.purchasesExpenses.amount,
                          fractions.frac,
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {formatAmount(
                          vatReportData.purchasesExpenses.adjustmentAmount,
                          fractions.frac,
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {formatAmount(
                          vatReportData.purchasesExpenses.vatAmount,
                          fractions.frac,
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        المشتريات المحلية الخاضعة للنسبة الصفرية
                      </TableCell>
                      <TableCell className="text-center">
                        {formatAmount(
                          vatReportData.purchasesZeroRate.amount,
                          fractions.frac,
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {formatAmount(
                          vatReportData.purchasesZeroRate.adjustmentAmount,
                          fractions.frac,
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {formatAmount(
                          vatReportData.purchasesZeroRate.vatAmount,
                          fractions.frac,
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>المشتريات المعفاة من الضريبة</TableCell>
                      <TableCell className="text-center">
                        {formatAmount(
                          vatReportData.purchasesExempt.amount,
                          fractions.frac,
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {formatAmount(
                          vatReportData.purchasesExempt.adjustmentAmount,
                          fractions.frac,
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {formatAmount(
                          vatReportData.purchasesExempt.vatAmount,
                          fractions.frac,
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow className="font-bold bg-gray-50">
                      <TableCell>إجمالي المشتريات</TableCell>
                      <TableCell className="text-center">
                        {formatAmount(
                          totals.totalPurchasesAmount,
                          fractions.frac,
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {formatAmount(
                          totals.totalPurchasesAdjustment,
                          fractions.frac,
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {formatAmount(totals.totalPurchasesVAT, fractions.frac)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardBody>
            </Card>

            {/* إجمالي الضريبة المستحقة */}
            <Card>
              <CardBody>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-red-600 mb-2">
                    إجمالي الضريبة المستحقة
                  </h3>
                  <div className="text-3xl font-bold text-red-600">
                    {formatAmount(totals.netVAT, fractions.frac)}
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </Tab>

        <Tab
          key="detailed"
          title={
            <div className="flex items-center gap-2">
              <TableCellsIcon className="h-4 w-4" />
              <span>التقرير التفصيلي</span>
            </div>
          }
        >
          {/* التقرير التفصيلي */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">تفاصيل الفواتير</h3>
            </CardHeader>
            <CardBody>
              <Table aria-label="Detailed VAT Report">
                <TableHeader>
                  <TableColumn>رقم الفاتورة</TableColumn>
                  <TableColumn>التاريخ</TableColumn>
                  <TableColumn>العميل/المورد</TableColumn>
                  <TableColumn>النوع</TableColumn>
                  <TableColumn className="text-center">المبلغ</TableColumn>
                  <TableColumn className="text-center">الضريبة</TableColumn>
                  <TableColumn className="text-center">
                    نسبة الضريبة
                  </TableColumn>
                  <TableColumn className="text-center">التعديل</TableColumn>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((inv) => (
                    <TableRow key={inv.inv_id}>
                      <TableCell>{inv.inv_id}</TableCell>
                      <TableCell>{formatDateTime(inv.inv_date)}</TableCell>
                      <TableCell>{inv.cust_name}</TableCell>
                      <TableCell>
                        <Chip
                          color={
                            getInvoiceTypeColor(inv.trans_type) as ChipProps["color"]
                          }
                          size="sm"
                        >
                          {getInvoiceTypeLabel(inv.trans_type)}
                        </Chip>
                      </TableCell>
                      <TableCell className="text-center">
                        {formatAmount(inv.inv_amt || 0, fractions.frac)}
                      </TableCell>
                      <TableCell className="text-center">
                        {formatAmount(inv.tax || 0, fractions.frac)}
                      </TableCell>
                      <TableCell className="text-center">
                        {inv.vat_rate || 0}%
                      </TableCell>
                      <TableCell className="text-center">
                        {formatAmount(
                          inv.adjustment_amount || 0,
                          fractions.frac,
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
}
