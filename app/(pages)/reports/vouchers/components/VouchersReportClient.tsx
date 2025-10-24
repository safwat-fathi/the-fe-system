"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Button,
  Select,
  SelectItem,
  Tabs,
  Tab,
  Chip,
  Tooltip,
  Pagination,
} from "@heroui/react";
import { CardBody, CardHeader } from "@heroui/react";
import {
  MagnifyingGlassIcon,
  PrinterIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";

import Card from "@/components/Card";
import { Voucher } from "@/types/voucher";
import { deleteVoucherAction } from "@/app/actions/voucher.action";
import { formatAmount } from "@/utilities/formatAmount";

// VouchersTable Component
interface VouchersTableProps {
  vouchers: Voucher[];
  onView: (voucher: Voucher) => void;
  onEdit: (voucher: Voucher) => void;
  onDelete: (voucher: Voucher) => void;
  getVoucherTypeName: (typeId: number) => string;
  getStatusChip: (status?: number) => React.ReactNode;
}

function VouchersTable({
  vouchers,
  onView,
  onEdit,
  onDelete,
  getVoucherTypeName,
  getStatusChip,
}: VouchersTableProps) {
  return (
    <Table aria-label="قائمة السندات">
      <TableHeader>
        <TableColumn>رقم السند</TableColumn>
        <TableColumn>التاريخ</TableColumn>
        <TableColumn>نوع السند</TableColumn>
        <TableColumn>المبلغ</TableColumn>
        <TableColumn>البيان</TableColumn>
        <TableColumn>الحالة</TableColumn>
        <TableColumn>إجراءات</TableColumn>
      </TableHeader>
      <TableBody>
        {vouchers.map((voucher) => (
          <TableRow key={voucher.vouch_id}>
            <TableCell>
              <span className="font-semibold">{voucher.vouch_id}</span>
            </TableCell>
            <TableCell>{voucher.vouch_date}</TableCell>
            <TableCell>
              <Chip color="primary" size="sm">
                {getVoucherTypeName(voucher.vouch_type || 0)}
              </Chip>
            </TableCell>
            <TableCell>
              <span className="font-semibold text-green-600">
                {formatAmount(voucher.vouch_amt || 0)}
              </span>
            </TableCell>
            <TableCell>
              <span className="truncate max-w-xs block">
                {voucher.vouch_notes || "-"}
              </span>
            </TableCell>
            <TableCell>{getStatusChip(voucher.vouch_status)}</TableCell>
            <TableCell>
              <div className="flex gap-1">
                <Tooltip content="عرض">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={() => onView(voucher)}
                  >
                    <EyeIcon className="h-4 w-4" />
                  </Button>
                </Tooltip>
                <Tooltip content="تعديل">
                  <Button
                    isIconOnly
                    color="primary"
                    size="sm"
                    variant="light"
                    onPress={() => onEdit(voucher)}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                </Tooltip>
                <Tooltip content="حذف">
                  <Button
                    isIconOnly
                    color="danger"
                    size="sm"
                    variant="light"
                    onPress={() => onDelete(voucher)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </Tooltip>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

interface VoucherType {
  id: number;
  type_name: string;
  type_name_e: string;
  type_desc?: string;
}

interface VouchersReportClientProps {
  initialVouchers: Voucher[];
  initialVoucherTypes: VoucherType[];
}

const VouchersReportClient = ({
  initialVouchers,
  initialVoucherTypes,
}: VouchersReportClientProps) => {
  const router = useRouter();

  // State
  const [vouchers, setVouchers] = useState<Voucher[]>(initialVouchers);
  const [voucherTypes, setVoucherTypes] =
    useState<VoucherType[]>(initialVoucherTypes);
  const [filteredVouchers, setFilteredVouchers] =
    useState<Voucher[]>(initialVouchers);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);

  // Filter vouchers based on search criteria
  useEffect(() => {
    let filtered = vouchers;

    // Filter by type
    if (selectedType !== "all") {
      filtered = filtered.filter(
        (v) => v.vouch_type?.toString() === selectedType,
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (v) =>
          v.vouch_id?.toString().includes(searchTerm) ||
          v.ref_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.vouch_notes?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Filter by date range
    if (dateFrom) {
      filtered = filtered.filter((v) => v.vouch_date >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter((v) => v.vouch_date <= dateTo);
    }

    setFilteredVouchers(filtered);
    setPage(1);
  }, [vouchers, selectedType, searchTerm, dateFrom, dateTo]);

  // Pagination
  const pages = Math.ceil(filteredVouchers.length / rowsPerPage);
  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredVouchers.slice(start, end);
  }, [page, filteredVouchers, rowsPerPage]);

  // Get voucher type name
  const getVoucherTypeName = (typeId: number) => {
    const type = voucherTypes.find((t) => t.id === typeId);

    return type?.type_name || `نوع ${typeId}`;
  };

  // Get vouchers by type
  const getVouchersByType = (typeId: number) => {
    return filteredVouchers.filter((v) => v.vouch_type === typeId);
  };

  // Get vouchers for specific types (سند قبض، سند صرف، قيد تسوية)
  const receiptVouchers = getVouchersByType(1); // سند قبض
  const paymentVouchers = getVouchersByType(2); // سند صرف
  const adjustmentVouchers = getVouchersByType(3); // قيد تسوية

  // Get voucher status chip
  const getStatusChip = (status?: number) => {
    switch (status) {
      case 1:
        return (
          <Chip color="success" size="sm">
            مفتوح
          </Chip>
        );
      case 2:
        return (
          <Chip color="warning" size="sm">
            مغلق
          </Chip>
        );
      default:
        return (
          <Chip color="default" size="sm">
            غير محدد
          </Chip>
        );
    }
  };

  // Handle actions
  const handleView = (voucher: Voucher) => {
    router.push(`/forms/voucher/${voucher.vouch_id}`);
  };

  const handleEdit = (voucher: Voucher) => {
    router.push(`/forms/voucher/${voucher.vouch_id}`);
  };

  const handleDelete = async (voucher: Voucher) => {
    if (confirm("هل أنت متأكد من حذف هذا السند؟")) {
      try {
        if (!voucher.vouch_id) return;

        const result = await deleteVoucherAction(voucher.vouch_id);

        if (result.success) {
          alert(result.message);
          // إعادة تحميل الصفحة لتحديث البيانات
          router.refresh();
        } else {
          alert(result.message);
        }
      } catch (error) {
        console.error("Error deleting voucher:", error);
        alert("حدث خطأ أثناء حذف السند");
      }
    }
  };

  const handleNewVoucher = () => {
    router.push("/forms/voucher");
  };

  // Calculate totals
  const calculateTotals = () => {
    return filteredVouchers.reduce(
      (acc, voucher) => {
        acc.totalAmount += voucher.vouch_amt || 0;
        acc.totalCount += 1;

        return acc;
      },
      { totalAmount: 0, totalCount: 0 },
    );
  };

  const totals = calculateTotals();

  return (
    <div className="font-cairo p-4 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-2xl font-bold mt-2">تقرير السندات</h1>
          <div className="flex gap-2">
            <Button
              color="primary"
              startContent={<PlusIcon className="h-4 w-4" />}
              onPress={handleNewVoucher}
            >
              سند جديد
            </Button>
            <Button
              color="secondary"
              startContent={<PrinterIcon className="h-4 w-4" />}
            >
              طباعة
            </Button>
            <Button
              color="success"
              startContent={<ArrowDownTrayIcon className="h-4 w-4" />}
            >
              تصدير
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Input
                placeholder="بحث..."
                startContent={
                  <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Select
                placeholder="نوع السند"
                selectedKeys={selectedType !== "all" ? [selectedType] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;

                  setSelectedType(selected || "all");
                }}
              >
                <SelectItem key="all">جميع الأنواع</SelectItem>
                {voucherTypes.map((type) => (
                  <SelectItem key={type.id.toString()}>
                    {type.type_name}
                  </SelectItem>
                ))}
              </Select>
              <Input
                placeholder="من تاريخ"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
              <Input
                placeholder="إلى تاريخ"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Vouchers Table with Tabs */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">قائمة السندات</h3>
        </CardHeader>
        <CardBody>
          <Tabs aria-label="أنواع السندات" color="primary" variant="underlined">
            <Tab key="all" title={`جميع السندات (${filteredVouchers.length})`}>
              <VouchersTable
                getStatusChip={getStatusChip}
                getVoucherTypeName={getVoucherTypeName}
                vouchers={items}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onView={handleView}
              />
            </Tab>
            <Tab
              key="receipt"
              title={`سندات القبض (${receiptVouchers.length})`}
            >
              <VouchersTable
                getStatusChip={getStatusChip}
                getVoucherTypeName={getVoucherTypeName}
                vouchers={receiptVouchers}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onView={handleView}
              />
            </Tab>
            <Tab
              key="payment"
              title={`سندات الصرف (${paymentVouchers.length})`}
            >
              <VouchersTable
                getStatusChip={getStatusChip}
                getVoucherTypeName={getVoucherTypeName}
                vouchers={paymentVouchers}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onView={handleView}
              />
            </Tab>
            <Tab
              key="adjustment"
              title={`قيود التسوية (${adjustmentVouchers.length})`}
            >
              <VouchersTable
                getStatusChip={getStatusChip}
                getVoucherTypeName={getVoucherTypeName}
                vouchers={adjustmentVouchers}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onView={handleView}
              />
            </Tab>
          </Tabs>

          {/* Pagination for main table */}
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-600">
              عرض {(page - 1) * rowsPerPage + 1} إلى{" "}
              {Math.min(page * rowsPerPage, filteredVouchers.length)} من{" "}
              {filteredVouchers.length} سند
            </div>
            <Pagination
              showControls
              showShadow
              page={page}
              total={pages}
              onChange={setPage}
            />
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default VouchersReportClient;

