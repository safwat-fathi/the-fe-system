import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import Link from "next/link";
import { Button } from "@heroui/react";
import { EyeIcon, PencilIcon } from "@heroicons/react/24/outline";

import { formatDateTime } from "@/utilities/dateUtils";
import { formatAmount } from "@/utilities/formatAmount";
import { Invoice, TransTypes } from "@/types/models/invoice";
import { TRANS_TYPE_META } from "@/types/constants/invoice";
import { Fractions } from "@/utilities/useFractions";

const columnHelper = createColumnHelper<Invoice>();

const TRANS_TYPE_TO_FORM_TYPE: Record<
  TransTypes,
  "sale" | "purchase" | "sale-return" | "purchase-return"
> = {
  [TransTypes.SALES]: "sale",
  [TransTypes.PURCHASE]: "purchase",
  [TransTypes.SALES_RETURN]: "sale-return",
  [TransTypes.PURCHASE_RETURN]: "purchase-return",
};

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
      const transType = Number(row.original.trans_type) as TransTypes;
      const typeMeta = TRANS_TYPE_META[transType];

      return <span>{typeMeta?.label ?? "غير محدد"}</span>;
    },
  }),
  columnHelper.display({
    id: "actions",
    header: () => "الإجراءات",
    cell: ({ row }) => {
      const transType = Number(row.original.trans_type) as TransTypes;
      const formType = TRANS_TYPE_TO_FORM_TYPE[transType] ?? "sale";
      const invoiceIdentifier = row.original.inv_id ?? row.original.id ?? "";

      const searchParams = new URLSearchParams({
        type: formType,
        mode: "preview",
      });

      if (invoiceIdentifier) {
        searchParams.set("id", String(invoiceIdentifier));
      }

      const previewHref = `/forms/invoices?${searchParams.toString()}`;

      const editParams = new URLSearchParams({
        type: formType,
        mode: "edit",
        edit: "true",
      });

      if (invoiceIdentifier) {
        editParams.set("id", String(invoiceIdentifier));
      }

      const editHref = `/forms/invoices?${editParams.toString()}`;

      return (
        <div className="flex gap-2">
          <Link href={previewHref}>
            <Button isIconOnly size="sm" variant="light">
              <EyeIcon className="h-4 w-4 text-blue-500" />
            </Button>
          </Link>
          <Link href={editHref}>
            <Button isIconOnly size="sm" variant="light">
              <PencilIcon className="h-4 w-4 text-yellow-500" />
            </Button>
          </Link>
        </div>
      );
    },
  }),
];
