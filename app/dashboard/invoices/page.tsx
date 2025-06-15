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

import ActionButtons from "@/components/ActionButtons";
import { API_ENDPOINTS, fetchData } from "@/utilities/api";

const { INVOICES_LIST, DELETE_INVOICE } = API_ENDPOINTS;

const columns = [
  { name: "رقم الفاتورة", uid: "inv_id" },
  { name: "التاريخ", uid: "inv_date" },
  { name: "العميل", uid: "cust_name" },
  { name: "الصافي", uid: "inv_net" },
  { name: "", uid: "actions" },
];

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const rowsPerPage = 10;

  // جلب الفواتير من الخادم
  const loadInvoices = useCallback(async () => {
    const data = await fetchData<Invoice[]>(INVOICES_LIST);

    if (Array.isArray(data)) {
      setInvoices(data);
    } else {
      setInvoices([]);
    }
  }, []);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const handleDelete = async (id: number) => {
    if (!confirm("هل تريد حذف هذه الفاتورة؟")) return;
    try {
      await fetch(DELETE_INVOICE(id), { method: "DELETE" });
      loadInvoices();
    } catch {
      alert("فشل حذف الفاتورة");
    }
  };

  const handleEdit = (id: number) => {
    router.push(`/dashboard/invoice?inv_id=${id}`);
  };

  const filteredInvoices = useMemo(
    () =>
      invoices.filter(
        (inv) =>
          inv.cust_name?.toLowerCase().includes(search.toLowerCase()) ||
          String(inv.inv_id).includes(search),
      ),
    [invoices, search],
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
              <TableCell>{inv.inv_date}</TableCell>
              <TableCell>{inv.cust_name}</TableCell>
              <TableCell>{inv.inv_net}</TableCell>
              <TableCell>
                <ActionButtons
                  onDelete={() => handleDelete(inv.inv_id)}
                  onEdit={() => handleEdit(inv.inv_id)}
                  onView={() => handleEdit(inv.inv_id)}
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
