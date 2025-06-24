"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Button,
  Checkbox,
  Pagination,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import { FaPlus } from "react-icons/fa";
import toast from "react-hot-toast";

import ActionButtons from "@/components/ActionButtons";
import { fetchData, API_BASE_URL } from "@/utilities/api";
import useCrud from "@/utilities/useCrud";

const API_URL = `${API_BASE_URL}currencies_list/`;
const CREATE_URL = `${API_BASE_URL}api_create_currency`;
const UPDATE_URL = (id: number) => `${API_BASE_URL}api_update_currency/${id}`;
const DELETE_URL = (id: number) => `${API_BASE_URL}api_delete_currency/${id}`;

interface Currency {
  id: number;
  cur_name: string;
  cur_name_e: string;
  cur_part: string;
  cur_part_e: string;
  cur_sign: string;
  cur_price: string;
  cur_tag: string;
  cr_date: string;
  cur_status: boolean;
}

const columns = [
  { name: "ID", uid: "id" },
  { name: "الاسم", uid: "cur_name" },
  { name: "الاسم بالإنجليزي", uid: "cur_name_e" },
  { name: "جزء العملة", uid: "cur_part" },
  { name: "جزء العملة بالإنجليزي", uid: "cur_part_e" },
  { name: "الرمز", uid: "cur_sign" },
  { name: "السعر", uid: "cur_price" },
  { name: "الوسم", uid: "cur_tag" },
  { name: "التاريخ", uid: "cr_date" },
  { name: "الحالة", uid: "cur_status" },
  { name: "", uid: "actions" },
];

export default function CurrenciesTable() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [currentCurrency, setCurrentCurrency] = useState<Partial<Currency>>({});

  const rowsPerPage = 12;

  const { loadItems, createItem, updateItem, deleteItem } = useCrud();

  const loadCurrencies = useCallback(async () => {
    const data = await loadItems<Currency>(API_URL);
    setCurrencies(data);
  }, [loadItems]);

  useEffect(() => {
    loadCurrencies();
  }, [loadCurrencies]);

  const handleSave = async () => {
    try {
      const url =
        modalMode === "edit" && currentCurrency.id
          ? UPDATE_URL(currentCurrency.id)
          : CREATE_URL;

      const response =
        modalMode === "edit" && currentCurrency.id
          ? await updateItem(url, currentCurrency)
          : await createItem(url, currentCurrency);

      if (!response.ok) {
        const errorData = await response.json();

        console.error("❌ خطأ في الإرسال:", errorData);
        toast.error(
          "❌ فشل في العملية: " +
            (errorData?.detail || "يرجى التحقق من البيانات المدخلة"),
        );

        return;
      }

      toast.success(
        modalMode === "edit"
          ? "✅ تم تعديل العملة بنجاح"
          : "✅ تم إضافة العملة بنجاح",
      );
      setIsModalOpen(false);
      loadCurrencies();
    } catch (error) {
      console.error("❌ استثناء أثناء الحفظ:", error);
      toast.error("❌ حدث خطأ أثناء الحفظ، يرجى المحاولة لاحقًا");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد أنك تريد حذف هذه العملة؟")) return;
    try {
      const response = await deleteItem(DELETE_URL(id));

      if (!response.ok) throw new Error();
      toast.success("✅ تم حذف العملة بنجاح");
      loadCurrencies();
    } catch {
      toast.error("❌ حدث خطأ أثناء الحذف");
    }
  };

  const renderActions = (cur: Currency) => (
    <ActionButtons
      onDelete={() => handleDelete(cur.id)}
      onEdit={() => openModal("edit", cur)}
      onView={() => openModal("view", cur)}
    />
  );

  const filtered = useMemo(
    () =>
      currencies.filter((c) =>
        c.cur_name?.toLowerCase().includes(search.toLowerCase()),
      ),
    [currencies, search],
  );

  const paginated = useMemo(() => {
    const start = (page - 1) * rowsPerPage;

    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page]);

  const openModal = (
    mode: "add" | "edit" | "view",
    currency: Partial<Currency> = {},
  ) => {
    setModalMode(mode);
    setCurrentCurrency(currency);
    setIsModalOpen(true);
  };

  const isViewMode = modalMode === "view";

  return (
    <div className="p-4 font-cairo">
      <h1 className="text-2xl font-bold mb-6">العملات</h1>
      <div className="flex justify-between mb-4">
        <Button onPress={() => openModal("add")}>
          {" "}
          <FaPlus /> إضافة عملة{" "}
        </Button>
        <Input
          className="w-60"
          placeholder="بحث بالاسم..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Table aria-label="جدول العملات">
        <TableHeader>
          {columns.map((col) => (
            <TableColumn key={col.uid}>{col.name}</TableColumn>
          ))}
        </TableHeader>
        <TableBody>
          {paginated.map((cur) => (
            <TableRow key={cur.id}>
              <TableCell>{cur.id}</TableCell>
              <TableCell>{cur.cur_name}</TableCell>
              <TableCell>{cur.cur_name_e}</TableCell>
              <TableCell>{cur.cur_part}</TableCell>
              <TableCell>{cur.cur_part_e}</TableCell>
              <TableCell>{cur.cur_sign}</TableCell>
              <TableCell>{cur.cur_price}</TableCell>
              <TableCell>{cur.cur_tag}</TableCell>
              <TableCell>{cur.cr_date}</TableCell>
              <TableCell>
                <Checkbox isReadOnly isSelected={cur.cur_status} />
              </TableCell>
              <TableCell>{renderActions(cur)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex justify-between items-center py-4">
        <span>عدد العملات: {filtered.length}</span>
        <Pagination
          color="primary"
          page={page}
          total={Math.ceil(filtered.length / rowsPerPage)}
          onChange={setPage}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        scrollBehavior="inside"
        size="5xl"
        onClose={() => setIsModalOpen(false)}
      >
        <ModalContent className="font-cairo">
          <ModalHeader>
            {modalMode === "add" && "إضافة عملة"}
            {modalMode === "edit" && "تعديل عملة"}
            {modalMode === "view" && "عرض بيانات العملة"}
          </ModalHeader>

          <ModalBody className="grid grid-cols-2 gap-4 max-h-[80vh] overflow-y-auto pr-2">
            <Input
              isDisabled={isViewMode}
              label="اسم العملة"
              value={currentCurrency.cur_name || ""}
              onChange={(e) =>
                setCurrentCurrency({
                  ...currentCurrency,
                  cur_name: e.target.value,
                })
              }
            />
            <Input
              isDisabled={isViewMode}
              label="اسم العملة بالإنجليزي"
              value={currentCurrency.cur_name_e || ""}
              onChange={(e) =>
                setCurrentCurrency({
                  ...currentCurrency,
                  cur_name_e: e.target.value,
                })
              }
            />
            <Input
              isDisabled={isViewMode}
              label="جزء العملة"
              value={currentCurrency.cur_part || ""}
              onChange={(e) =>
                setCurrentCurrency({
                  ...currentCurrency,
                  cur_part: e.target.value,
                })
              }
            />
            <Input
              isDisabled={isViewMode}
              label="جزء العملة بالإنجليزي"
              value={currentCurrency.cur_part_e || ""}
              onChange={(e) =>
                setCurrentCurrency({
                  ...currentCurrency,
                  cur_part_e: e.target.value,
                })
              }
            />
            <Input
              isDisabled={isViewMode}
              label="رمز العملة"
              value={currentCurrency.cur_sign || ""}
              onChange={(e) =>
                setCurrentCurrency({
                  ...currentCurrency,
                  cur_sign: e.target.value,
                })
              }
            />
            <Input
              isDisabled={isViewMode}
              label="السعر"
              value={currentCurrency.cur_price || ""}
              onChange={(e) =>
                setCurrentCurrency({
                  ...currentCurrency,
                  cur_price: e.target.value,
                })
              }
            />
            <Input
              isDisabled={isViewMode}
              label="الوسم"
              value={currentCurrency.cur_tag || ""}
              onChange={(e) =>
                setCurrentCurrency({
                  ...currentCurrency,
                  cur_tag: e.target.value,
                })
              }
            />
            <Input
              isDisabled={true}
              label="تاريخ الإنشاء"
              value={currentCurrency.cr_date || ""}
            />
            <div className="col-span-2">
              <Checkbox
                isDisabled={isViewMode}
                isSelected={currentCurrency.cur_status || false}
                onValueChange={(val) =>
                  setCurrentCurrency({ ...currentCurrency, cur_status: val })
                }
              >
                الحالة مفعلة
              </Checkbox>
            </div>
          </ModalBody>

          {modalMode !== "view" && (
            <ModalFooter className="flex justify-end gap-2">
              <Button color="danger" onPress={() => setIsModalOpen(false)}>
                إلغاء
              </Button>
              <Button color="success" onPress={handleSave}>
                {modalMode === "edit" ? "تحديث" : "حفظ"}
              </Button>
            </ModalFooter>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
