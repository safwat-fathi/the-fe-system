"use client";

import type { Invoice } from "@/types/invoice";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Pagination,
} from "@heroui/react";
import toast from "react-hot-toast";

import ActionButtons from "@/components/ActionButtons";
import { API_ENDPOINTS, fetchData } from "@/utilities/api";
import { formatDateTime } from "@/utilities/dateUtils";
import { formatAmount } from "@/utilities/formatAmount";
import useFractions from "@/utilities/useFractions";

const { INVOICES_LIST } = API_ENDPOINTS;

const columns = [
  { name: "رقم الفاتورة", uid: "inv_id" },
  { name: "التاريخ والوقت", uid: "inv_date" },
  { name: "العميل", uid: "cust_name" },
  { name: "الإجمالي", uid: "inv_net" },
  { name: "الضريبة", uid: "tax" },
  { name: "الإجمالي شامل الضريبة", uid: "inv_amt" },
  { name: "", uid: "actions" },
];

export default function InvoicesPage() {
  const router = useRouter();
  const { frac } = useFractions();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const rowsPerPage = 12;

  const loadInvoices = useCallback(async () => {
    const data = await fetchData<Invoice[]>(INVOICES_LIST);
    setInvoices(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const handleEdit = (invId: number) => {
    router.push(`/dashboard/forms/invoice?inv_id=${invId}`);
  };

  const filteredInvoices = useMemo(
    () =>
      invoices.filter(
        (inv) =>
          inv.cust_name?.toLowerCase().includes(search.toLowerCase()) ||
          String(inv.inv_id).includes(search) ||
          String(inv.id).includes(search)
      ),
    [invoices, search]
  );

  const paginated = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredInvoices.slice(start, start + rowsPerPage);
  }, [filteredInvoices, page]);

  return (
    <div className="p-4 font-cairo">
      <h1 className="mb-6 text-2xl font-bold">قائمة الفواتير</h1>
      <div className="mb-4 flex justify-end">
        <Input
          className="w-60"
          placeholder="بحث بالرقم أو الاسم..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <Table aria-label="جدول الفواتير">
        <TableHeader>
          {columns.map((col) => (
            <TableColumn key={col.uid}>{col.name}</TableColumn>
          ))}
        </TableHeader>
        <TableBody>
          {paginated.map((inv) => (
            <TableRow key={inv.inv_id}>
              <TableCell>{inv.inv_id}</TableCell>
              <TableCell>{formatDateTime(inv.inv_date)}</TableCell>
              <TableCell>{inv.cust_name}</TableCell>
              <TableCell>{formatAmount(inv.inv_net, frac)}</TableCell>
              <TableCell>{formatAmount(inv.tax, frac)}</TableCell>
              <TableCell>{formatAmount(inv.inv_amt, frac)}</TableCell>
              <TableCell>
                <ActionButtons
                  onEdit={() => handleEdit(inv.inv_id)}
                  onView={() => handleEdit(inv.inv_id)}
                  showDelete={false}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex items-center justify-between py-4">
        <span className="text-sm text-gray-500">
          عدد الفواتير: {filteredInvoices.length}
        </span>
        <Pagination
          color="primary"
          page={page}
          total={Math.ceil(filteredInvoices.length / rowsPerPage)}
          onChange={setPage}
        />
      </div>
    </div>
  );
}
