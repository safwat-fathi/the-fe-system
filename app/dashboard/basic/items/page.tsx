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
import { FaEye, FaEdit, FaTrash, FaPlus, FaSearch, FaFilter } from "react-icons/fa";
import toast from "react-hot-toast";

import { fetchData, API_BASE_URL, API_ENDPOINTS, apiFetch } from "@/utilities/api";
import useCrud from "@/utilities/useCrud";
import ReactSelect from "react-select";

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

export default function CategoriesItemsPage() {
  const Item_Status_URL = `${API_BASE_URL}getItemStatus`;
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
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
  const [itemsCount, setItemsCount] = useState<number>(0);
  const [itemsPage, setItemsPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [search, setSearch] = useState("");

  const [boxes, setBoxes] = useState<{ id: number; box_name: string }[]>([]);
  const [catTypes, setCatTypes] = useState<
    { code_id: number; code_desc: string }[]
  >([]);
  const [catStatuses, setCatStatuses] = useState<
    { code_id: number; code_desc: string }[]
  >([]);

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

  const { createItem, updateItem, deleteItem } = useCrud();

  useEffect(() => {
    fetchCategories();
    fetchItemTypes();
    fetchUnits();
    fetchBoxes();
    fetchCatTypes();
    fetchCatStatuses();
    loadMetaData();
  }, []);

  const loadMetaData = useCallback(async () => {
    const itemsResponse = await fetchData(Item_Status_URL);
    const item = Array.isArray((itemsResponse as any)?.results)
      ? (itemsResponse as any).results
      : [];
    setItemStatus(item);
  }, []);
  
  useEffect(() => {
    if (search.trim()) {
      searchItems(search);
    } else {
      fetchItems(selectedCatId, selectedTypeId);
    }
  }, [selectedCatId, selectedTypeId, search]);

  const fetchCatTypes = async () => {
    try {
      const res = await apiFetch(API_ENDPOINTS.CatTypeList);
      const data = await res.json();
      setCatTypes(Array.isArray(data.results) ? data.results : []);
    } catch (err) {
      console.error("فشل تحميل أنواع الفئات:", err);
    }
  };

  const fetchCatStatuses = async () => {
    try {
      const res = await apiFetch(API_ENDPOINTS.CatStatusList);
      const data = await res.json();
      setCatStatuses(Array.isArray(data.results) ? data.results : []);
    } catch (err) {
      console.error("فشل تحميل حالة الفئات:", err);
    }
  };

  const fetchBoxes = async () => {
    try {
      const res = await apiFetch(API_ENDPOINTS.BOXES_LIST);
      const data = await res.json();
      setBoxes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("فشل تحميل الصناديق:", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await apiFetch(API_ENDPOINTS.CATEGORIES_LIST);
      const data = await res.json();
      setCategories((data as any).results || []);
    } catch (err) {
      console.error("خطأ في تحميل الفئات:", err);
    }
  };

  const fetchItems = async (
    xcat: number,
    xtype: number,
    url?: string,
    page = 1,
  ) => {
    try {
      const fetchUrl =
        url ?? `${API_BASE_URL}items_list_p/${xcat}/${xtype}/?page=${page}`;
      const res = await apiFetch(fetchUrl);
      const data = await res.json();

      const itemsArray = Array.isArray((data as any).results) ? (data as any).results : [];

      setItems(itemsArray);
      setItemsNextUrl((data as any).next);
      setItemsPrevUrl((data as any).previous);
      setItemsCount((data as any).count);
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
      const fetchUrl =
        url ??
        `${API_BASE_URL}SearchItemsList/?q=${encodeURIComponent(
          query,
        )}&page=${page}`;
      const res = await apiFetch(fetchUrl);
      const data = await res.json();
      const itemsArray = Array.isArray((data as any).results) ? (data as any).results : [];
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
      setItemsNextUrl((data as any).next);
      setItemsPrevUrl((data as any).previous);
      setItemsCount((data as any).count);
    } catch (err) {
      console.error("خطأ في البحث عن الأصناف:", err);
      setItems([]);
    }
  };

  const fetchItemTypes = async () => {
    try {
      const res = await apiFetch(API_ENDPOINTS.ITEM_TYPES_LIST);
      const data = await res.json();
      setItemTypes(data as ItemType[]);
    } catch (err) {
      console.error("خطأ في تحميل أنواع الأصناف:", err);
    }
  };

  const fetchUnits = async () => {
    try {
      const res = await apiFetch(API_ENDPOINTS.UNITS_LIST);
      const data = await res.json();
      setUnits(data as Unit[]);
    } catch (err) {
      console.error("خطأ في تحميل الوحدات:", err);
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
      const formData = new FormData();

      formData.append("item_name", newItem.item_name);
      formData.append("item_name_e", newItem.item_name_e);
      formData.append("item_price", newItem.item_price);
      formData.append("item_code", newItem.item_code);
      formData.append("item_barcode", newItem.item_barcode);
      formData.append("first_cost", newItem.first_cost);
      formData.append("item_weight", newItem.item_weight);
      formData.append("item_g_weight", newItem.item_g_weight);
      formData.append("stones", newItem.stones);
      formData.append("model", newItem.model);
      formData.append("k", newItem.k);
      formData.append("purity", newItem.purity);
      formData.append("cr_date", new Date().toISOString());
      formData.append("cat", String(newItem.cat));
      formData.append("item_type", String(newItem.item_type));
      formData.append("unit", String(newItem.unit));
      
      if (file) {
        formData.append("item_img", newItem.item_img as unknown as File); 
      }    

      const response = await createItem(
        API_ENDPOINTS.CREATE_ITEM,
        formData,
        { isFormData: true },
      );

      if (response.ok) {
        toast.success("✅ تمت إضافة الصنف بنجاح");
        setIsModalOpen(false);
        fetchItems(selectedCatId, selectedTypeId);
      } else {
        const error = await response.json();
        toast.error("❌ فشل في الإضافة:\n" + JSON.stringify(error));
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
      const formData = new FormData();

      formData.append("item_name", newItem.item_name);
      formData.append("item_name_e", newItem.item_name_e);
      formData.append("item_price", newItem.item_price ?? "");
      formData.append("item_code", newItem.item_code);
      formData.append("item_barcode", newItem.item_barcode);
      formData.append("first_cost", newItem.first_cost?? "");
      formData.append("item_weight", newItem.item_weight?? "");
      formData.append("item_g_weight", newItem.item_g_weight?? "");
      formData.append("stones", newItem.stones?? "");
      formData.append("model", newItem.model);
      formData.append("k", newItem.k?? "");
      formData.append("purity", newItem.purity?? "");
      formData.append("item_status", String(newItem.item_status));
      formData.append("upd_date", new Date().toISOString());
      formData.append("upd_user", "user");
      formData.append("cat", String(newItem.cat));

      if (newItem.item_type && typeof newItem.item_type !== "string") {
        formData.append("item_type", String(newItem.item_type)?? "");
      }
       
      if (newItem.unit && typeof newItem.unit !== "string") {
        formData.append("unit", String(newItem.unit)?? "");
      }
       
      if (newItem.item_img && typeof newItem.item_img !== "string") {
        formData.append("item_img", newItem.item_img as unknown as File);
      }

      const response = await updateItem(
        `${API_BASE_URL}api_update_item/${newItem.id}`,
        formData,
        { method: "PATCH", isFormData: true },
      );

      if (response.ok) {
        toast.success("✅ تم تعديل الصنف بنجاح");
        setIsModalOpen(false);
        fetchItems(selectedCatId, selectedTypeId);
      } else {
        const error = await response.json();
        toast.error("❌ فشل في التعديل:\n" + JSON.stringify(error));
      }
    } catch (err) {
      toast.error("❌ خطأ أثناء التعديل");
    }
  };

  const handleDeleteItem = async (id: number) => {
    const confirmed = confirm("هل تريد حذف هذا الصنف؟");

    if (!confirmed) return;

    try {
      const response = await deleteItem(`${API_BASE_URL}api_delete_item/`, {
        method: "POST",
        payload: { id },
      });

      if (response.ok) {
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
              startContent={<FaSearch className="text-gray-400" />}
            />
            <Button
              color="primary"
              size="sm"
              onPress={() => {
                // يمكن إضافة منطق إضافة فئة جديدة هنا
                toast.info("سيتم إضافة هذه الميزة قريباً");
              }}
              startContent={<FaPlus className="text-xs" />}
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
                {pagedCategories.map((cat) => (
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
                            // يمكن إضافة منطق عرض تفاصيل الفئة هنا
                          }}
                          className="text-blue-500 hover:bg-blue-50 text-xs"
                        >
                          <FaEye className="text-xs" />
                        </Button>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => {
                            setSelectedCatId(cat.id);
                            // يمكن إضافة منطق تعديل الفئة هنا
                          }}
                          className="text-yellow-500 hover:bg-yellow-50 text-xs"
                        >
                          <FaEdit className="text-xs" />
                        </Button>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="danger"
                          onPress={() => {
                            // يمكن إضافة منطق حذف الفئة هنا
                          }}
                          className="hover:bg-red-50 text-xs"
                        >
                          <FaTrash className="text-xs" />
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
              startContent={<FaSearch className="text-gray-400" />}
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
              startContent={<FaPlus className="text-xs" />}
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
                {pagedItems.map((item) => {
                  const unitName = units.find((unit) => unit.id === item.unit);
                  const status = ItemStatus.find((t) => t.code_id === item.item_status);
                  
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
                            <FaEye className="text-xs" />
                          </Button>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => handleEditItem(item)}
                            className="text-yellow-500 hover:bg-yellow-50 text-xs"
                          >
                            <FaEdit className="text-xs" />
                          </Button>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="danger"
                            onPress={() => handleDeleteItem(item.id)}
                            className="hover:bg-red-50 text-xs"
                          >
                            <FaTrash className="text-xs" />
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
                    {categories.map((cat) => (
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
                    {itemTypes.map((type) => (
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
                    {units.map((unit) => (
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
