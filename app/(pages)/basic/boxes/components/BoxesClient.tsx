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
  Checkbox,
  Pagination,
  Select,
  SelectItem,
} from "@heroui/react";
import {
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import {
  HeroModal as Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/components/Modal";
import boxService from "@/services/api/box.service";
import { revalidateTableData } from "@/app/actions/revalidate.action";

// Interface for customer boxes (customers with cust_type = 99)
interface CustomerBox {
  id: number;
  cust_code?: string;
  cust_name: string;
  cust_name_e: string;
  mobile: number | string;
  email: string;
  address: string;
  vat_no: number | null;
  cr_no: number | null;
  phone: string;
  fax: string;
  gov: string;
  city: string;
  area: string;
  street: string;
  build_no: string;
  post_code: string;
  cust_status: number;
  acc?: number;
  acc_name?: string;
  cust_type?: number;
  box_type: string;
  handling: string;
  handling_e?: string;
  perc?: number;
  expt?: boolean;
  hide?: boolean;
}

interface BoxesClientProps {
  initialData: CustomerBox[];
  error: string | null;
}

const columns = [
  { name: "رقم الصندوق", uid: "id" },
  { name: "كود الصندوق", uid: "cust_code" },
  { name: "اسم الصندوق", uid: "cust_name" },
  { name: "الاسم بالإنجليزي", uid: "cust_name_e" },
  { name: "نوع الصندوق", uid: "box_type" },
  { name: "الحالة", uid: "cust_status" },
  { name: "", uid: "actions" },
];

export default function BoxesClient({ initialData, error }: BoxesClientProps) {
  const [boxes, setBoxes] = useState<CustomerBox[]>(initialData);
  const [boxTypes, setBoxTypes] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [currentBox, setCurrentBox] = useState<Partial<CustomerBox>>({});

  const rowsPerPage = 10;

  // إعادة تحميل البيانات
  // const loadBoxes = async () => {
  //   try {
  //     // const data = await boxService.getAllBoxes();
  //     const data = await boxesService.getBoxes();

  //     setBoxes(data as any[]);
  //   } catch (error) {
  //     toast.error("فشل في جلب الصناديق");
  //     setBoxes([]);
  //   }
  // };

  const loadBoxTypes = async () => {
    try {
      const data = await boxService.getBoxTypes();

      setBoxTypes(data);
    } catch (error) {
      toast.error("خطأ في تحميل أنواع الصناديق");
      setBoxTypes([]);
    }
  };

  // تحميل أنواع الصناديق عند تحميل المكون
  React.useEffect(() => {
    loadBoxTypes();
  }, []);

  // تحميل البيانات عند فتح المودال (لتأكيد التحديث)
  React.useEffect(() => {
    if (isModalOpen) {
      loadBoxTypes();
    }
  }, [isModalOpen]);

  const handleSave = async () => {
    const previousBoxes = [...boxes];

    try {
      let result: CustomerBox | null = null;

      // Optimistic update for create
      if (modalMode === "add") {
        const optimisticId = Date.now();
        const optimisticBox = {
          ...currentBox,
          id: optimisticId,
          cust_status: 1,
        } as CustomerBox;

        setBoxes([...boxes, optimisticBox]);
      }

      if (modalMode === "edit" && currentBox.id) {
        result = await boxService.updateBox(currentBox.id, currentBox);
      } else {
        result = await boxService.createBox(
          currentBox as Omit<CustomerBox, "id">,
        );
      }

      if (result) {
        toast.success(
          modalMode === "edit"
            ? "✅ تم تعديل الصندوق بنجاح"
            : "✅ تم إضافة الصندوق بنجاح",
        );

        // Revalidate cache
        await revalidateTableData("boxes_list");

        setIsModalOpen(false);
        // loadBoxes();
      } else {
        // Rollback on failure
        setBoxes(previousBoxes);
        toast.error("❌ فشل في العملية");
      }
    } catch (error) {
      // Rollback on error
      setBoxes(previousBoxes);
      toast.error("❌ حدث خطأ أثناء حفظ الصندوق");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل تريد حذف هذا الصندوق؟")) return;

    // Optimistic delete
    const previousBoxes = [...boxes];

    setBoxes(boxes.filter((box) => box.id !== id));

    try {
      const result = await boxService.deleteBox(id);

      if (result) {
        toast.success("✅ تم حذف الصندوق بنجاح");

        // Revalidate cache
        await revalidateTableData("boxes_list");
      } else {
        // Rollback on failure
        setBoxes(previousBoxes);
        toast.error("❌ فشل في حذف الصندوق");
      }
    } catch (error) {
      // Rollback on error
      setBoxes(previousBoxes);
      toast.error("❌ حدث خطأ أثناء الحذف");
    }
  };

  const filtered = useMemo(() => {
    return boxes.filter(
      (b) =>
        b.cust_name?.toLowerCase().includes(search.toLowerCase()) ||
        b.cust_code?.toString().toLowerCase().includes(search.toLowerCase()) ||
        b.cust_name_e?.toLowerCase().includes(search.toLowerCase()),
    );
  }, [boxes, search]);

  const paginated = useMemo(() => {
    const start = (page - 1) * rowsPerPage;

    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page]);

  const openModal = (
    mode: "add" | "edit" | "view",
    box: Partial<CustomerBox> = {},
  ) => {
    setModalMode(mode);
    setCurrentBox(box);
    setIsModalOpen(true);
  };

  const isViewMode = modalMode === "view";

  const renderActions = (box: CustomerBox) => (
    <div className="flex gap-2">
      <Button
        isIconOnly
        size="sm"
        variant="light"
        onPress={() => openModal("view", box)}
      >
        <EyeIcon className="h-4 w-4 text-blue-500" />
      </Button>
      <Button
        isIconOnly
        size="sm"
        variant="light"
        onPress={() => openModal("edit", box)}
      >
        <PencilIcon className="h-4 w-4 text-yellow-500" />
      </Button>
      <Button
        isIconOnly
        color="danger"
        size="sm"
        variant="light"
        onPress={() => handleDelete(box.id)}
      >
        <TrashIcon className="h-4 w-4" />
      </Button>
    </div>
  );

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">لا يمكن تحميل البيانات: {error}</p>
        <Button color="primary">إعادة المحاولة</Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between mb-4">
        <Button className="btn-primary" onPress={() => openModal("add")}>
          <PlusIcon className="h-4 w-4" /> إضافة صندوق
        </Button>
        <Input
          className="w-60"
          placeholder="بحث بالاسم أو الكود..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Table aria-label="جدول الصناديق">
        <TableHeader>
          {columns.map((col) => (
            <TableColumn key={col.uid}>{col.name}</TableColumn>
          ))}
        </TableHeader>
        <TableBody>
          {paginated.map((box) => (
            <TableRow key={box.id}>
              <TableCell>{box.id}</TableCell>
              <TableCell>{box.cust_code}</TableCell>
              <TableCell>{box.cust_name}</TableCell>
              <TableCell>{box.cust_name_e}</TableCell>
              <TableCell>
                {boxTypes.find(
                  (type) => type.code_id === Number(box.box_type),
                )?.code_desc ||
                  box.box_type ||
                  "-"}
              </TableCell>
              <TableCell>
                <Checkbox isReadOnly isSelected={!!box.cust_status} />
              </TableCell>
              <TableCell>{renderActions(box)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="py-4 flex justify-between items-center">
        <span className="text-sm text-gray-500">
          عدد الصناديق: {filtered.length}
        </span>
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
        shouldBlockScroll={false}
        onClose={() => setIsModalOpen(false)}
      >
        <ModalContent className="font-cairo">
          <ModalHeader>
            {modalMode === "add" && "إضافة صندوق"}
            {modalMode === "edit" && "تعديل صندوق"}
            {modalMode === "view" && "عرض بيانات الصندوق"}
          </ModalHeader>

          <ModalBody className="grid grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
            <Input
              isDisabled={isViewMode}
              label="كود الصندوق"
              value={currentBox.cust_code || ""}
              onChange={(e) =>
                setCurrentBox({ ...currentBox, cust_code: e.target.value })
              }
            />
            <Input
              isDisabled={isViewMode}
              label="اسم الصندوق"
              value={currentBox.cust_name || ""}
              onChange={(e) =>
                setCurrentBox({ ...currentBox, cust_name: e.target.value })
              }
            />
            <Input
              isDisabled={isViewMode}
              label="الاسم بالإنجليزي"
              value={currentBox.cust_name_e || ""}
              onChange={(e) =>
                setCurrentBox({ ...currentBox, cust_name_e: e.target.value })
              }
            />
            <Select
              isDisabled={isViewMode}
              label="نوع الصندوق"
              popoverProps={{
                shouldBlockScroll: false,
              }}
              selectedKeys={
                currentBox.box_type
                  ? [String(currentBox.box_type)]
                  : []
              }
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0];

                setCurrentBox({
                  ...currentBox,
                  box_type: String(selectedKey),
                });
              }}
            >
              {boxTypes.map((type) => (
                <SelectItem
                  key={String(type.code_id)}
                  textValue={type.code_desc || ""}
                >
                  {type.code_desc}
                </SelectItem>
              ))}
            </Select>
            <Input
              isDisabled={isViewMode}
              label="الجوال"
              value={currentBox.mobile?.toString() || ""}
              onChange={(e) =>
                setCurrentBox({ ...currentBox, mobile: e.target.value })
              }
            />
            <Input
              isDisabled={isViewMode}
              label="البريد الإلكتروني"
              value={currentBox.email || ""}
              onChange={(e) =>
                setCurrentBox({ ...currentBox, email: e.target.value })
              }
            />
            <Input
              isDisabled={isViewMode}
              label="العنوان"
              value={currentBox.address || ""}
              onChange={(e) =>
                setCurrentBox({ ...currentBox, address: e.target.value })
              }
            />
            <Input
              isDisabled={isViewMode}
              label="المحافظة"
              value={currentBox.gov || ""}
              onChange={(e) =>
                setCurrentBox({ ...currentBox, gov: e.target.value })
              }
            />
            <Input
              isDisabled={isViewMode}
              label="المدينة"
              value={currentBox.city || ""}
              onChange={(e) =>
                setCurrentBox({ ...currentBox, city: e.target.value })
              }
            />
            <Input
              isDisabled={isViewMode}
              label="المنطقة"
              value={currentBox.area || ""}
              onChange={(e) =>
                setCurrentBox({ ...currentBox, area: e.target.value })
              }
            />
            <Input
              isDisabled={isViewMode}
              label="الشارع"
              value={currentBox.street || ""}
              onChange={(e) =>
                setCurrentBox({ ...currentBox, street: e.target.value })
              }
            />
            <Input
              isDisabled={isViewMode}
              label="المبنى"
              value={currentBox.build_no || ""}
              onChange={(e) =>
                setCurrentBox({ ...currentBox, build_no: e.target.value })
              }
            />
            <Input
              isDisabled={isViewMode}
              label="الرمز البريدي"
              value={currentBox.post_code || ""}
              onChange={(e) =>
                setCurrentBox({ ...currentBox, post_code: e.target.value })
              }
            />
            <Input
              isDisabled={isViewMode}
              label="الهاتف"
              value={currentBox.phone || ""}
              onChange={(e) =>
                setCurrentBox({ ...currentBox, phone: e.target.value })
              }
            />
            <Input
              isDisabled={isViewMode}
              label="الفاكس"
              value={currentBox.fax || ""}
              onChange={(e) =>
                setCurrentBox({ ...currentBox, fax: e.target.value })
              }
            />
            <Input
              isDisabled={isViewMode}
              label="المحصل"
              value={currentBox.handling || ""}
              onChange={(e) =>
                setCurrentBox({ ...currentBox, handling: e.target.value })
              }
            />
            <Input
              isDisabled={isViewMode}
              label="المحصل (بالإنجليزي)"
              value={currentBox.handling_e || ""}
              onChange={(e) =>
                setCurrentBox({ ...currentBox, handling_e: e.target.value })
              }
            />
            <div className="col-span-2 flex gap-6 items-center">
              <Checkbox
                isDisabled={isViewMode}
                isSelected={Boolean(currentBox.cust_status)}
                onValueChange={(val) =>
                  setCurrentBox({ ...currentBox, cust_status: val ? 1 : 0 })
                }
              >
                مفعلة
              </Checkbox>
              <Checkbox
                isDisabled={isViewMode}
                isSelected={Boolean(currentBox.expt)}
                onValueChange={(val) =>
                  setCurrentBox({ ...currentBox, expt: val })
                }
              >
                مستثنى من كشف الأرصدة
              </Checkbox>
              <Checkbox
                isDisabled={isViewMode}
                isSelected={Boolean(currentBox.hide)}
                onValueChange={(val) =>
                  setCurrentBox({ ...currentBox, hide: val })
                }
              >
                مخفي
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
    </>
  );
}
