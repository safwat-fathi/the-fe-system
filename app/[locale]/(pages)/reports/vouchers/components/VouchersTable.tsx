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
import { useTranslations, useLocale } from "next-intl";

import { Voucher } from "@/types/voucher";
import { getVoucherTypeName } from "@/utilities/voucher/routing";
import { formatVoucherDate } from "@/utilities/voucher/formatting";
import { getLocaleDir } from "@/i18n/config";

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
  const t = useTranslations("reports.vouchers");
  const locale = useLocale();
  const dir = getLocaleDir(locale as "ar" | "en");
  const textAlignCenter = dir === "rtl" ? "text-center" : "text-center";

  const formatAmountValue = (value: number | null | undefined) =>
    Number(value ?? 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const getStatusChip = (status?: number | null) => {
    const colorMap: Record<number, "success" | "warning" | "default"> = {
      0: "default",
      1: "success",
      2: "warning",
    };
    const color = colorMap[status ?? 1] || "default";
    const label =
      status === 1
        ? t("table.status.open")
        : status === 2
          ? t("table.status.closed")
          : t("table.status.undefined");

    return (
      <Chip color={color} size="sm">
        {label}
      </Chip>
    );
  };

  return (
    <Table>
      <TableHeader>
        <TableColumn className={textAlignCenter}>
          {t("table.columns.voucherNumber")}
        </TableColumn>
        <TableColumn className={textAlignCenter}>
          {t("table.columns.date")}
        </TableColumn>
        <TableColumn className={textAlignCenter}>
          {t("table.columns.voucherType")}
        </TableColumn>
        <TableColumn className={textAlignCenter}>
          {t("table.columns.cashAmount")}
        </TableColumn>
        <TableColumn className={textAlignCenter}>
          {t("table.columns.goldAmount")}
        </TableColumn>
        <TableColumn className={textAlignCenter}>
          {t("table.columns.notes")}
        </TableColumn>
        <TableColumn className={textAlignCenter}>
          {t("table.columns.status")}
        </TableColumn>
        <TableColumn className={textAlignCenter}>
          {t("table.columns.actions")}
        </TableColumn>
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
                {formatAmountValue(calculateVoucherCashTotal(voucher))}
              </span>
            </TableCell>
            <TableCell>
              <span className="font-semibold text-yellow-600 flex items-center gap-1">
                {formatAmountValue(calculateVoucherGoldTotal(voucher))}
                <span className="text-xs text-yellow-500">
                  {t("table.goldUnit")}
                </span>
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
                <Tooltip content={t("table.actions.view")}>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={() => onView(voucher)}
                  >
                    <EyeIcon className="h-4 w-4 text-blue-500" />
                  </Button>
                </Tooltip>
                <Tooltip content={t("table.actions.edit")}>
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
                  <Tooltip content={t("table.actions.print")}>
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
                <Tooltip content={t("table.actions.delete")}>
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
