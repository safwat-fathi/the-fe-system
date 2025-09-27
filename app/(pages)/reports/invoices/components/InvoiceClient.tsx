"use client";

import React, { useState } from "react";
import {
  Input,
  Pagination,
  Button,
  Chip,
  Select,
  SelectItem,
  Tabs,
  Tab,
  CardBody,
} from "@heroui/react";
import { parseAsString, parseAsInteger, useQueryStates } from "nuqs";
import Card from "@/components/Card";
import {
  EyeIcon,
  PencilIcon,
  FunnelIcon,
  ChartBarIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";

import { formatDateTime } from "@/utilities/dateUtils";
import { formatAmount } from "@/utilities/formatAmount";
import useFractions from "@/utilities/useFractions";
import DataTable from "@/components/DataTable";
import InvoiceAnalytics from "@/components/InvoiceAnalytics";
import Link from "next/link";
import { Invoice } from "@/types/models/invoice";
import { GetAllInvoicesParams } from "@/services/api/invoice.service";

interface InvoiceClientProps {
  invoices: Invoice[];
  totalInvoices: number;
  invoiceTypes: { key: string; label: string; color: string }[];
  invoiceStatuses: { key: string; label: string; color: string }[];
}

export default function InvoiceClient({
  invoices,
  totalInvoices,
  invoiceTypes,
}: InvoiceClientProps) {
  const fractions = useFractions() as { frac: number; frac2: number };

  const [params, setParams] = useQueryStates({
    search: parseAsString.withDefault(""),
    type: parseAsString.withDefault("all"),
    start_date: parseAsString.withDefault(""),
    end_date: parseAsString.withDefault(""),
    page: parseAsInteger.withDefault(1),
  });

  const [activeTab, setActiveTab] = useState("table");

  const columns = [
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
      render: (value: any, row: Invoice) => {
        let type = "";
        let color = "default";

        switch (row.trans_type) {
          case 1:
            type = "شراء";
            color = "primary";
            break;
          case 2:
            type = "بيع";
            color = "success";
            break;
          case 3:
            type = "مردود شراء";
            color = "warning";
            break;
          case 4:
            type = "مردود بيع";
            color = "danger";
            break;
          default:
            type = "غير محدد";
            color = "default";
        }

        return (
          <Chip color={color} size="sm">
            {type}
          </Chip>
        );
      },
    },
    {
      key: "actions",
      label: "الإجراءات",
      sortable: false,
      render: (value: any, row: Invoice) => (
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

  const clearFilters = () => {
    setParams({
      search: null,
      type: null,
      start_date: null,
      end_date: null,
      page: null,
    });
  };

  return (
    <>
      {/* الفلاتر */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Input
              placeholder="البحث بالرقم أو الاسم..."
              value={params.search}
              onChange={(e) => setParams({ search: e.target.value })}
              startContent={<FunnelIcon className="h-4 w-4" />}
              className="input-field"
            />

            <Select
              placeholder="نوع الفاتورة"
              selectedKeys={[params.type]}
              onSelectionChange={(keys) =>
                setParams({ type: Array.from(keys)[0] as string })
              }
              className="input-field"
            >
              {invoiceTypes.map((type) => (
                <SelectItem key={type.key} value={type.key}>
                  {type.label}
                </SelectItem>
              ))}
            </Select>

            <Input
              type="date"
              placeholder="من تاريخ"
              value={params.start_date}
              onChange={(e) => setParams({ start_date: e.target.value })}
              className="input-field"
            />

            <Input
              type="date"
              placeholder="إلى تاريخ"
              value={params.end_date}
              onChange={(e) => setParams({ end_date: e.target.value })}
              className="input-field"
            />

            <Button
              variant="bordered"
              onPress={clearFilters}
              className="btn-secondary"
            >
              مسح الفلاتر
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* التبويبات */}
      <Tabs
        selectedKey={activeTab}
        onSelectionChange={(key) => setActiveTab(key as string)}
        className="w-full"
      >
        <Tab
          key="table"
          title={
            <div className="flex items-center gap-2">
              <TableCellsIcon className="h-4 w-4" />
              <span>قائمة الفواتير</span>
            </div>
          }
        >
          {/* الجدول */}
          <DataTable
            columns={columns}
            data={invoices}
            title={`قائمة الفواتير (${totalInvoices} فاتورة)`}
            searchable={false}
            sortable={true}
            className="card"
          />
        </Tab>

        <Tab
          key="analytics"
          title={
            <div className="flex items-center gap-2">
              <ChartBarIcon className="h-4 w-4" />
              <span>التحليلات</span>
            </div>
          }
        >
          <InvoiceAnalytics invoices={invoices} />
        </Tab>
      </Tabs>
    </>
  );
}
