"use client";
import { useEffect, useState , useCallback} from "react";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
} from "@heroui/react";
import { FaEye, FaEdit, FaTrash } from "react-icons/fa";
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
  const catPerPage = 3;

  const startIndex = (catPage - 1) * catPerPage;
  const endIndex = startIndex + catPerPage;
  const pagedCategories = categories.slice(startIndex, endIndex);
  const totalCatPages = Math.ceil(categories.length / catPerPage);

  const [itemsNextUrl, setItemsNextUrl] = useState<string | null>(null);
  const [itemsPrevUrl, setItemsPrevUrl] = useState<string | null>(null);
  const [itemsCount, setItemsCount] = useState<number>(0);
  const [itemsPage, setItemsPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(7);
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
    const item = Array.isArray(itemsResponse?.results)
      ? itemsResponse.results
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

      setCategories(data.results || []);
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

      const itemsArray = Array.isArray(data.results) ? data.results : [];

      setItems(itemsArray);
      setItemsNextUrl(data.next);
      setItemsPrevUrl(data.previous);
      setItemsCount(data.count);
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
      const itemsArray = Array.isArray(data.results) ? data.results : [];
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
      setItemsNextUrl(data.next);
      setItemsPrevUrl(data.previous);
      setItemsCount(data.count);
    } catch (err) {
      console.error("خطأ في البحث عن الأصناف:", err);
      setItems([]);
    }
  };

  const fetchItemTypes = async () => {
    try {
      const res = await apiFetch(API_ENDPOINTS.ITEM_TYPES_LIST);
      const data = await res.json();

      setItemTypes(data);
    } catch (err) {
      console.error("خطأ في تحميل أنواع الأصناف:", err);
    }
  };


  const fetchUnits = async () => {
    try {
      const res = await apiFetch(API_ENDPOINTS.UNITS_LIST);
      const data = await res.json();

      setUnits(data);
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
      //formData.append("item_status", String(1));
      formData.append("cr_date", new Date().toISOString());
      formData.append("cat", String(newItem.cat));
      formData.append("item_type", String(newItem.item_type));
      formData.append("unit", String(newItem.unit));
      
    if (file) {
      formData.append("item_img", newItem.item_img); 
    }    

      const response = await createItem(
        API_ENDPOINTS.CREATE_ITEM,
        formData,
        { isFormData: true },
      );

      if (response.ok) {
        toast.success("✅ تمت إضافة الصنف بنجاح");
        setIsModalOpen(false);
        fetchItems();
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
       
      // فقط إذا كانت صورة جديدة
      if (newItem.item_img && typeof newItem.item_img !== "string") {
        formData.append("item_img", newItem.item_img);
      }

      const response = await updateItem(
        `${API_BASE_URL}api_update_item/${newItem.id}`,
        formData,
        { method: "PATCH", isFormData: true },
      );

      if (response.ok) {
        toast.success("✅ تم تعديل الصنف بنجاح");
        setIsModalOpen(false);
        fetchItems();
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
        const updatedItems = await (
          await apiFetch(`${API_BASE_URL}cat_items_list/`)
        ).json();

        setItems(updatedItems);
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
    <div className="p-2 space-y-2 font-cairo text-sm">
      <div className="flex justify-between items-center mb-1">
        <h1 className="text-xl font-bold">الفئات</h1>
        <Button color="default" className="mb-2 text-xs" onClick={() => setIsModalOpen(true)}>
          إضافة صنف جديد
        </Button>
      </div>
      <div className="bg-white rounded-3xl shadow-md p-2 min-h-[180px] flex flex-col justify-between">
        {/* جدول الفئات */}
        <Table aria-label="جدول الفئات" removeWrapper>
          <TableHeader>
            <TableColumn>الفئة</TableColumn>
            <TableColumn>العيار</TableColumn>
            <TableColumn>المعايرة</TableColumn>
            <TableColumn>الصندوق</TableColumn>
            <TableColumn>الضريبة</TableColumn>
            <TableColumn>النوع</TableColumn>
            <TableColumn>حالة الفئة</TableColumn>
          </TableHeader>
          <TableBody>
            {pagedCategories.map((cat) => (
              <TableRow
                key={cat.id}
                className={`cursor-pointer ${selectedCatId === cat.id ? "bg-green-100" : ""}`}
                onClick={() => setSelectedCatId(cat.id)}
              >
                <TableCell>{cat.cat_name}</TableCell>
                <TableCell>{cat.gauge}</TableCell>
                <TableCell>{cat.purity}</TableCell>
                <TableCell>{boxes.find((b) => b.id === cat.box)?.box_name || "-"}</TableCell>
                <TableCell>{cat.tax}</TableCell>
                <TableCell>{catTypes.find((t) => t.code_id === cat.cat_type)?.code_desc || "-"}</TableCell>
                <TableCell>{catStatuses.find((s) => s.code_id === cat.cat_status)?.code_desc || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-between items-center py-1">
        <span className="text-sm text-gray-500">عدد الفئات: {categories.length}</span>
        <Pagination
          color="primary"
          page={catPage}
          total={totalCatPages}
          onChange={setCatPage}
        />
      </div>
      {/* فلتر نوع الصنف */}
      <div className="flex items-center justify-between mb-1">
        <label className="text-base font-semibold">الأصناف</label>
        <div className="flex items-center gap-2">
          <label className="text-sm">نوع الصنف:</label>
          <select
            aria-label="اختر نوع الصنف"
            className="p-2 border rounded w-full"
            value={selectedTypeId ?? ""}
            onChange={(e) => setSelectedTypeId(Number(e.target.value))}
          >
            <option value="">اختر نوع الصنف</option>
            {itemTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.type_name}
              </option>
            ))}
          </select>
          <Input
            className="w-60 text-sm"
            placeholder="بحث..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="bg-white rounded-3xl shadow-md p-2">
        <Table aria-label="جدول الأصناف" removeWrapper>
          <TableHeader>
            <TableColumn>الكود</TableColumn>
            <TableColumn>الاسم</TableColumn>
            <TableColumn>السعر</TableColumn>
            <TableColumn>الوزن</TableColumn>
            <TableColumn>العيار</TableColumn>
            <TableColumn>المعايرة</TableColumn>
            <TableColumn>التكلفة</TableColumn>
            <TableColumn>نوع الصنف</TableColumn>
            <TableColumn>الوحدة</TableColumn>
            <TableColumn>الحالة</TableColumn>
            <TableColumn>الإجراءات</TableColumn>
          </TableHeader>
          <TableBody>
            {pagedItems.map((item) => {
              const itemType = itemTypes.find((type) => type.id === item.item_type);
              const unitName = units.find((unit) => unit.id === item.unit);
              return (
                <TableRow key={item.id} className="text-center hover:bg-gray-50">
                  <TableCell>{item.item_code || "-"}</TableCell>
                  <TableCell>{item.item_name}</TableCell>
                  <TableCell>{item.item_price || "-"}</TableCell>
                  <TableCell>{item.item_weight || "-"}</TableCell>
                  <TableCell>{item.k || "-"}</TableCell>
                  <TableCell>{item.purity || "-"}</TableCell>
                  <TableCell>{item.first_cost || "-"}</TableCell>
                  <TableCell>{itemType?.type_name || "-"}</TableCell>
                  <TableCell>{unitName?.unit_name || "-"}</TableCell>
                  <TableCell>{ItemStatus.find((t) => t.code_id === item.item_status)?.code_desc || "-"}</TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-2">
                      <Button isIconOnly size="sm" variant="light" className="text-xs" onClick={() => handleViewItem(item)}>
                        <FaEye className="text-blue-500" />
                      </Button>
                      <Button isIconOnly size="sm" variant="light" className="text-xs" onClick={() => handleEditItem(item)}>
                        <FaEdit className="text-yellow-500" />
                      </Button>
                      <Button isIconOnly size="sm" variant="light" className="text-xs" onClick={() => handleDeleteItem(item.id)}>
                        <FaTrash className="text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-between items-center py-1 mt-1">
        <span className="text-sm text-gray-500">عدد الأصناف: {itemsCount}</span>
        <Pagination
          color="primary"
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
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        scrollBehavior="inside"
        size="7xl"
        onClose={() => setIsModalOpen(false)}
      >
        <ModalContent className="font-cairo">
          <ModalHeader>
            {modalMode === "add" && "إضافة صنف جديد"}
            {modalMode === "edit" && "تعديل صنف"}
            {modalMode === "view" && "عرض بيانات الصنف"}
          </ModalHeader>

          <ModalBody className="grid grid-cols-4 gap-4 max-h-[80vh] overflow-y-auto pr-2 text-sm">
            <div className="col-span-4 text-base font-bold border-b pb-2">
              البيانات الأساسية
            </div>
            <Input
              isDisabled={isViewMode}
              label="اسم الصنف"
              value={newItem.item_name}
              onChange={(e) =>
                setNewItem({ ...newItem, item_name: e.target.value })
              }
            />
            <Input
              isDisabled={isViewMode}
              label="اسم الصنف بالإنجليزية"
              value={newItem.item_name_e}
              onChange={(e) =>
                setNewItem({ ...newItem, item_name_e: e.target.value })
              }
              required
            />
            <Input
              isDisabled={isViewMode}
              label="السعر"
              value={newItem.item_price ?? ""}
              onChange={(e) =>
                setNewItem({ ...newItem, item_price: e.target.value })
              }
            />
            <Input
              isDisabled={isViewMode}
              label="سعر التكلفة"
              value={newItem.first_cost ?? ""}
              onChange={(e) =>
                setNewItem({ ...newItem, first_cost: e.target.value })
              }
            />
            <Input
              isDisabled={isViewMode}
              label="كود الصنف"
              value={newItem.item_code}
              onChange={(e) =>
                setNewItem({ ...newItem, item_code: e.target.value })
              }
            />
            <Input
              isDisabled={isViewMode}
              label="باركود الصنف"
              value={newItem.item_barcode ?? ""}
              onChange={(e) =>
                setNewItem({ ...newItem, item_barcode: e.target.value })
              }
            />
            <Input
              isDisabled={isViewMode}
              label="الوزن"
              value={newItem.item_weight ?? ""}
              onChange={(e) =>
                setNewItem({ ...newItem, item_weight: e.target.value })
              }
            />
            <Input
              isDisabled={isViewMode}
              label="الوزن بالجرام"
              value={newItem.item_g_weight ?? ""}
              onChange={(e) =>
                setNewItem({ ...newItem, item_g_weight: e.target.value })
              }
            />
            <Input
              isDisabled={isViewMode}
              label="الحجر"
              value={newItem.stones ?? ""}
              onChange={(e) =>
                setNewItem({ ...newItem, stones: e.target.value })
              }
            />
            <Input
              isDisabled={isViewMode}
              label="الموديل"
              value={newItem.model ?? ""}
              onChange={(e) =>
                setNewItem({ ...newItem, model: e.target.value })
              }
            />
            <Input
              isDisabled={isViewMode}
              label="العيار (K)"
              value={newItem.k ?? ""}
              onChange={(e) => setNewItem({ ...newItem, k: e.target.value })}
            />
            <Input
              isDisabled={isViewMode}
              label="المعايرة"
              value={newItem.purity ?? ""}
              onChange={(e) =>
                setNewItem({ ...newItem, purity: e.target.value })
              }
            />
            <div className="col-span-3">
              <label className="block mb-2 font-medium text-sm">
                صورة الصنف
              </label>
              <div className="flex items-center gap-4">
                <input
                  accept="image/*"
                  className="p-2 border rounded w-full"
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];

                    if (file) {
                      setNewItem({ ...newItem, item_img: file });
                    }
                  }}
                />
                {newItem.item_img && typeof newItem.item_img !== "string" && (
                  <img
                    alt="معاينة الصورة"
                    className="w-16 h-16 object-cover rounded border"
                    src={URL.createObjectURL(newItem.item_img)}
                  />
                )}
              </div>
            </div>
            <div className="col-span-4 text-base font-bold border-b pb-2">
              التصنيفات
            </div>
            <select
              className="p-2 border rounded"
              disabled={isViewMode}
              value={newItem.cat ?? ""}
              onChange={(e) =>
                setNewItem({ ...newItem, cat: Number(e.target.value) })
              }
            >
              <option value="">اختر الفئة</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.cat_name}
                </option>
              ))}
            </select>
            <select
              className="p-2 border rounded"
              disabled={isViewMode}
              value={newItem.item_type ?? ""}
              onChange={(e) =>
                setNewItem({ ...newItem, item_type: Number(e.target.value) })
              }
            >
              <option value="">اختر نوع الصنف</option>
              {itemTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.type_name}
                </option>
              ))}
            </select>
            <select
              className="p-2 border rounded"
              disabled={isViewMode}
              value={newItem.unit ?? ""}
              onChange={(e) =>
                setNewItem({ ...newItem, unit: Number(e.target.value) })
              }
            >
              <option value="">اختر الوحدة</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.unit_name}
                </option>
              ))}
            </select>


            {/* حالة الصنف */}
            <div className="col-span-1">
              <ReactSelect
                isSearchable
                className="w-full text-sm"
                classNamePrefix="heroui"
                components={{
                  IndicatorSeparator: () => null,
                }}
                isDisabled={isViewMode}
                menuPlacement="auto"
                menuPortalTarget={
                  typeof window !== "undefined" ? document.body : null
                }
                menuPosition="fixed"
                options={ItemStatus.map((item1) => ({
                  value: item1.code_id,
                  label: item1.code_desc,
                }))}
                placeholder="حالة الصنف "
                styles={{
                  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                }}
                value={
                  currentItem.item_status
                    ? {
                        value: currentItem.item_status,
                        label:
                          ItemStatus.find(
                            (b) => b.code_id === currentItem.item_status,
                          )?.code_desc || "",
                      }
                    : null
                }
                 onChange={(selectedOption) => {
                  setCurrentItem({
                 ...currentItem,
                 item_status: selectedOption ? Number(selectedOption.value) : undefined,
                   });
                 }}
              />
            </div>

            {/* <div className="col-span-4 text-lg font-bold border-b pb-2">الحالة والمستخدم</div>
      <Input isDisabled label="تاريخ الإضافة" value={newItem.cr_date ?? ""} />
      <Input isDisabled label="أضيف بواسطة" value={newItem.cr_user ?? ""} />
      <Input isDisabled label="تاريخ التعديل" value={newItem.upd_date ?? ""} />
      <Input isDisabled label="عدل بواسطة" value={newItem.upd_user ?? ""} /> */}
            {/* <div className="flex gap-6 items-center col-span-4">
      </div>
      update by moseed, i can update list for item_status  */}{" "}
           
          </ModalBody>

          {modalMode !== "view" && (
            <ModalFooter className="flex justify-end gap-2">
              <Button color="danger" onPress={() => setIsModalOpen(false)}>
                إلغاء
              </Button>
              <Button
                color="success"
                onPress={
                  modalMode === "edit" ? handleUpdateItem : handleAddItem
                }
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
