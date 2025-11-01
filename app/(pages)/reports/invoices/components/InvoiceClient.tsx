"use client";

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

import Card from "@/components/Card";
import useFractions from "@/utilities/useFractions";
import AppDataTable from "@/components/AppDataTable";
import InvoiceAnalytics from "@/components/InvoiceAnalytics";
import { Fractions } from "@/utilities/useFractions";
import { Invoice } from "@/types/models/invoice";
import { useQueryParams } from "@/utilities/hooks/useQueryParams";
import { INVOICE_TYPE_FILTERS } from "@/types/constants/invoice";
import { createInvoiceColumns } from "@/components/invoices/invoiceColumns";

interface InvoiceClientProps {
  invoices: Invoice[];
  totalInvoices: number;
}

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

  const fractionsResult = useFractions();
  const fractions: Fractions =
    typeof fractionsResult === "number"
      ? { frac: fractionsResult, frac2: fractionsResult }
      : fractionsResult;
  const [searchQ, setSearchQ] = useState(params.xinv_id || "");
  const [activeTab, setActiveTab] = useState("table");
  const [, startTransition] = useTransition();

  const columns = useMemo(() => createInvoiceColumns(fractions), [fractions]);

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
                const value = e.target.value;

                setSearchQ(value);
                if (value === params.xinv_id) return;
                startTransition(() => setParams({ xinv_id: value, page: "1" }));
              }}
            />

            <Select
              className="input-field"
              placeholder="نوع الفاتورة"
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
              onChange={(e) =>
                startTransition(() =>
                  setParams({ xfrom_date: e.target.value, page: "1" }),
                )
              }
            />

            <Input
              className="input-field"
              placeholder="إلى تاريخ"
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
          <AppDataTable
            className="card"
            columns={columns}
            data={invoices}
            searchable={false}
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
