"use client";

import React, { useEffect, useState } from "react";
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
import { Invoice, InvoiceTypes, TransTypes } from "@/types/models/invoice";
import { useQueryParams } from "@/utilities/hooks/useQueryParams";
import { GetAllInvoicesParams } from "@/services/api/invoice.service";

interface InvoiceClientProps {
  invoices: Invoice[];
  totalInvoices: number;
}

// أنواع الفواتير
const INVOICE_TYPES = [
  { key: "0", label: "جميع الفواتير", color: "default" },
  { key: TransTypes.PURCHASE, label: "فواتير الشراء", color: "primary" },
  { key: TransTypes.SALES, label: "فواتير البيع", color: "success" },
  { key: TransTypes.PURCHASE_RETURN, label: "مردود الشراء", color: "warning" },
  { key: TransTypes.SALES_RETURN, label: "مردود البيع", color: "danger" },
];

// حالات الفواتير
const INVOICE_STATUSES = [
  { key: "all", label: "جميع الحالات", color: "default" },
  { key: "paid", label: "مدفوع", color: "success" },
  { key: "pending", label: "معلق", color: "warning" },
  { key: "overdue", label: "متأخر", color: "danger" },
];

export default function InvoiceClient({
  invoices,
  totalInvoices,
}: InvoiceClientProps) {
  const { params, setParams } = useQueryParams<{
    xinv_id: string;
    xfrom_date: string;
    xto_date: string;
    xtrans_type: string;
    page: string;
  }>(["xinv_id", "xfrom_date", "xto_date", "xtrans_type", "page"], {
    defaultValues: {
      xinv_id: "",
      xfrom_date: "",
      xto_date: "",
      xtrans_type: "",
      page: "1",
    },
    schema: {
      xinv_id: {
        parse: (value) => value,
        serialize: (value) => value,
        default: "",
      },
      xfrom_date: {
        parse: (value) => value,
        serialize: (value) => value,
        default: "",
      },
      xto_date: {
        parse: (value) => value,
        serialize: (value) => value,
        default: "",
      },
      xtrans_type: {
        parse: (value) => value,
        serialize: (value) => value,
        default: "",
      },
      page: {
        parse: (value) => value,
        serialize: (value) => value,
        default: "1",
      },
    },
    pushMode: "replace",
    refreshOnChange: true,
    debounce: 350, // don't navigate until user stops typing for 350ms
  });

  const fractions = useFractions() as { frac: number; frac2: number };
  const [searchQ, setSearchQ] = useState(params.xinv_id || "");

  // const [params, setParams] = useQueryStates({
  //   search: parseAsString.withDefault(""),
  //   type: parseAsString.withDefault("all"),
  //   start_date: parseAsString.withDefault(""),
  //   end_date: parseAsString.withDefault(""),
  //   page: parseAsInteger.withDefault(1),
  // });

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
      xfrom_date: "",
      xto_date: "",
      xtrans_type: "0",
      xinv_id: "0",
      page: "1",
    });
  };

  // useEffect(() => {
  //   // if (searchQ) {
  //   setParams({ xinv_id: searchQ });
  //   // }
  // }, [searchQ]);

  return (
    <>
      {/* الفلاتر */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Input
              className="input-field"
              placeholder="البحث بالرقم أو الاسم..."
              startContent={<FunnelIcon className="h-4 w-4" />}
              value={searchQ}
              onChange={(e) => {
                setSearchQ(e.target.value);
                setParams({ xinv_id: e.target.value, page: "1" });
              }}
            />

            <Select
              className="input-field"
              placeholder="نوع الفاتورة"
              selectedKeys={[params.xtrans_type]}
              onSelectionChange={(keys) =>
                setParams({
                  xtrans_type: Array.from(keys)[0] as string,
                  page: "1",
                })
              }
            >
              {INVOICE_TYPES.map((type) => (
                <SelectItem key={type.key} value={type.key}>
                  {type.label}
                </SelectItem>
              ))}
            </Select>

            <Input
              className="input-field"
              placeholder="من تاريخ"
              type="date"
              value={params.xfrom_date}
              onChange={(e) => setParams({ xfrom_date: e.target.value, page: "1" })}
            />

            <Input
              className="input-field"
              placeholder="إلى تاريخ"
              type="date"
              value={params.xto_date}
              onChange={(e) => setParams({ xto_date: e.target.value, page: "1" })}
            />

            <Button
              className="btn-secondary"
              variant="bordered"
              onPress={clearFilters}
            >
              مسح الفلاتر
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* التبويبات */}
      <Tabs
        className="w-full"
        selectedKey={activeTab}
        onSelectionChange={(key) => setActiveTab(key as string)}
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
            className="card"
            columns={columns}
            data={invoices}
            searchable={false}
            sortable={true}
            title={`قائمة الفواتير (${totalInvoices} فاتورة)`}
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
