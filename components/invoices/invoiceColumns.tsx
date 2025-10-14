"use client";

import Link from "next/link";
import { Button, Chip } from "@heroui/react";
import { EyeIcon, PencilIcon } from "@heroicons/react/24/outline";

import { formatDateTime } from "@/utilities/dateUtils";
import { formatAmount } from "@/utilities/formatAmount";
import { Invoice } from "@/types/models/invoice";
import { TRANS_TYPE_META } from "@/types/constants/invoice";
import { Fractions } from "@/utilities/useFractions";

export const createInvoiceColumns = (fractions: Fractions) => [
  { key: "inv_id", label: "رقم الفاتورة", sortable: true },
  {
    key: "inv_date",
    label: "التاريخ والوقت",
    sortable: true,
    render: (value: string) => formatDateTime(value),
  },
  { key: "cust_name", label: "العميل", sortable: true },
  {
    key: "inv_net",
    label: "الإجمالي",
    sortable: true,
    render: (value: number) => formatAmount(value, fractions.frac),
  },
  {
    key: "tax",
    label: "الضريبة",
    sortable: true,
    render: (value: number) => formatAmount(value, fractions.frac),
  },
  {
    key: "inv_amt",
    label: "الإجمالي شامل الضريبة",
    sortable: true,
    render: (value: number) => formatAmount(value, fractions.frac),
  },
  {
    key: "type",
    label: "النوع",
    sortable: false,
    render: (_value: unknown, row: Invoice) => {
      const typeMeta = TRANS_TYPE_META[row.trans_type];
      return (
        <Chip color={typeMeta?.color ?? "default"} size="sm">
          {typeMeta?.label ?? "غير محدد"}
        </Chip>
      );
    },
  },
  {
    key: "actions",
    label: "الإجراءات",
    sortable: false,
    render: (_value: unknown, row: Invoice) => (
      <div className="flex gap-2">
        <Link href={`/forms/invoices/sale/${row.inv_id}`}>
          <Button isIconOnly size="sm" variant="light">
            <EyeIcon className="h-4 w-4 text-blue-500" />
          </Button>
        </Link>
        <Link href={`/forms/invoices/sale/${row.inv_id}`}>
          <Button isIconOnly size="sm" variant="light">
            <PencilIcon className="h-4 w-4 text-yellow-500" />
          </Button>
        </Link>
      </div>
    ),
  },
];
