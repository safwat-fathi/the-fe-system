"use client";

import { useState, useMemo } from "react";
import {
  Button,
  Card,
  CardBody,
  Input,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Checkbox,
} from "@heroui/react";
import {
  ArrowPathIcon,
  PrinterIcon,
  EyeIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import { formatAmount } from "@/utilities/formatAmount";
import { formatDate } from "@/utilities/dateUtils";

const getCurrentDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getMonthStartDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}-01`;
};

interface TaxJournalEntry {
  documentNumber: string;
  documentType: string;
  issueDate: string;
  description: string;
  debitAmount: number;
  creditAmount: number;
  standardRate: number;
  zeroRate: number;
  exempt: number;
}

export default function TaxDailyJournalClient() {
  const [startDate, setStartDate] = useState(getMonthStartDate());
  const [endDate, setEndDate] = useState(getCurrentDate());
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<TaxJournalEntry[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const handleSearch = async () => {
    setLoading(true);
    try {
      // TODO: جلب البيانات من API
      toast.success("تم جلب البيانات بنجاح");
      setEntries([]);
    } catch (error) {
      console.error("Error loading tax daily journal:", error);
      toast.error("حدث خطأ أثناء جلب البيانات");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStartDate(getMonthStartDate());
    setEndDate(getCurrentDate());
    setEntries([]);
    setSelectedRows(new Set());
  };

  const handlePrint = () => {
    window.print();
  };

  const pageTotals = useMemo(() => {
    return entries.reduce(
      (acc, entry) => ({
        debit: acc.debit + entry.debitAmount,
        credit: acc.credit + entry.creditAmount,
        standardRate: acc.standardRate + entry.standardRate,
        zeroRate: acc.zeroRate + entry.zeroRate,
        exempt: acc.exempt + entry.exempt,
      }),
      {
        debit: 0,
        credit: 0,
        standardRate: 0,
        zeroRate: 0,
        exempt: 0,
      },
    );
  }, [entries]);

  const netVAT = pageTotals.credit - pageTotals.debit;

  const getDocumentTypeColor = (type: string) => {
    if (type.includes("Invoice")) return "primary";
    if (type.includes("Credit")) return "warning";
    if (type.includes("Debit")) return "danger";

    return "default";
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardBody className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              label="من تاريخ"
              size="sm"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              label="إلى تاريخ"
              size="sm"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                className="flex-1"
                color="primary"
                isLoading={loading}
                size="md"
                startContent={<FunnelIcon className="h-4 w-4" />}
                onPress={handleSearch}
              >
                تصفية
              </Button>
              <Button
                color="danger"
                size="md"
                startContent={<ArrowPathIcon className="h-4 w-4" />}
                variant="bordered"
                onPress={handleReset}
              >
                إعادة تعيين
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Report Header */}
      <Card>
        <CardBody className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              دفتر اليومية الضريبية
            </h2>
            <p className="text-sm text-gray-500">
              من {startDate} إلى {endDate}
            </p>
          </div>

          {/* Report Table */}
          <div className="overflow-x-auto">
            <Table
              aria-label="Tax Daily Journal Table"
              selectedKeys={selectedRows}
              selectionMode="multiple"
              onSelectionChange={(keys) => setSelectedRows(keys as Set<string>)}
            >
              <TableHeader>
                <TableColumn>رقم المستند التجاري</TableColumn>
                <TableColumn>نوع المستند</TableColumn>
                <TableColumn>تاريخ الإصدار</TableColumn>
                <TableColumn>الوصف</TableColumn>
                <TableColumn>المبلغ المدين</TableColumn>
                <TableColumn>المبلغ الدائن</TableColumn>
                <TableColumn>المعدل القياسي</TableColumn>
                <TableColumn>ضريبة صفرية</TableColumn>
                <TableColumn>معفى من الضريبة</TableColumn>
                <TableColumn>الإجراءات</TableColumn>
              </TableHeader>
              <TableBody emptyContent="لا توجد بيانات">
                {entries.map((entry, _index) => (
                  <TableRow key={entry.documentNumber}>
                    <TableCell>
                      <Checkbox
                        isSelected={selectedRows.has(entry.documentNumber)}
                      />
                      {entry.documentNumber}
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={getDocumentTypeColor(entry.documentType)}
                        size="sm"
                        variant="flat"
                      >
                        {entry.documentType}
                      </Chip>
                    </TableCell>
                    <TableCell>{formatDate(entry.issueDate)}</TableCell>
                    <TableCell>{entry.description || "-"}</TableCell>
                    <TableCell>
                      {entry.debitAmount > 0 ? (
                        <span className="text-red-600">
                          {formatAmount(entry.debitAmount, 2)}
                        </span>
                      ) : (
                        formatAmount(0, 2)
                      )}
                    </TableCell>
                    <TableCell>
                      {entry.creditAmount > 0 ? (
                        <span className="text-green-600">
                          {formatAmount(entry.creditAmount, 2)}
                        </span>
                      ) : (
                        formatAmount(0, 2)
                      )}
                    </TableCell>
                    <TableCell>{formatAmount(entry.standardRate, 2)}</TableCell>
                    <TableCell>{formatAmount(entry.zeroRate, 2)}</TableCell>
                    <TableCell>{formatAmount(entry.exempt, 2)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => handlePrint()}
                        >
                          <PrinterIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => {}}
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Page Totals */}
          {entries.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center text-sm font-medium text-gray-700">
                <span>إجماليات الصفحة</span>
                <div className="flex gap-8">
                  <span
                    className={pageTotals.credit > 0 ? "text-green-600" : ""}
                  >
                    {formatAmount(pageTotals.credit, 2)}
                  </span>
                  <span className={pageTotals.debit > 0 ? "text-red-600" : ""}>
                    {formatAmount(pageTotals.debit, 2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Summary Card */}
      {entries.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardBody className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600 mb-1">
                  صافي ضريبة القيمة المضافة المستحقة
                </p>
                <p
                  className={`text-xl font-bold ${netVAT < 0 ? "text-red-600" : "text-green-600"}`}
                >
                  {formatAmount(netVAT, 2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">دائن</p>
                <p className="text-xl font-bold text-green-600">
                  {formatAmount(pageTotals.credit, 2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">مدين</p>
                <p className="text-xl font-bold text-red-600">
                  {formatAmount(pageTotals.debit, 2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">الإجمالي</p>
                <p className="text-xl font-bold text-gray-800">
                  {entries.length} قيود
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
