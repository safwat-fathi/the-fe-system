"use client";
import { useEffect, useState , useCallback} from "react";
import {
  Button,
  Input,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Chip,
  Select,
  SelectItem,
  Divider,
} from "@heroui/react";
import { HeroModal as Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@/components/Modal";
import Card from "@/components/Card";
import { CardBody, CardHeader } from "@heroui/react";
import { EyeIcon, PencilIcon, TrashIcon, PlusIcon, MagnifyingGlassIcon, FunnelIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import itemService from "@/services/api/item.service";

interface Category {
  id: number;
  cat_name: string;
  cat_name_e: string;
  cr_date: string;
  gauge: number;
  purity: number;
  box: number;
  tax: number;
  cat_type: number;
  cat_status: number;
}

interface Unit {
  id: number;
  unit_name: string;
}

interface Item {
  id: number;
  item_name: string;
  item_name_e: string;
  item_price: string;
  item_img: string;
  item_code: string;
  item_barcode: string;
  first_cost: string;
  item_weight: string;
  item_g_weight: string;
  stones: string;
  model: string;
  k: string;
  purity: string;
  item_status: number;
  cr_date: string;
  cr_user: string;
  upd_date: string;
  upd_user: string;
  cat: number | null;
  item_type: number | null;
  unit: number | null;
}

interface ItemType {
  id: number;
  type_name: string;
  type_name_e: string;
}

interface ItemsClientProps {
  initialCategories: Category[];
  initialItems: Item[];
  initialItemTypes: ItemType[];
  initialUnits: Unit[];
  initialBoxes: { id: number; box_name: string }[];
  initialCatTypes: { code_id: number; code_desc: string }[];
  initialCatStatuses: { code_id: number; code_desc: string }[];
}

export default function ItemsClient({
  initialCategories,
  initialItems,
  initialItemTypes,
  initialUnits,
  initialBoxes,
  initialCatTypes,
  initialCatStatuses,
}: ItemsClientProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [items, setItems] = useState<Item[]>(initialItems);
  const [itemTypes, setItemTypes] = useState<ItemType[]>(initialItemTypes);
  const [units, setUnits] = useState<Unit[]>(initialUnits);
  const [selectedCatId, setSelectedCatId] = useState<number>(0);
  const [selectedTypeId, setSelectedTypeId] = useState<number>(0);
  const [ItemStatus, setItemStatus] = useState<any[]>([]);
  const [currentItem, setCurrentItem] = useState<Partial<Item>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [catPage, setCatPage] = useState(1);
  const catPerPage = 2;

  const startIndex = (catPage - 1) * catPerPage;
  const endIndex = startIndex + catPerPage;
  const pagedCategories = categories.slice(startIndex, endIndex);
  const totalCatPages = Math.ceil(categories.length / catPerPage);

  const [itemsNextUrl, setItemsNextUrl] = useState<string | null>(null);
  const [itemsPrevUrl, setItemsPrevUrl] = useState<string | null>(null);
  const [itemsCount, setItemsCount] = useState<number>(initialItems.length);
  const [itemsPage, setItemsPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [search, setSearch] = useState("");

  const [boxes, setBoxes] = useState<{ id: number; box_name: string }[]>(initialBoxes);
  const [catTypes, setCatTypes] = useState<{ code_id: number; code_desc: string }[]>(initialCatTypes);
  const [catStatuses, setCatStatuses] = useState<{ code_id: number; code_desc: string }[]>(initialCatStatuses);

  const [newItem, setNewItem] = useState<Item>({
    id: 0,
    item_name: "",
    item_name_e: "",
    item_price: "0.00",
    item_img: "/default.png",
    item_code: "0000000000000",
    item_barcode: " ",
    first_cost:  "0.00",
    item_weight:  "0.00",
    item_g_weight:  "0.00",
    stones: "0.00",
    model: "",
    k:  "0.00",
    purity:  "0.00",
    item_status: 1,
    cr_date: "",
    cr_user: "",
    upd_date: "",
    upd_user: "",
    cat: null,
    item_type: null,
    unit: null,
  });

  useEffect(() => {
    if (search.trim()) {
      searchItems(search);
    } else {
      fetchItems(selectedCatId, selectedTypeId);
    }
  }, [selectedCatId, selectedTypeId, search]);

  const fetchItems = async (
    xcat: number,
    xtype: number,
    url?: string,
    page = 1,
  ) => {
    try {
      const itemsArray = await itemService.getAllItems();
      
      const filteredItems = itemsArray.filter((item: any) => {
        if (xcat && xcat !== 0 && item.cat !== xcat) return false;
        if (xtype && xtype !== 0 && item.item_type !== xtype) return false;
        return true;
      });

      setItems(filteredItems);
      setItemsCount(filteredItems.length);
      setItemsNextUrl(null);
      setItemsPrevUrl(null);
    } catch (err) {
      console.error("خطأ في تحميل الأصناف:", err);
      setItems([]);
    }
  };

  const searchItems = async (
    query: string,
    url?: string,
    page = 1,
  ) => {
    try {
      const itemsArray = await itemService.getAllItems();
      const term = query.toLowerCase();
      const filtered = itemsArray.filter((item: any) => {
        const code = (item.item_code ?? item.code ?? "").toLowerCase();
        const name = (item.item_name ?? item.text ?? "").toLowerCase();
        return code.includes(term) || name.includes(term);
      });
      const mapped = filtered.map((item: any) => ({
        ...item,
        item_name: item.item_name ?? item.text ?? "",
      }));

      setItems(mapped);
      setItemsCount(mapped.length);
      setItemsNextUrl(null);
      setItemsPrevUrl(null);
    } catch (err) {
      console.error("خطأ في البحث عن الأصناف:", err);
      setItems([]);
    }
  };

  const filteredItems = search.trim()
    ? items.filter((item) => {
        const term = search.toLowerCase();
        return (
          (item.item_name ?? "").toLowerCase().includes(term) ||
          (item.item_code ?? "").toLowerCase().includes(term)
        );
      })
    : items;

  const pagedItems = filteredItems.slice((itemsPage - 1) * itemsPerPage, itemsPage * itemsPerPage);
  
  const [file, setFile] = useState(null);

  const handleAddItem = async () => {
    try {
      const result = await itemService.createItem(newItem);

      if (result) {
        toast.success("✅ تمت إضافة الصنف بنجاح");
        setIsModalOpen(false);
        fetchItems(selectedCatId, selectedTypeId);
      } else {
        toast.error("❌ فشل في الإضافة");
      }
    } catch (err) {
      toast.error("❌ حدث خطأ أثناء الإرسال");
    }
  };

  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const isViewMode = modalMode === "view";

  const handleEditItem = (item: Item) => {
    setModalMode("edit");
    setNewItem(item);
    setIsModalOpen(true);
  };

  const handleUpdateItem = async () => {
    try {
      const result = await itemService.updateItem(newItem.id, newItem);

      if (result) {
        toast.success("✅ تم تعديل الصنف بنجاح");
        setIsModalOpen(false);
        fetchItems(selectedCatId, selectedTypeId);
      } else {
        toast.error("❌ فشل في التعديل");
      }
    } catch (err) {
      toast.error("❌ خطأ أثناء التعديل");
    }
  };

  const handleDeleteItem = async (id: number) => {
    const confirmed = confirm("هل تريد حذف هذا الصنف؟");

    if (!confirmed) return;

    try {
      const result = await itemService.deleteItem(id);

      if (result) {
        toast.success("تم حذف الصنف بنجاح ✅");
        fetchItems(selectedCatId, selectedTypeId);
      } else {
        toast.error("فشل في حذف الصنف ❌");
      }
    } catch (error) {
      toast.error("خطأ أثناء الاتصال بالخادم ❌");
    }
  };

  const handleViewItem = (item: Item) => {
    setModalMode("view");
    setNewItem(item);
    setIsModalOpen(true);
  };

  return (
    <div className="font-cairo p-1 bg-gray-50 h-screen overflow-hidden flex flex-col">
      {/* قسم الفئات */}
      <Card className="card mb-1 flex-shrink-0" style={{ maxHeight: '35vh' }}>
        <CardHeader className="flex justify-between items-center py-1">
          <div>
            <h2 className="text-lg font-bold text-gray-800">الفئات</h2>
            <p className="text-gray-500 text-xs">إدارة فئات الأصناف</p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="البحث في الفئات..."
              className="w-48"
              size="sm"
              startContent={<MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />}
            />
            <Button
              color="primary"
              size="sm"
              onPress={() => {
                toast.info("سيتم إضافة هذه الميزة قريباً");
              }}
              startContent={<PlusIcon className="h-4 w-4" />}
            >
              إضافة فئة
            </Button>
          </div>
        </CardHeader>
        <CardBody className="py-1">
          <div className="table-container">
            <Table aria-label="جدول الفئات" className="min-h-[80px] table-no-scrollbar" size="sm">
              <TableHeader>
                <TableColumn className="text-right text-xs">اسم الفئة</TableColumn>
                <TableColumn className="text-center text-xs">العيار</TableColumn>
                <TableColumn className="text-center text-xs">المعايرة</TableColumn>
                <TableColumn className="text-center text-xs">الصندوق</TableColumn>
                <TableColumn className="text-center text-xs">الضريبة</TableColumn>
                <TableColumn className="text-center text-xs">النوع</TableColumn>
                <TableColumn className="text-center text-xs">الحالة</TableColumn>
                <TableColumn className="text-center text-xs">الإجراءات</TableColumn>
              </TableHeader>
              <TableBody>
                {(pagedCategories || []).map((cat) => (
                  <TableRow key={cat.id} className="hover:bg-gray-50 transition-colors">
                    <TableCell className="font-medium max-w-md truncate text-xs">
                      {cat.cat_name}
                    </TableCell>
                    <TableCell className="text-center text-xs">
                      <Chip color="primary" variant="flat" size="sm">
                        {cat.gauge}
                      </Chip>
                    </TableCell>
                    <TableCell className="text-center text-xs">
                      {cat.purity}
                    </TableCell>
                    <TableCell className="text-center text-xs">
                      {boxes.find((b) => b.id === cat.box)?.box_name || "-"}
                    </TableCell>
                    <TableCell className="text-center text-xs">
                      <Chip color="success" variant="flat" size="sm">
                        {cat.tax}%
                      </Chip>
                    </TableCell>
                    <TableCell className="text-center text-xs">
                      {catTypes.find((t) => t.code_id === cat.cat_type)?.code_desc || "-"}
                    </TableCell>
                    <TableCell className="text-center text-xs">
                      <Chip 
                        color={cat.cat_status === 1 ? "success" : "warning"} 
                        variant="flat" 
                        size="sm"
                      >
                        {catStatuses.find((s) => s.code_id === cat.cat_status)?.code_desc || "-"}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-1">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => {
                            setSelectedCatId(cat.id);
                          }}
                          className="text-blue-500 hover:bg-blue-50 text-xs"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => {
                            setSelectedCatId(cat.id);
                          }}
                          className="text-yellow-500 hover:bg-yellow-50 text-xs"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="danger"
                          onPress={() => {}}
                          className="hover:bg-red-50 text-xs"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div className="flex justify-between items-center mt-1 pt-1 border-t">
            <span className="text-xs text-gray-500">
              عدد الفئات: {categories.length}
            </span>
            <Pagination
              color="primary"
              size="sm"
              page={catPage}
              total={totalCatPages}
              onChange={setCatPage}
              showControls
              showShadow
            />
          </div>
        </CardBody>
      </Card>

      {/* قسم الأصناف */}
      <Card className="card flex-1 flex flex-col">
        <CardHeader className="flex justify-between items-center py-1 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-800">الأصناف</h2>
            <p className="text-gray-500 text-xs">إدارة الأصناف والمنتجات</p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="البحث في الأصناف..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48"
              size="sm"
              startContent={<MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />}
            />
            <Button
              color="primary"
              size="sm"
              onPress={() => {
                setModalMode("add");
                setNewItem({
                  id: 0,
                  item_name: "",
                  item_name_e: "",
                  item_price: "0.00",
                  item_img: "/default.png",
                  item_code: "0000000000000",
                  item_barcode: " ",
                  first_cost: "0.00",
                  item_weight: "0.00",
                  item_g_weight: "0.00",
                  stones: "0.00",
                  model: "",
                  k: "0.00",
                  purity: "0.00",
                  item_status: 1,
                  cr_date: "",
                  cr_user: "",
                  upd_date: "",
                  upd_user: "",
                  cat: null,
                  item_type: null,
                  unit: null,
                });
                setIsModalOpen(true);
              }}
              startContent={<PlusIcon className="h-4 w-4" />}
            >
              إضافة صنف
            </Button>
          </div>
        </CardHeader>
        <CardBody className="py-1 flex-1 flex flex-col">
          <div className="table-container flex-1">
            <Table aria-label="جدول الأصناف" className="h-full table-no-scrollbar" size="sm" style={{ minHeight: '200px' }}>
              <TableHeader>
                <TableColumn className="text-right text-xs">الكود</TableColumn>
                <TableColumn className="text-right text-xs">الاسم</TableColumn>
                <TableColumn className="text-center text-xs">السعر</TableColumn>
                <TableColumn className="text-center text-xs">الوزن</TableColumn>
                <TableColumn className="text-center text-xs">العيار</TableColumn>
                <TableColumn className="text-center text-xs">المعايرة</TableColumn>
                <TableColumn className="text-center text-xs">التكلفة</TableColumn>
                <TableColumn className="text-center text-xs">الوحدة</TableColumn>
                <TableColumn className="text-center text-xs">الحالة</TableColumn>
                <TableColumn className="text-center text-xs">الإجراءات</TableColumn>
              </TableHeader>
              <TableBody>
                {(pagedItems || []).map((item) => {
                  const unitName = (units || []).find((unit) => unit.id === item.unit);
                  const status = (ItemStatus || []).find((t) => t.code_id === item.item_status);
                  
                  return (
                    <TableRow key={item.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell className="font-mono text-xs">
                        {item.item_code || "-"}
                      </TableCell>
                      <TableCell className="font-medium max-w-md truncate text-xs">
                        {item.item_name}
                      </TableCell>
                      <TableCell className="text-center text-xs">
                        <Chip color="success" variant="flat" size="sm">
                          {item.item_price || "-"} ﷼
                        </Chip>
                      </TableCell>
                      <TableCell className="text-center text-xs">
                        {item.item_weight || "-"}
                      </TableCell>
                      <TableCell className="text-center text-xs">
                        <Chip color="primary" variant="flat" size="sm">
                          {item.k || "-"}
                        </Chip>
                      </TableCell>
                      <TableCell className="text-center text-xs">
                        {item.purity || "-"}
                      </TableCell>
                      <TableCell className="text-center text-xs">
                        {item.first_cost || "-"}
                      </TableCell>
                      <TableCell className="text-center text-xs">
                        {unitName?.unit_name || "-"}
                      </TableCell>
                      <TableCell className="text-center text-xs">
                        <Chip 
                          color={item.item_status === 1 ? "success" : "warning"} 
                          variant="flat" 
                          size="sm"
                        >
                          {status?.code_desc || "-"}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-1">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => handleViewItem(item)}
                            className="text-blue-500 hover:bg-blue-50 text-xs"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => handleEditItem(item)}
                            className="text-yellow-500 hover:bg-yellow-50 text-xs"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="danger"
                            onPress={() => handleDeleteItem(item.id)}
                            className="hover:bg-red-50 text-xs"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          
          <div className="flex justify-between items-center mt-1 pt-1 border-t flex-shrink-0">
            <span className="text-xs text-gray-500">
              عدد الأصناف: {itemsCount}
            </span>
            <Pagination
              color="primary"
              size="sm"
              page={itemsPage}
              total={Math.ceil(itemsCount / itemsPerPage) || 1}
              onChange={(p) => {
                setItemsPage(p);
                if (search.trim()) {
                  searchItems(search, undefined, p);
                } else {
                  fetchItems(selectedCatId, selectedTypeId, undefined, p);
                }
              }}
              showControls
              showShadow
            />
          </div>
        </CardBody>
      </Card>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        scrollBehavior="inside"
        size="5xl"
        onClose={() => setIsModalOpen(false)}
      >
        <ModalContent className="font-cairo">
          <ModalHeader>
            <div>
              <h3 className="text-xl font-bold">
                {modalMode === "add" && "إضافة صنف جديد"}
                {modalMode === "edit" && "تعديل صنف"}
                {modalMode === "view" && "عرض بيانات الصنف"}
              </h3>
              <p className="text-gray-500 text-sm">
                {modalMode === "add" && "أدخل بيانات الصنف الجديد"}
                {modalMode === "edit" && "قم بتعديل بيانات الصنف"}
                {modalMode === "view" && "عرض تفاصيل الصنف"}
              </p>
            </div>
          </ModalHeader>

          <ModalBody className="space-y-6">
            {/* البيانات الأساسية */}
            <Card className="card">
              <CardHeader>
                <h4 className="text-lg font-semibold text-gray-800">البيانات الأساسية</h4>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Input
                    isDisabled={isViewMode}
                    label="اسم الصنف"
                    value={newItem.item_name}
                    onChange={(e) =>
                      setNewItem({ ...newItem, item_name: e.target.value })
                    }
                    className="input-field"
                  />
                  <Input
                    isDisabled={isViewMode}
                    label="اسم الصنف بالإنجليزية"
                    value={newItem.item_name_e}
                    onChange={(e) =>
                      setNewItem({ ...newItem, item_name_e: e.target.value })
                    }
                    className="input-field"
                  />
                  <Input
                    isDisabled={isViewMode}
                    label="السعر"
                    value={newItem.item_price ?? ""}
                    onChange={(e) =>
                      setNewItem({ ...newItem, item_price: e.target.value })
                    }
                    className="input-field"
                    startContent={<span className="text-gray-400">﷼</span>}
                  />
                  <Input
                    isDisabled={isViewMode}
                    label="سعر التكلفة"
                    value={newItem.first_cost ?? ""}
                    onChange={(e) =>
                      setNewItem({ ...newItem, first_cost: e.target.value })
                    }
                    className="input-field"
                    startContent={<span className="text-gray-400">﷼</span>}
                  />
                  <Input
                    isDisabled={isViewMode}
                    label="كود الصنف"
                    value={newItem.item_code}
                    onChange={(e) =>
                      setNewItem({ ...newItem, item_code: e.target.value })
                    }
                    className="input-field"
                  />
                  <Input
                    isDisabled={isViewMode}
                    label="باركود الصنف"
                    value={newItem.item_barcode ?? ""}
                    onChange={(e) =>
                      setNewItem({ ...newItem, item_barcode: e.target.value })
                    }
                    className="input-field"
                  />
                </div>
              </CardBody>
            </Card>

            {/* البيانات الفنية */}
            <Card className="card">
              <CardHeader>
                <h4 className="text-lg font-semibold text-gray-800">البيانات الفنية</h4>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Input
                    isDisabled={isViewMode}
                    label="الوزن"
                    value={newItem.item_weight ?? ""}
                    onChange={(e) =>
                      setNewItem({ ...newItem, item_weight: e.target.value })
                    }
                    className="input-field"
                  />
                  <Input
                    isDisabled={isViewMode}
                    label="الوزن بالجرام"
                    value={newItem.item_g_weight ?? ""}
                    onChange={(e) =>
                      setNewItem({ ...newItem, item_g_weight: e.target.value })
                    }
                    className="input-field"
                  />
                  <Input
                    isDisabled={isViewMode}
                    label="الحجر"
                    value={newItem.stones ?? ""}
                    onChange={(e) =>
                      setNewItem({ ...newItem, stones: e.target.value })
                    }
                    className="input-field"
                  />
                  <Input
                    isDisabled={isViewMode}
                    label="الموديل"
                    value={newItem.model ?? ""}
                    onChange={(e) =>
                      setNewItem({ ...newItem, model: e.target.value })
                    }
                    className="input-field"
                  />
                  <Input
                    isDisabled={isViewMode}
                    label="العيار (K)"
                    value={newItem.k ?? ""}
                    onChange={(e) => setNewItem({ ...newItem, k: e.target.value })}
                    className="input-field"
                  />
                  <Input
                    isDisabled={isViewMode}
                    label="المعايرة"
                    value={newItem.purity ?? ""}
                    onChange={(e) =>
                      setNewItem({ ...newItem, purity: e.target.value })
                    }
                    className="input-field"
                  />
                </div>
              </CardBody>
            </Card>

            {/* التصنيفات */}
            <Card className="card">
              <CardHeader>
                <h4 className="text-lg font-semibold text-gray-800">التصنيفات</h4>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Select
                    label="الفئة"
                    selectedKeys={newItem.cat ? [newItem.cat.toString()] : []}
                    onSelectionChange={(keys) => {
                      const selectedKey = Array.from(keys)[0] as string;
                      setNewItem({ ...newItem, cat: Number(selectedKey) });
                    }}
                    isDisabled={isViewMode}
                    className="input-field"
                  >
                    {(categories || []).map((cat) => (
                      <SelectItem key={cat.id}>
                        {cat.cat_name}
                      </SelectItem>
                    ))}
                  </Select>
                  <Select
                    label="نوع الصنف"
                    selectedKeys={newItem.item_type ? [newItem.item_type.toString()] : []}
                    onSelectionChange={(keys) => {
                      const selectedKey = Array.from(keys)[0] as string;
                      setNewItem({ ...newItem, item_type: Number(selectedKey) });
                    }}
                    isDisabled={isViewMode}
                    className="input-field"
                  >
                    {(itemTypes || []).map((type) => (
                      <SelectItem key={type.id}>
                        {type.type_name}
                      </SelectItem>
                    ))}
                  </Select>
                  <Select
                    label="الوحدة"
                    selectedKeys={newItem.unit ? [newItem.unit.toString()] : []}
                    onSelectionChange={(keys) => {
                      const selectedKey = Array.from(keys)[0] as string;
                      setNewItem({ ...newItem, unit: Number(selectedKey) });
                    }}
                    isDisabled={isViewMode}
                    className="input-field"
                  >
                    {(units || []).map((unit) => (
                      <SelectItem key={unit.id}>
                        {unit.unit_name}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              </CardBody>
            </Card>

            {/* صورة الصنف */}
            <Card className="card">
              <CardHeader>
                <h4 className="text-lg font-semibold text-gray-800">صورة الصنف</h4>
              </CardHeader>
              <CardBody>
                <div className="flex items-center gap-4">
                  <input
                    accept="image/*"
                    className="input-field flex-1"
                    type="file"
                    disabled={isViewMode}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setNewItem({ ...newItem, item_img: file as any });
                      }
                    }}
                  />
                  {newItem.item_img && typeof newItem.item_img !== "string" && (
                    <img
                      alt="معاينة الصورة"
                      className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200"
                      src={URL.createObjectURL(newItem.item_img as File)}
                    />
                  )}
                </div>
              </CardBody>
            </Card>
          </ModalBody>

          {modalMode !== "view" && (
            <ModalFooter className="flex justify-end gap-3">
              <Button 
                color="danger" 
                variant="bordered"
                onPress={() => setIsModalOpen(false)}
                className="btn-secondary"
              >
                إلغاء
              </Button>
              <Button
                color="success"
                onPress={modalMode === "edit" ? handleUpdateItem : handleAddItem}
                className="btn-primary"
              >
                {modalMode === "edit" ? "تحديث" : "حفظ"}
              </Button>
            </ModalFooter>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}

