"use client";

import type { Tax } from "@/types/models/tax";

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
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("settings.taxes");
  const [taxes] = useState<Tax[]>(initialTaxes);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("view");
  const [accounts] = useState(initialAccounts);

  const columns = useMemo(
    () => [
      { name: t("columns.id"), uid: "id" },
      { name: t("columns.taxName"), uid: "tax_name" },
      { name: t("columns.taxSymbol"), uid: "tax_symbol" },
      { name: t("columns.taxPrc"), uid: "tax_prc" },
      { name: t("columns.taxAccount"), uid: "tax_account" },
      { name: t("columns.actions"), uid: "actions" },
    ],
    [t],
  );

  const [currentTax, setCurrentTax] = useState<Tax>({
    id: 0,
    tax_name: "",
    tax_name_e: "",
    tax_symbol: "",
    tax_prc: 0,
    tax_account: undefined,
  });

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
          <PlusIcon className="h-4 w-4" /> {t("actions.add")}
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
        size="2xl"
        onClose={() => setIsModalOpen(false)}
      >
        <ModalContent className="font-cairo">
          <ModalHeader>
            {modalMode === "add" && t("modals.addTitle")}
            {modalMode === "edit" && t("modals.editTitle")}
            {modalMode === "view" && t("modals.viewTitle")}
          </ModalHeader>
          <ModalBody className="grid grid-cols-2 gap-4">
            <Input
              isDisabled={modalMode === "view"}
              label={t("fields.taxName")}
              value={currentTax.tax_name || ""}
              onChange={(e) =>
                setCurrentTax({ ...currentTax, tax_name: e.target.value })
              }
            />
            <Input
              isDisabled={modalMode === "view"}
              label={t("fields.taxNameEn")}
              value={currentTax.tax_name_e || ""}
              onChange={(e) =>
                setCurrentTax({ ...currentTax, tax_name_e: e.target.value })
              }
            />
            <Select
              isDisabled={modalMode === "view"}
              label={t("fields.taxAccount")}
              popoverProps={{ shouldBlockScroll: false }}
              selectedKeys={
                currentTax.tax_account ? [String(currentTax.tax_account)] : []
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
              label={t("fields.taxSymbol")}
              value={currentTax.tax_symbol || ""}
              onChange={(e) =>
                setCurrentTax({ ...currentTax, tax_symbol: e.target.value })
              }
            />
            <Input
              isDisabled={modalMode === "view"}
              label={t("fields.taxPrc")}
              step="0.1"
              type="number"
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
                {t("actions.cancel")}
              </Button>
              <Button
                color="primary"
                onPress={() => {
                  toast(t("messages.featureInDevelopment"));
                  setIsModalOpen(false);
                }}
              >
                {modalMode === "add" ? t("actions.save") : t("actions.update")}
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
