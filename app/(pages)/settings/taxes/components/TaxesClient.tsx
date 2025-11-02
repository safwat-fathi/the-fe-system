"use client";

import React, { useState, useMemo } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Button,
  Pagination,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Select,
  SelectItem,
} from "@heroui/react";
import {
  PlusIcon,
  EyeIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import type { Tax } from "@/types/models/tax";
import taxService from "@/services/api/tax.service";

const columns = [
  { name: "رقم الضريبة", uid: "id" },
  { name: "الاسم", uid: "tax_name" },
  { name: "الرمز", uid: "tax_symbol" },
  { name: "النسبة", uid: "tax_prc" },
  { name: "الحساب", uid: "tax_account" },
  { name: "الخيارات", uid: "actions" },
];

type ModalMode = "add" | "edit" | "view";

interface TaxesClientProps {
  initialTaxes: Tax[];
  initialAccounts: Array<{
    id: number;
    acc_id: string;
    acc_name: string;
    acc_name_e?: string;
  }>;
}

export default function TaxesClient({
  initialTaxes,
  initialAccounts,
}: TaxesClientProps) {
  const [taxes, setTaxes] = useState<Tax[]>(initialTaxes);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("view");
  const [accounts] = useState(initialAccounts);

  const [currentTax, setCurrentTax] = useState<Tax>({
    id: 0,
    tax_name: "",
    tax_name_e: "",
    tax_symbol: "",
    tax_prc: 0,
    tax_account: undefined,
  });

  const sanitizeTax = (tax: any): Tax => ({
    id: tax.id ?? 0,
    tax_name: tax.tax_name ?? tax.name ?? "-",
    tax_name_e: tax.tax_name_e ?? tax.name_e ?? tax.name_en ?? "-",
    tax_symbol: tax.tax_symbol ?? tax.symbol ?? "-",
    tax_prc: tax.tax_prc ?? tax.value ?? 0,
    tax_account: tax.tax_account ?? tax.account ?? undefined,
    acc_name: tax.acc_name ?? tax.account_name ?? undefined,
    acc_id: tax.acc_id ?? tax.account_id ?? undefined,
  });

  const loadData = async () => {
    try {
      const taxesList = await taxService.getAllTaxes();
      const sanitized = taxesList.map(sanitizeTax);

      setTaxes(sanitized);
    } catch (error) {
      console.error("فشل في جلب البيانات:", error);
      setTaxes([]);
    }
  };

  const filteredTaxes = useMemo(() => {
    if (!searchQuery) return taxes;

    return taxes.filter((tax) =>
      Object.values(tax).some((val) =>
        val?.toString().toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    );
  }, [searchQuery, taxes]);

  const openAddModal = () => {
    setModalMode("add");
    setCurrentTax({
      id: 0,
      tax_name: "",
      tax_name_e: "",
      tax_symbol: "",
      tax_prc: 0,
      tax_account: undefined,
    });
    setIsModalOpen(true);
  };

  const openViewModal = (tax: Tax) => {
    setModalMode("view");
    setCurrentTax(tax);
    setIsModalOpen(true);
  };

  const openEditModal = (tax: Tax) => {
    setModalMode("edit");
    setCurrentTax({ ...tax });
    setIsModalOpen(true);
  };

  const sortedTaxes = useMemo(() => {
    return [...filteredTaxes].sort((a, b) => {
      return (a.id || 0) - (b.id || 0);
    });
  }, [filteredTaxes]);

  const pages = Math.ceil(sortedTaxes.length / rowsPerPage);
  const paginated = sortedTaxes.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );

  const renderActions = (tax: Tax) => (
    <div className="flex gap-2">
      <Button
        isIconOnly
        size="sm"
        variant="light"
        onPress={() => openViewModal(tax)}
      >
        <EyeIcon className="h-4 w-4 text-blue-500" />
      </Button>
      <Button
        isIconOnly
        size="sm"
        variant="light"
        onPress={() => openEditModal(tax)}
      >
        <PencilIcon className="h-4 w-4 text-yellow-500" />
      </Button>
    </div>
  );

  const getAccountDisplay = (tax: Tax) => {
    if (!tax.tax_account) return "-";
    const account = accounts.find((acc) => acc.id === tax.tax_account);

    if (account) {
      return `${account.acc_id} - ${account.acc_name}`;
    }

    return tax.acc_name || tax.tax_account.toString();
  };

  return (
    <>
      <div className="responsive-filters">
        <Button className="btn-primary" onPress={openAddModal}>
          <PlusIcon className="h-4 w-4" /> إنشاء ضريبة
        </Button>
        <Input
          className="responsive-search"
          placeholder="بحث بالاسم..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="responsive-table">
        <Table aria-label="جدول الضرائب">
          <TableHeader>
            {columns.map((col) => (
              <TableColumn key={col.uid}>{col.name}</TableColumn>
            ))}
          </TableHeader>
          <TableBody>
            {paginated.map((tax) => (
              <TableRow key={tax.id}>
                <TableCell>{tax.id}</TableCell>
                <TableCell>{tax.tax_name || "-"}</TableCell>
                <TableCell>{tax.tax_symbol || "-"}</TableCell>
                <TableCell>
                  {tax.tax_prc !== undefined && tax.tax_prc !== null
                    ? `% ${tax.tax_prc.toFixed(1)}`
                    : "-"}
                </TableCell>
                <TableCell>{getAccountDisplay(tax)}</TableCell>
                <TableCell>{renderActions(tax)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="responsive-pagination">
        <span>عدد الضرائب: {filteredTaxes.length}</span>
        <Pagination
          color="primary"
          page={page}
          total={pages}
          onChange={setPage}
        />
      </div>

      {/* Modal */}
      <Modal
        isDismissable={false}
        isOpen={isModalOpen}
        shouldBlockScroll={false}
        onClose={() => setIsModalOpen(false)}
        size="2xl"
      >
        <ModalContent className="font-cairo">
          <ModalHeader>
            {modalMode === "add" && "إنشاء ضريبة جديدة"}
            {modalMode === "edit" && "تعديل ضريبة"}
            {modalMode === "view" && "عرض الضريبة"}
          </ModalHeader>
          <ModalBody className="grid grid-cols-2 gap-4">
            <Input
              isDisabled={modalMode === "view"}
              label="الاسم العربي"
              value={currentTax.tax_name || ""}
              onChange={(e) =>
                setCurrentTax({ ...currentTax, tax_name: e.target.value })
              }
            />
            <Input
              isDisabled={modalMode === "view"}
              label="الاسم الإنجليزي"
              value={currentTax.tax_name_e || ""}
              onChange={(e) =>
                setCurrentTax({ ...currentTax, tax_name_e: e.target.value })
              }
            />
            <Select
              isDisabled={modalMode === "view"}
              label="الحساب"
              popoverProps={{ shouldBlockScroll: false }}
              selectedKeys={
                currentTax.tax_account
                  ? [String(currentTax.tax_account)]
                  : []
              }
              onSelectionChange={(keys) => {
                const id = Number(Array.from(keys)[0]);

                setCurrentTax({ ...currentTax, tax_account: id });
              }}
            >
              {accounts.map((acc) => (
                <SelectItem
                  key={acc.id}
                  textValue={`${acc.acc_id} - ${acc.acc_name}`}
                >
                  {acc.acc_id} - {acc.acc_name}
                </SelectItem>
              ))}
            </Select>
            <Input
              isDisabled={modalMode === "view"}
              label="الرمز"
              value={currentTax.tax_symbol || ""}
              onChange={(e) =>
                setCurrentTax({ ...currentTax, tax_symbol: e.target.value })
              }
            />
            <Input
              isDisabled={modalMode === "view"}
              label="النسبة"
              type="number"
              step="0.1"
              value={String(currentTax.tax_prc || 0)}
              onChange={(e) =>
                setCurrentTax({
                  ...currentTax,
                  tax_prc: parseFloat(e.target.value) || 0,
                })
              }
            />
          </ModalBody>
          {modalMode !== "view" && (
            <ModalFooter>
              <Button color="danger" onPress={() => setIsModalOpen(false)}>
                إلغاء
              </Button>
              <Button
                color="primary"
                onPress={() => {
                  toast.info("الميزة قيد التطوير - سيتم إضافة API للإنشاء والتعديل قريباً");
                  setIsModalOpen(false);
                }}
              >
                {modalMode === "add" ? "حفظ" : "تحديث"}
              </Button>
            </ModalFooter>
          )}
          {modalMode === "view" && (
            <ModalFooter>
              <Button color="primary" onPress={() => setIsModalOpen(false)}>
                إغلاق
              </Button>
            </ModalFooter>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}

