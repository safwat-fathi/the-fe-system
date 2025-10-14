"use client";

import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/react";
import { HomeSettings } from "@/types/models/home";

interface HomeDataTableProps {
  data: HomeSettings[];
}

const HomeDataTable = ({ data }: HomeDataTableProps) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        لا توجد بيانات لعرضها
      </div>
    );
  }

  return (
    <div className="responsive-table">
      <Table aria-label="جدول بيانات النظام">
        <TableHeader>
          <TableColumn>ID</TableColumn>
          <TableColumn>Company ID</TableColumn>
          <TableColumn>Year</TableColumn>
          <TableColumn>Fraction (frac)</TableColumn>
          <TableColumn>Fraction 2 (frac2)</TableColumn>
          <TableColumn>Company Name</TableColumn>
          <TableColumn>Email</TableColumn>
          <TableColumn>Phone</TableColumn>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.id}</TableCell>
              <TableCell>{item.comp_id}</TableCell>
              <TableCell>{item.year}</TableCell>
              <TableCell>{item.frac}</TableCell>
              <TableCell>{item.frac2}</TableCell>
              <TableCell>{item.comp_name || "-"}</TableCell>
              <TableCell>{item.email || "-"}</TableCell>
              <TableCell>{item.phone || "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default HomeDataTable;

