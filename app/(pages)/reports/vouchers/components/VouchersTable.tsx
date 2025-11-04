/**
 * Vouchers Table Component
 * مكون جدول السندات
 */

"use client";

import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Chip,
  Tooltip,
} from "@heroui/react";
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PrinterIcon,
} from "@heroicons/react/24/outline";
import { Voucher } from "@/types/voucher";
import { formatAmount } from "@/utilities/formatAmount";
import { getVoucherTypeName } from "@/utilities/voucher/routing";
import { formatVoucherDate } from "@/utilities/voucher/formatting";

interface VouchersTableProps {
  vouchers: Voucher[];
  onView: (voucher: Voucher) => void;
  onEdit: (voucher: Voucher) => void;
  onDelete: (voucher: Voucher) => void;
  onPrint?: (voucher: Voucher) => void;
  calculateVoucherCashTotal: (voucher: Voucher) => number;
  calculateVoucherGoldTotal: (voucher: Voucher) => number;
}

export default function VouchersTable({
  vouchers,
  onView,
  onEdit,
  onDelete,
  onPrint,
  calculateVoucherCashTotal,
  calculateVoucherGoldTotal,
}: VouchersTableProps) {
  const getStatusChip = (status?: number) => {
    const colorMap: Record<number, "success" | "warning" | "default"> = {
      0: "default",
      1: "success",
      2: "warning",
    };
    const color = colorMap[status ?? 1] || "default";
    const label = status === 1 ? "مفتوح" : status === 2 ? "مغلق" : "غير محدد";

    return (
      <Chip color={color} size="sm">
        {label}
      </Chip>
    );
  };

  return (
    <Table>
      <TableHeader>
        <TableColumn>رقم السند</TableColumn>
        <TableColumn>التاريخ</TableColumn>
        <TableColumn>نوع السند</TableColumn>
        <TableColumn>المبلغ (نقدي)</TableColumn>
        <TableColumn>الجرام (ذهب)</TableColumn>
        <TableColumn>البيان</TableColumn>
        <TableColumn>الحالة</TableColumn>
        <TableColumn>إجراءات</TableColumn>
      </TableHeader>
      <TableBody>
        {vouchers.map((voucher, index) => (
          <TableRow
            key={
              voucher.id ||
              `voucher-${voucher.vouch_id}-${voucher.vouch_type}-${index}`
            }
          >
            <TableCell>
              <span className="font-semibold">{voucher.vouch_id}</span>
            </TableCell>
            <TableCell>{formatVoucherDate(voucher.vouch_date)}</TableCell>
            <TableCell>
              <Chip color="primary" size="sm">
                {getVoucherTypeName(voucher.vouch_type || 0)}
              </Chip>
            </TableCell>
            <TableCell>
              <span className="font-semibold text-green-600">
                {formatAmount(calculateVoucherCashTotal(voucher))}
              </span>
            </TableCell>
            <TableCell>
              <span className="font-semibold text-yellow-600 flex items-center gap-1">
                {formatAmount(calculateVoucherGoldTotal(voucher))}
                <span className="text-xs text-yellow-500">جم</span>
              </span>
            </TableCell>
            <TableCell>
              <span className="truncate max-w-xs block">
                {voucher.vouch_notes || "-"}
              </span>
            </TableCell>
            <TableCell>{getStatusChip(voucher.vouch_status)}</TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Tooltip content="عرض">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={() => onView(voucher)}
                  >
                    <EyeIcon className="h-4 w-4 text-blue-500" />
                  </Button>
                </Tooltip>
                <Tooltip content="تعديل">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={() => onEdit(voucher)}
                  >
                    <PencilIcon className="h-4 w-4 text-yellow-500" />
                  </Button>
                </Tooltip>
                {onPrint && (
                  <Tooltip content="طباعة">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => onPrint(voucher)}
                    >
                      <PrinterIcon className="h-4 w-4 text-gray-600" />
                    </Button>
                  </Tooltip>
                )}
                <Tooltip content="حذف">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={() => onDelete(voucher)}
                  >
                    <TrashIcon className="h-4 w-4 text-red-500" />
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

