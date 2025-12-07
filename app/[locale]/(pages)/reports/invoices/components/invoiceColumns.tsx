import { createColumnHelper } from "@tanstack/react-table";
import Link from "next/link";
import { Button } from "@heroui/react";
import { EyeIcon, PencilIcon } from "@heroicons/react/24/outline";

import { formatDateTime } from "@/utilities/dateUtils";
import { formatAmount } from "@/utilities/formatAmount";
import { Invoice, TransTypes } from "@/types/models/invoice";
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

const TRANS_TYPE_TO_LABEL_KEY: Record<
  TransTypes,
  "sale" | "purchase" | "saleReturn" | "purchaseReturn"
> = {
  [TransTypes.SALES]: "sale",
  [TransTypes.PURCHASE]: "purchase",
  [TransTypes.SALES_RETURN]: "saleReturn",
  [TransTypes.PURCHASE_RETURN]: "purchaseReturn",
};

type InvoiceColumnMessages = {
  columns: {
    invoiceNumber: string;
    dateTime: string;
    customer: string;
    total: string;
    tax: string;
    grandTotal: string;
    type: string;
    actions: string;
  };
  typeLabels: {
    sale: string;
    purchase: string;
    saleReturn: string;
    purchaseReturn: string;
    unknown: string;
  };
  actionLabels: {
    preview: string;
    edit: string;
  };
};

export const createInvoiceColumns = (
  fractions: Fractions,
  messages: InvoiceColumnMessages,
) => [
  columnHelper.accessor("inv_id", {
    header: () => messages.columns.invoiceNumber,
    cell: (info) => info.getValue(),
    enableSorting: true,
  }),
  columnHelper.accessor("inv_date", {
    header: () => messages.columns.dateTime,
    cell: (info) => formatDateTime(info.getValue()),
    enableSorting: true,
  }),
  columnHelper.accessor("cust_name", {
    header: () => messages.columns.customer,
    cell: (info) => info.getValue(),
    enableSorting: true,
  }),
  columnHelper.accessor("inv_net", {
    header: () => messages.columns.total,
    cell: (info) => formatAmount(Number(info.getValue() || 0), fractions.frac),
    enableSorting: true,
  }),
  columnHelper.accessor("tax", {
    header: () => messages.columns.tax,
    cell: (info) => formatAmount(Number(info.getValue() || 0), fractions.frac),
    enableSorting: true,
  }),
  columnHelper.accessor("inv_amt", {
    header: () => messages.columns.grandTotal,
    cell: (info) => formatAmount(Number(info.getValue() || 0), fractions.frac),
    enableSorting: true,
  }),
  columnHelper.accessor(
    (row) => {
      const transType = Number(row.trans_type) as TransTypes;
      const labelKey = TRANS_TYPE_TO_LABEL_KEY[transType];

      return labelKey
        ? messages.typeLabels[labelKey]
        : messages.typeLabels.unknown;
    },
    {
      id: "type",
      header: () => messages.columns.type,
      cell: (info) => info.getValue(),
      enableSorting: false,
    },
  ),
  columnHelper.display({
    id: "actions",
    header: () => messages.columns.actions,
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
      });

      if (invoiceIdentifier) {
        editParams.set("id", String(invoiceIdentifier));
      }

      const editHref = `/forms/invoices?${editParams.toString()}`;

      return (
        <div className="flex gap-2">
          <Link href={previewHref}>
            <Button
              isIconOnly
              aria-label={messages.actionLabels.preview}
              size="sm"
              variant="light"
            >
              <EyeIcon className="h-4 w-4 text-blue-500" />
            </Button>
          </Link>
          <Link href={editHref}>
            <Button
              isIconOnly
              aria-label={messages.actionLabels.edit}
              size="sm"
              variant="light"
            >
              <PencilIcon className="h-4 w-4 text-yellow-500" />
            </Button>
          </Link>
        </div>
      );
    },
  }),
];
