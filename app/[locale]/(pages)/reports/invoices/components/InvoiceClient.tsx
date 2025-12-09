"use client";

import type { Table as TanTable } from "@tanstack/react-table";

import { useMemo, useState, useTransition } from "react";
import {
  Input,
  Button,
  Select,
  SelectItem,
  Tabs,
  Tab,
  CardBody,
} from "@heroui/react";
import {
  FunnelIcon,
  ChartBarIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";

import Card from "@/components/Card";
import useFractions, { Fractions } from "@/utilities/useFractions";
import AppDataTable from "@/components/AppDataTable";
import { useReportTableStore } from "@/hooks/useReportTableStore";
import InvoiceAnalytics from "@/components/InvoiceAnalytics";
import { Invoice } from "@/types/models/invoice";
import { useQueryParams } from "@/utilities/hooks/useQueryParams";
import { INVOICE_TYPE_FILTERS } from "@/types/constants/invoice";
import { createInvoiceColumns } from "@/app/[locale]/(pages)/reports/invoices/components/invoiceColumns";

interface InvoiceClientProps {
  invoices: Invoice[];
  totalInvoices: number;
}

export default function InvoiceClient({
  invoices,
  totalInvoices,
}: InvoiceClientProps) {
  const t = useTranslations("reports.invoices");
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

  const fractionsResult = useFractions();
  const fractions: Fractions =
    typeof fractionsResult === "number"
      ? { frac: fractionsResult, frac2: fractionsResult }
      : fractionsResult;
  const [searchQ, setSearchQ] = useState(params.xinv_id || "");
  const [activeTab, setActiveTab] = useState("table");
  const [, startTransition] = useTransition();

  const columns = useMemo(
    () =>
      createInvoiceColumns(fractions, {
        columns: {
          invoiceNumber: t("columns.invoiceNumber"),
          dateTime: t("columns.dateTime"),
          customer: t("columns.customer"),
          total: t("columns.total"),
          tax: t("columns.tax"),
          grandTotal: t("columns.grandTotal"),
          type: t("columns.type"),
          actions: t("columns.actions"),
        },
        typeLabels: {
          sale: t("typeLabels.sale"),
          purchase: t("typeLabels.purchase"),
          saleReturn: t("typeLabels.saleReturn"),
          purchaseReturn: t("typeLabels.purchaseReturn"),
          unknown: t("typeLabels.unknown"),
        },
        actionLabels: {
          preview: t("actionLabels.preview"),
          edit: t("actionLabels.edit"),
        },
      }),
    [fractions, t],
  );
  const setTable = useReportTableStore((s) => s.setTable);

  const clearFilters = () => {
    setSearchQ("");
    startTransition(() =>
      setParams({
        xfrom_date: "",
        xto_date: "",
        xtrans_type: "",
        xinv_id: "",
        page: "1",
      }),
    );
  };

  return (
    <>
      {/* Filters */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Input
              className="input-field"
              placeholder={t("filters.searchPlaceholder")}
              startContent={<FunnelIcon className="h-4 w-4" />}
              value={searchQ}
              onChange={(e) => {
                const value = e.target.value;

                setSearchQ(value);
                if (value === params.xinv_id) return;
                startTransition(() => setParams({ xinv_id: value, page: "1" }));
              }}
            />

            <Select
              className="input-field"
              placeholder={t("filters.typePlaceholder")}
              selectedKeys={[params.xtrans_type || "0"]}
              onSelectionChange={(keys) =>
                startTransition(() =>
                  setParams({
                    xtrans_type: Array.from(keys)[0] as string,
                    page: "1",
                  }),
                )
              }
            >
              {INVOICE_TYPE_FILTERS.map((type) => (
                <SelectItem key={type.key}>{t(type.labelKey)}</SelectItem>
              ))}
            </Select>

            <Input
              className="input-field"
              placeholder={t("filters.fromDate")}
              type="date"
              value={params.xfrom_date}
              onChange={(e) =>
                startTransition(() =>
                  setParams({ xfrom_date: e.target.value, page: "1" }),
                )
              }
            />

            <Input
              className="input-field"
              placeholder={t("filters.toDate")}
              type="date"
              value={params.xto_date}
              onChange={(e) =>
                startTransition(() =>
                  setParams({ xto_date: e.target.value, page: "1" }),
                )
              }
            />

            <Button
              className="btn-secondary"
              variant="bordered"
              onPress={clearFilters}
            >
              {t("filters.clear")}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Tabs */}
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
              <span>{t("tableTab")}</span>
            </div>
          }
        >
          <AppDataTable
            className="card"
            columns={columns}
            data={invoices}
            filterable={false}
            searchable={false}
            title={t("tableTitle", { count: totalInvoices })}
            onTableReady={(t) => setTable(t as TanTable<Invoice>)}
          />
        </Tab>

        <Tab
          key="analytics"
          title={
            <div className="flex items-center gap-2">
              <ChartBarIcon className="h-4 w-4" />
              <span>{t("analyticsTab")}</span>
            </div>
          }
        >
          <InvoiceAnalytics invoices={invoices} />
        </Tab>
      </Tabs>
      {/* Print action moved to header via global store */}
    </>
  );
}
