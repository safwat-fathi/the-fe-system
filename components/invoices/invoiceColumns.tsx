import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import Link from "next/link";
import { Button, Chip } from "@heroui/react";
import { EyeIcon, PencilIcon } from "@heroicons/react/24/outline";

import { formatDateTime } from "@/utilities/dateUtils";
import { formatAmount } from "@/utilities/formatAmount";
import { Invoice } from "@/types/models/invoice";
import { TRANS_TYPE_META } from "@/types/constants/invoice";
import { Fractions } from "@/utilities/useFractions";

const columnHelper = createColumnHelper<Invoice>();

export const createInvoiceColumns = (
  fractions: Fractions,
): ColumnDef<Invoice>[] => [
  columnHelper.accessor("inv_id", {
    header: () => "رقم الفاتورة",
    cell: (info) => info.getValue(),
    enableSorting: true,
  }),
  columnHelper.accessor("inv_date", {
    header: () => "التاريخ والوقت",
    cell: (info) => formatDateTime(info.getValue()),
    enableSorting: true,
  }),
  columnHelper.accessor("cust_name", {
    header: () => "العميل",
    cell: (info) => info.getValue(),
    enableSorting: true,
  }),
  columnHelper.accessor("inv_net", {
    header: () => "الإجمالي",
    cell: (info) => formatAmount(Number(info.getValue() || 0), fractions.frac),
    enableSorting: true,
  }),
  columnHelper.accessor("tax", {
    header: () => "الضريبة",
    cell: (info) => formatAmount(Number(info.getValue() || 0), fractions.frac),
    enableSorting: true,
  }),
  columnHelper.accessor("inv_amt", {
    header: () => "الإجمالي شامل الضريبة",
    cell: (info) => formatAmount(Number(info.getValue() || 0), fractions.frac),
    enableSorting: true,
  }),
  columnHelper.display({
    id: "type",
    header: () => "النوع",
    cell: ({ row }) => {
      const typeMeta = TRANS_TYPE_META[row.original.trans_type];
      return (
        <Chip color={typeMeta?.color ?? "default"} size="sm">
          {typeMeta?.label ?? "غير محدد"}
        </Chip>
      );
    },
  }),
  columnHelper.display({
    id: "actions",
    header: () => "الإجراءات",
    cell: ({ row }) => (
      <div className="flex gap-2">
        <Link href={`/forms/invoices/sale/${row.original.inv_id}`}>
          <Button isIconOnly size="sm" variant="light">
            <EyeIcon className="h-4 w-4 text-blue-500" />
          </Button>
        </Link>
        <Link href={`/forms/invoices/sale/${row.original.inv_id}`}>
          <Button isIconOnly size="sm" variant="light">
            <PencilIcon className="h-4 w-4 text-yellow-500" />
          </Button>
        </Link>
      </div>
    ),
  }),
];
