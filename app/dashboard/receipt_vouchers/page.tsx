"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  Chip,
  Tooltip,
  Pagination,
} from "@heroui/react";
import { Card, CardBody, CardHeader } from "@/components/Card";
import {
  FaSearch,
  FaPrint,
  FaEye,
  FaEdit,
  FaTrash,
  FaPlus,
  FaFilter,
  FaDownload,
} from "react-icons/fa";
import { Voucher } from "@/types/voucher";
import { API_ENDPOINTS, fetchData } from "@/utilities/api";
import { formatAmount } from "@/utilities/formatAmount";
import { getCurrDate } from "@/utilities/getCurrDate";

interface VouchersTableProps {
  vouchers: Voucher[];
  onView: (voucher: Voucher) => void;
  onEdit: (voucher: Voucher) => void;
  onDelete: (voucher: Voucher) => void;
  getStatusChip: (status?: number) => React.ReactNode;
}

const VouchersTable: React.FC<VouchersTableProps> = ({
  vouchers,
  onView,
  onEdit,
  onDelete,
  getStatusChip,
}) => {
  return (
    <Table aria-label="قائمة سندات القبض">
      <TableHeader>
        <TableColumn>رقم السند</TableColumn>
        <TableColumn>التاريخ</TableColumn>
        <TableColumn>المرجع</TableColumn>
        <TableColumn>المبلغ</TableColumn>
        <TableColumn>البيان</TableColumn>
        <TableColumn>الحالة</TableColumn>
        <TableColumn>الإجراءات</TableColumn>
      </TableHeader>
      <TableBody>
        {vouchers.map((voucher) => (
          <TableRow key={voucher.vouch_id}>
            <TableCell>{voucher.vouch_id}</TableCell>
            <TableCell>{voucher.vouch_date}</TableCell>
            <TableCell>{voucher.ref_no || '-'}</TableCell>
            <TableCell>{formatAmount(voucher.vouch_amt)}</TableCell>
            <TableCell>{voucher.vouch_notes || '-'}</TableCell>
            <TableCell>{getStatusChip(voucher.vouch_status)}</TableCell>
            <TableCell>
              <div className="flex space-x-2 space-x-reverse">
                <Tooltip content="عرض">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onClick={() => onView(voucher)}
                  >
                    <FaEye />
                  </Button>
                </Tooltip>
                <Tooltip content="تعديل">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onClick={() => onEdit(voucher)}
                  >
                    <FaEdit />
                  </Button>
                </Tooltip>
                <Tooltip content="حذف">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    color="danger"
                    onClick={() => onDelete(voucher)}
                  >
                    <FaTrash />
                  </Button>
                </Tooltip>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

interface VoucherStatus {
  id: number;
  stage_name: string;
  stage_name_e: string;
}

export default function ReceiptVouchersPage() {
  const router = useRouter();
  
  // State
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [voucherStatuses, setVoucherStatuses] = useState<VoucherStatus[]>([]);
  const [filteredVouchers, setFilteredVouchers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [vouchersData, statusesData] = await Promise.all([
        fetchData(API_ENDPOINTS.VOUCHERS_LIST),
        fetchData(API_ENDPOINTS.VoucherStageList),
      ]);

      // Filter only receipt vouchers (vouch_type = 1)
      const receiptVouchers = Array.isArray(vouchersData) ? 
        vouchersData.filter(v => v.vouch_type === 1) : [];
      
      setVouchers(receiptVouchers);
      setVoucherStatuses(Array.isArray(statusesData) ? statusesData : []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter vouchers based on search criteria
  useEffect(() => {
    let filtered = vouchers;

    // Filter by status
    if (selectedStatus !== "all") {
      filtered = filtered.filter(v => v.vouch_status?.toString() === selectedStatus);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(v => 
        v.vouch_id?.toString().includes(searchTerm) ||
        v.ref_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.vouch_notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by date range
    if (dateFrom) {
      filtered = filtered.filter(v => v.vouch_date >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter(v => v.vouch_date <= dateTo);
    }

    setFilteredVouchers(filtered);
    setPage(1);
  }, [vouchers, selectedStatus, searchTerm, dateFrom, dateTo]);

  // Pagination
  const pages = Math.ceil(filteredVouchers.length / rowsPerPage);
  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredVouchers.slice(start, end);
  }, [page, filteredVouchers, rowsPerPage]);

  // Calculate totals
  const totalAmount = useMemo(() => {
    return filteredVouchers.reduce((sum, voucher) => sum + (voucher.vouch_amt || 0), 0);
  }, [filteredVouchers]);

  const openVouchers = useMemo(() => {
    return filteredVouchers.filter(v => v.vouch_status === 1).length;
  }, [filteredVouchers]);

  const closedVouchers = useMemo(() => {
    return filteredVouchers.filter(v => v.vouch_status === 2).length;
  }, [filteredVouchers]);

  const cancelledVouchers = useMemo(() => {
    return filteredVouchers.filter(v => v.vouch_status === 3).length;
  }, [filteredVouchers]);

  // Event handlers
  const handleView = (voucher: Voucher) => {
    router.push(`/dashboard/forms/receipt_voucher?id=${voucher.vouch_id}`);
  };

  const handleEdit = (voucher: Voucher) => {
    router.push(`/dashboard/forms/receipt_voucher?id=${voucher.vouch_id}`);
  };

  const handleDelete = async (voucher: Voucher) => {
    if (!confirm("هل أنت متأكد من حذف هذا السند؟")) {
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.DELETE_VOUCHER(voucher.vouch_id), {
        method: 'DELETE',
      });

      if (response.ok) {
        alert("تم حذف السند بنجاح");
        loadData();
      } else {
        alert("فشل في حذف السند");
      }
    } catch (error) {
      console.error("Error deleting voucher:", error);
      alert("حدث خطأ أثناء حذف السند");
    }
  };

  const handleAddNew = () => {
    router.push("/dashboard/forms/receipt_voucher");
  };

  const getStatusChip = (status?: number) => {
    const statusItem = voucherStatuses.find(s => s.id === status);
    if (!statusItem) return <Chip color="default">غير محدد</Chip>;
    
    const colorMap: { [key: string]: any } = {
      'مفتوح': 'warning',
      'مغلق': 'success',
      'ملغي': 'danger'
    };
    
    return <Chip color={colorMap[statusItem.stage_name] || 'default'}>{statusItem.stage_name}</Chip>;
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">سندات القبض</h1>
            <Button color="primary" onClick={handleAddNew}>
              <FaPlus className="ml-2" />
              إضافة سند جديد
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <div className="text-center">
              <h3 className="text-lg font-semibold">إجمالي السندات</h3>
              <p className="text-2xl text-blue-600">{filteredVouchers.length}</p>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <div className="text-center">
              <h3 className="text-lg font-semibold">إجمالي المبالغ</h3>
              <p className="text-2xl text-green-600">{formatAmount(totalAmount)}</p>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <div className="text-center">
              <h3 className="text-lg font-semibold">السندات المفتوحة</h3>
              <p className="text-2xl text-warning">{openVouchers}</p>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <div className="text-center">
              <h3 className="text-lg font-semibold">السندات المغلقة</h3>
              <p className="text-2xl text-success">{closedVouchers}</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">البحث:</label>
              <Input
                placeholder="بحث في رقم السند، المرجع، البيان..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                startContent={<FaSearch />}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">الحالة:</label>
              <Select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <SelectItem key="all">جميع الحالات</SelectItem>
                {voucherStatuses.map(status => (
                  <SelectItem key={status.id}>
                    {status.stage_name}
                  </SelectItem>
                ))}
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">من تاريخ:</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">إلى تاريخ:</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Vouchers Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">قائمة سندات القبض</h3>
            <div className="flex space-x-2 space-x-reverse">
              <Button size="sm" variant="light">
                <FaDownload className="ml-2" />
                تصدير
              </Button>
              <Button size="sm" variant="light">
                <FaPrint className="ml-2" />
                طباعة
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <div className="text-center py-8">
              <p>جاري التحميل...</p>
            </div>
          ) : (
            <>
              <VouchersTable
                vouchers={items}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
                getStatusChip={getStatusChip}
              />
              
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-gray-500">
                  عرض {((page - 1) * rowsPerPage) + 1} إلى {Math.min(page * rowsPerPage, filteredVouchers.length)} من {filteredVouchers.length} سند
                </div>
                
                <Pagination
                  total={pages}
                  page={page}
                  onChange={setPage}
                  showControls
                  showShadow
                  color="primary"
                />
              </div>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
