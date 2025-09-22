"use client";

import type { Invoice } from "@/types/invoice";
import React, { useMemo, useState } from "react";
import {

  Input,
  Pagination,
  Button,
  Chip,
  Select,
  SelectItem,
  Tabs,
  Tab,
} from "@heroui/react";
import Card from "@/components/Card";
import { CardBody } from "@heroui/react";
import {
  EyeIcon,
  PencilIcon,
  FunnelIcon,
  ChartBarIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import { formatDateTime } from "@/utilities/dateUtils";
import { formatAmount } from "@/utilities/formatAmount";
import useFractions from "@/utilities/useFractions";
import DataTable from "@/components/DataTable";
import InvoiceAnalytics from "@/components/InvoiceAnalytics";
import Link from "next/link";

interface InvoiceClientComponentProps {
  initialInvoices: Invoice[];
  invoiceTypes: { key: string; label: string; color: string }[];
  invoiceStatuses: { key: string; label: string; color: string }[];
}

export default function InvoiceClientComponent({
  initialInvoices,
  invoiceTypes,
  invoiceStatuses,
}: InvoiceClientComponentProps) {
  const fractions = useFractions() as { frac: number; frac2: number };

  // فلاتر
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("table");

  const rowsPerPage = 12;

  // تصفية الفواتير
  const filteredInvoices = useMemo(() => {
    return initialInvoices.filter((inv) => {
      // البحث النصي
      const searchMatch =
        inv.cust_name?.toLowerCase().includes(search.toLowerCase()) ||
        String(inv.inv_id).includes(search) ||
        String(inv.inv_id).includes(search);

      // تصفية حسب النوع
      const typeMatch =
        selectedType === "all" ||
        (selectedType === "purchase" && inv.trans_type === 1) ||
        (selectedType === "sales" && inv.trans_type === 2) ||
        (selectedType === "purchase_return" && inv.trans_type === 3) ||
        (selectedType === "sales_return" && inv.trans_type === 4);

      // تصفية حسب التاريخ
      const dateMatch =
        (!dateRange.start && !dateRange.end) ||
        (dateRange.start &&
          new Date(inv.inv_date) >= new Date(dateRange.start) &&
          dateRange.end &&
          new Date(inv.inv_date) <= new Date(dateRange.end));

      return searchMatch && typeMatch && dateMatch;
    });
  }, [initialInvoices, search, selectedType, dateRange]);

  // ترقيم الصفحات
  const paginated = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredInvoices.slice(start, start + rowsPerPage);
  }, [filteredInvoices, page]);

  // أعمدة الجدول
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
          <Link href={`/dashboard/forms/invoices/sale?inv_id=${row.inv_id}`}>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              // onPress={() =>
              //   (window.location.href = `/dashboard/forms/invoices/sale?inv_id=${row.inv_id}`)
              // }
            >
              <EyeIcon className="h-4 w-4 text-blue-500" />
            </Button>
          </Link>
          <Link href={`/dashboard/forms/invoices/sale?inv_id=${row.inv_id}`}>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              // onPress={() =>
              //   (window.location.href = `/dashboard/forms/invoices/sale?inv_id=${row.inv_id}`)
              // }
            >
              <PencilIcon className="h-4 w-4 text-yellow-500" />
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  const clearFilters = () => {
    setSearch("");
    setSelectedType("all");
    setSelectedStatus("all");
    setDateRange({ start: "", end: "" });
    setPage(1);
  };

  return (
    <>
      {/* الفلاتر */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Input
              placeholder="البحث بالرقم أو الاسم..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              startContent={<FunnelIcon className="h-4 w-4" />}
              className="input-field"
            />

            <Select
              placeholder="نوع الفاتورة"
              selectedKeys={[selectedType]}
              onSelectionChange={(keys) =>
                setSelectedType(Array.from(keys)[0] as string)
              }
              className="input-field"
            >
              {invoiceTypes.map((type) => (
                <SelectItem key={type.key}>{type.label}</SelectItem>
              ))}
            </Select>

            <Input
              type="date"
              placeholder="من تاريخ"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, start: e.target.value }))
              }
              className="input-field"
            />

            <Input
              type="date"
              placeholder="إلى تاريخ"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, end: e.target.value }))
              }
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
            data={paginated}
            title={`قائمة الفواتير (${filteredInvoices.length} فاتورة)`}
            searchable={false}
            sortable={true}
            className="card"
          />

          {/* ترقيم الصفحات */}
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-gray-500">
              عرض {(page - 1) * rowsPerPage + 1} إلى{" "}
              {Math.min(page * rowsPerPage, filteredInvoices.length)} من{" "}
              {filteredInvoices.length} فاتورة
            </span>
            <Pagination
              color="primary"
              page={page}
              total={Math.ceil(filteredInvoices.length / rowsPerPage)}
              onChange={setPage}
              showControls
              showShadow
            />
          </div>
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
          <InvoiceAnalytics invoices={filteredInvoices}/>
        </Tab>
      </Tabs>
    </>
  );
}
