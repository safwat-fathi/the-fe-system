"use client";
import { useEffect, useState } from "react";
import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";
import { FaEye, FaEdit, FaTrash } from "react-icons/fa";
import { API_BASE_URL } from "@/utilities/api";
import { API_ENDPOINTS } from "@/utilities/api";
import { Checkbox } from "@heroui/react";
import { useMemo } from "react";


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
  item_status: boolean;
  cancel: boolean;
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const catPerPage = 4;

  const startIndex = (currentPage - 1) * catPerPage;
  const endIndex = startIndex + catPerPage;
  const pagedCategories = categories.slice(startIndex, endIndex);
  const totalPages = Math.ceil(categories.length / catPerPage);

  const [itemsNextUrl, setItemsNextUrl] = useState<string | null>(null);
  const [itemsPrevUrl, setItemsPrevUrl] = useState<string | null>(null);
  const [itemsCount, setItemsCount] = useState<number>(0);

  const [boxes, setBoxes] = useState<{ id: number; box_name: string }[]>([]);
  const [catTypes, setCatTypes] = useState<{ code_id: number; code_desc: string }[]>([]);
  const [catStatuses, setCatStatuses] = useState<{ code_id: number; code_desc: string }[]>([]);


  
  const [newItem, setNewItem] = useState<Item>({
    id: 0,
    item_name: "",
    item_name_e: "",
    item_price: "0.00",
    item_img: "/default.jpg",
    item_code: "0000000000000",
    item_barcode: "",
    first_cost: "",
    item_weight: "",
    item_g_weight: "",
    stones: "",
    model: "",
    k: "",
    purity: "",
    item_status: true,
    cancel: false,
    cr_date: "",
    cr_user: "",
    upd_date: "",
    upd_user: "",
    cat: 0,
    item_type: 0,
    unit: 0
  });
  
  useEffect(() => {
    fetchCategories();
    fetchItems();
    fetchItemTypes();
    fetchUnits();
    fetchBoxes();
    fetchCatTypes();   
    fetchCatStatuses(); 
  }, []);

const fetchCatTypes = async () => {
  try {
    const res = await fetch(API_ENDPOINTS.CatTypeList);
    const data = await res.json();
    setCatTypes(Array.isArray(data.results) ? data.results : []);
  } catch (err) {
    console.error("فشل تحميل أنواع الفئات:", err);
  }
};


const fetchCatStatuses = async () => {
  try {
    const res = await fetch(API_ENDPOINTS.CatStatusList);
    const data = await res.json();
    setCatStatuses(Array.isArray(data.results) ? data.results : []);
  } catch (err) {
    console.error("فشل تحميل حالة الفئات:", err);
  }
};


  const fetchBoxes = async () => {
  try {
    const res = await fetch(API_ENDPOINTS.BOXES_LIST);
    const data = await res.json();
    setBoxes(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error("فشل تحميل الصناديق:", err);
  }
};

  
  const fetchCategories = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.CATEGORIES_LIST);
      const data = await res.json();
      setCategories(data.results || []);
    } catch (err) {
      console.error("خطأ في تحميل الفئات:", err);
    }
  };
  
  const fetchItems = async (url: string = API_ENDPOINTS.ITEMS_LIST) => {
    try {
      const res = await fetch(url);
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

  
  const fetchItemTypes = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.ITEM_TYPES_LIST);
      const data = await res.json();
      setItemTypes(data);
    } catch (err) {
      console.error("خطأ في تحميل أنواع الأصناف:", err);
    }
  };
  
  const fetchUnits = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.UNITS_LIST);
      const data = await res.json();
      setUnits(data);
    } catch (err) {
      console.error("خطأ في تحميل الوحدات:", err);
    }
  };
  

const filteredItems = items.filter((item) => {
  const byCategory = selectedCatId ? item.cat === selectedCatId : true;
  const byType = selectedTypeId ? item.item_type === selectedTypeId : true;
  return byCategory && byType;
});


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
      formData.append("item_status", String(true));
      formData.append("cancel", String(false));
      formData.append("cr_date", new Date().toISOString()); // ✅ التاريخ بصيغة صحيحة
      formData.append("cat", String(newItem.cat));
      formData.append("item_type", String(newItem.item_type));
      formData.append("unit", String(newItem.unit));
      formData.append("item_img", newItem.item_img); // صورة حقيقية من input type="file"
  
      const response = await fetch(API_ENDPOINTS.CREATE_ITEM, {
        method: "POST",
        body: formData,
      });
  
      if (response.ok) {
        alert("✅ تمت إضافة الصنف بنجاح");
        setIsModalOpen(false);
        fetchItems();
      } else {
        const error = await response.json();
        alert("❌ فشل في الإضافة:\n" + JSON.stringify(error));
      }
    } catch (err) {
      alert("❌ حدث خطأ أثناء الإرسال");
    }
  };
  

  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const isViewMode = modalMode === "view";

  const handleEditItem = (item: Item) => {
    setModalMode("edit");
    setNewItem(item); // يعبئ المودال ببيانات الصنف المحدد
    setIsModalOpen(true);
  };

  const handleUpdateItem = async () => {
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
      formData.append("item_status", String(newItem.item_status));
      formData.append("cancel", String(newItem.cancel));
      formData.append("upd_date", new Date().toISOString());
      formData.append("upd_user", "user"); // غيرها إذا في اسم مستخدم
      formData.append("cat", String(newItem.cat));
      formData.append("item_type", String(newItem.item_type));
      formData.append("unit", String(newItem.unit));
  
      // فقط إذا كانت صورة جديدة
      if (newItem.item_img && typeof newItem.item_img !== "string") {
        formData.append("item_img", newItem.item_img);
      }
  
      const response = await fetch(`${API_BASE_URL}api_update_item/${newItem.id}`, {
        method: "PUT",
        body: formData,
      });
  
      if (response.ok) {
        alert("✅ تم تعديل الصنف بنجاح");
        setIsModalOpen(false);
        fetchItems();
      } else {
        const error = await response.json();
        alert("❌ فشل في التعديل:\n" + JSON.stringify(error));
      }
    } catch (err) {
      alert("❌ خطأ أثناء التعديل");
    }
  };
  
  const handleDeleteItem = async (id: number) => {
    const confirmed = confirm("هل تريد حذف هذا الصنف؟");
    if (!confirmed) return;

    try {
      const response = await fetch(`${API_BASE_URL}api_delete_item/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (response.ok) {
        alert("تم حذف الصنف بنجاح ✅");
        const updatedItems = await (await fetch(`${API_BASE_URL}cat_items_list/`)).json();
        setItems(updatedItems);
      } else {
        alert("فشل في حذف الصنف ❌");
      }
    } catch (error) {
      alert("خطأ أثناء الاتصال بالخادم ❌");
    }
  };

  const handleViewItem = (item: Item) => {
    setModalMode("view");
    setNewItem(item);
    setIsModalOpen(true);
  };
  

  return (
    <div className="p-4 space-y-6 font-cairo">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">قائمة الأصناف</h1>
        <Button
  color="success"
  onPress={() => {
    setModalMode("add");
    setNewItem({
      ...newItem,
      cat: selectedCatId ?? 0, 
      item_type: selectedTypeId ?? null,
      unit: null,
      item_img: "/default.jpg",
      item_name: "",
      item_name_e: "",
      item_price: "",
      item_code: "",
      item_barcode: "",
      first_cost: "",
      item_weight: "",
      item_g_weight: "",
      stones: "",
      model: "",
      k: "",
      purity: "",
      item_status: true,
      cancel: false,
      cr_date: "",
      cr_user: "",
      upd_date: "",
      upd_user: ""
    });
    setIsModalOpen(true);
  }}
>
  إضافة صنف جديد
</Button>


      </div>

      {/* جدول الفئات */}
      <div>
        <h2 className="text-xl font-semibold mb-2">الفئات</h2>
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">الفئة</th>
              <th className="p-2 border">العيار</th>
              <th className="p-2 border">المعايرة</th>
              <th className="p-2 border">الصندوق</th>
              <th className="p-2 border">الضريبة</th>
              <th className="p-2 border">النوع</th>
              <th className="p-2 border">حالة الفئة</th>
            </tr>
          </thead>
          <tbody>
          {pagedCategories.map((cat) => (
          <tr
            key={cat.id}
            className={`cursor-pointer hover:bg-gray-200 ${selectedCatId === cat.id ? "bg-green-100" : ""}`}
            onClick={() => setSelectedCatId(cat.id)}
          >
            <td className="p-2 border">{cat.cat_name}</td>
            <td className="p-2 border">{cat.gauge}</td>
            <td className="p-2 border">{cat.purity}</td>
            <td className="p-2 border">{boxes.find((b) => b.id === cat.box)?.box_name || "-"}</td>
            <td className="p-2 border">{cat.tax}</td>
            <td className="p-2 border">{catTypes.find((t) => t.code_id === cat.cat_type)?.code_desc || "-"}</td>
            <td className="p-2 border">{catStatuses.find((s) => s.code_id === cat.cat_status)?.code_desc || "-"}</td>
          </tr>
        ))}
          </tbody>
        </table>
        <div className="flex justify-center mt-4 gap-2">
        <Button
          isDisabled={currentPage === 1}
          onPress={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
        >
          السابق
        </Button>
        <span className="px-4 py-2 text-sm">صفحة {currentPage} من {totalPages}</span>
        <Button
          isDisabled={currentPage === totalPages}
          onPress={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
        >
          التالي
        </Button>
      </div>
      </div>

      {/* فلتر نوع الصنف */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold mb-2">الأصناف</h2>
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
              <option key={type.id} value={type.id}>{type.type_name}</option>
            ))}
          </select>
        </div>
      </div>


<table className="w-full border text-sm">
  <thead>
    <tr className="bg-gray-100 text-center">
      <th className="p-2 border">#</th>
      <th className="p-2 border">الاسم</th>
      <th className="p-2 border">السعر</th>
      <th className="p-2 border">الكود</th>
      <th className="p-2 border">الوزن</th>
      <th className="p-2 border">العيار</th>
      <th className="p-2 border">المعايرة</th>
      <th className="p-2 border">التكلفة</th>
      <th className="p-2 border">نوع الصنف</th>
      <th className="p-2 border">الوحدة</th>
      <th className="p-2 border">الإجراءات</th>
    </tr>
  </thead>
  <tbody>
    {filteredItems.map((item) => {
      const itemType = itemTypes.find((type) => type.id === item.item_type);
      const unitName = units.find((unit) => unit.id === item.unit);
      
      return (
        <tr key={item.id} className="text-center hover:bg-gray-50">
          <td className="p-2 border">{item.id}</td>
          <td className="p-2 border">{item.item_name}</td>
          <td className="p-2 border">{item.item_price || "-"}</td>
          <td className="p-2 border">{item.item_code || "-"}</td>
          <td className="p-2 border">{item.item_weight || "-"}</td>
          <td className="p-2 border">{item.k || "-"}</td>
          <td className="p-2 border">{item.purity || "-"}</td>
          <td className="p-2 border">{item.first_cost || "-"}</td>
          <td className="p-2 border">{itemType?.type_name || "-"}</td>
          <td className="p-2 border">{unitName?.unit_name || "-"}</td>
          <td className="p-2 border">
            <div className="flex justify-center gap-2">
              <Button isIconOnly size="sm" variant="light" onClick={() => handleViewItem(item)}>
                <FaEye className="text-blue-500" />
              </Button>
              <Button isIconOnly size="sm" variant="light" onClick={() => handleEditItem(item)}>
                <FaEdit className="text-yellow-500" />
              </Button>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onClick={() => handleDeleteItem(item.id)}
              >
                <FaTrash className="text-red-500" />
              </Button>
            </div>
          </td>
        </tr>
      );
    })}
  </tbody>
</table>
<div className="flex justify-center mt-4 gap-2">
  <Button isDisabled={!itemsPrevUrl} onPress={() => fetchItems(itemsPrevUrl!)}>السابق</Button>
  <span className="px-4 py-2 text-sm">عدد النتائج: {itemsCount}</span>
  <Button isDisabled={!itemsNextUrl} onPress={() => fetchItems(itemsNextUrl!)}>التالي</Button>
</div>


<Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="7xl" scrollBehavior="inside">
  <ModalContent className="font-cairo">
    <ModalHeader>
      {modalMode === "add" && "إضافة صنف جديد"}
      {modalMode === "edit" && "تعديل صنف"}
      {modalMode === "view" && "عرض بيانات الصنف"}
    </ModalHeader>

    <ModalBody className="grid grid-cols-4 gap-4 max-h-[80vh] overflow-y-auto pr-2">

      <div className="col-span-4 text-lg font-bold border-b pb-2">البيانات الأساسية</div>
      <Input isDisabled={isViewMode} label="اسم الصنف" value={newItem.item_name} onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })} />
      <Input isDisabled={isViewMode} label="اسم الصنف بالإنجليزية" value={newItem.item_name_e} onChange={(e) => setNewItem({ ...newItem, item_name_e: e.target.value })} />
      <Input isDisabled={isViewMode} label="السعر" value={newItem.item_price} onChange={(e) => setNewItem({ ...newItem, item_price: e.target.value })} />
      <Input isDisabled={isViewMode} label="سعر التكلفة" value={newItem.first_cost ?? ""} onChange={(e) => setNewItem({ ...newItem, first_cost: e.target.value })} />

      <Input isDisabled={isViewMode} label="كود الصنف" value={newItem.item_code} onChange={(e) => setNewItem({ ...newItem, item_code: e.target.value })} />
      <Input isDisabled={isViewMode} label="باركود الصنف" value={newItem.item_barcode ?? ""} onChange={(e) => setNewItem({ ...newItem, item_barcode: e.target.value })} />
      <Input isDisabled={isViewMode} label="الوزن" value={newItem.item_weight ?? ""} onChange={(e) => setNewItem({ ...newItem, item_weight: e.target.value })} />
      <Input isDisabled={isViewMode} label="الوزن بالجرام" value={newItem.item_g_weight ?? ""} onChange={(e) => setNewItem({ ...newItem, item_g_weight: e.target.value })} />

      <Input isDisabled={isViewMode} label="الحجر" value={newItem.stones ?? ""} onChange={(e) => setNewItem({ ...newItem, stones: e.target.value })} />
      <Input isDisabled={isViewMode} label="الموديل" value={newItem.model ?? ""} onChange={(e) => setNewItem({ ...newItem, model: e.target.value })} />
      <Input isDisabled={isViewMode} label="العيار (K)" value={newItem.k ?? ""} onChange={(e) => setNewItem({ ...newItem, k: e.target.value })} />
      <Input isDisabled={isViewMode} label="المعايرة" value={newItem.purity ?? ""} onChange={(e) => setNewItem({ ...newItem, purity: e.target.value })} />

            <div className="col-span-3">
        <label className="block mb-2 font-medium text-sm">صورة الصنف</label>
        <div className="flex items-center gap-4">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setNewItem({ ...newItem, item_img: file });
              }
            }}
            className="p-2 border rounded w-full"
          />
          {newItem.item_img && typeof newItem.item_img !== "string" && (
            <img
              src={URL.createObjectURL(newItem.item_img)}
              alt="معاينة الصورة"
              className="w-16 h-16 object-cover rounded border"
            />
          )}
        </div>
      </div>

      <div className="col-span-4 text-lg font-bold border-b pb-2">التصنيفات</div>
      <select className="p-2 border rounded" value={newItem.cat ?? ""} disabled={isViewMode} onChange={(e) => setNewItem({ ...newItem, cat: Number(e.target.value) })}>
        <option value="">اختر الفئة</option>
        {categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.cat_name}</option>))}
      </select>
      <select className="p-2 border rounded" value={newItem.item_type ?? ""} disabled={isViewMode} onChange={(e) => setNewItem({ ...newItem, item_type: Number(e.target.value) })}>
        <option value="">اختر نوع الصنف</option>
        {itemTypes.map((type) => (<option key={type.id} value={type.id}>{type.type_name}</option>))}
      </select>
      <select className="p-2 border rounded" value={newItem.unit ?? ""} disabled={isViewMode} onChange={(e) => setNewItem({ ...newItem, unit: Number(e.target.value) })}>
        <option value="">اختر الوحدة</option>
        {units.map((unit) => (<option key={unit.id} value={unit.id}>{unit.unit_name}</option>))}
      </select>

      {/* <div className="col-span-4 text-lg font-bold border-b pb-2">الحالة والمستخدم</div>
      <Input isDisabled label="تاريخ الإضافة" value={newItem.cr_date ?? ""} />
      <Input isDisabled label="أضيف بواسطة" value={newItem.cr_user ?? ""} />
      <Input isDisabled label="تاريخ التعديل" value={newItem.upd_date ?? ""} />
      <Input isDisabled label="عدل بواسطة" value={newItem.upd_user ?? ""} /> */}

      <div className="flex gap-6 items-center col-span-4">
        <Checkbox isDisabled={isViewMode} isSelected={newItem.item_status} onValueChange={(val) => setNewItem({ ...newItem, item_status: val })}>نشط</Checkbox>
        <Checkbox isDisabled={isViewMode} isSelected={newItem.cancel} onValueChange={(val) => setNewItem({ ...newItem, cancel: val })}>ملغي</Checkbox>
      </div>
    </ModalBody>

    {modalMode !== "view" && (
      <ModalFooter className="flex justify-end gap-2">
        <Button color="danger" onPress={() => setIsModalOpen(false)}>إلغاء</Button>
        <Button color="success" onPress={modalMode === "edit" ? handleUpdateItem : handleAddItem}>
          {modalMode === "edit" ? "تحديث" : "حفظ"}
        </Button>
      </ModalFooter>
    )}
  </ModalContent>
</Modal>

    </div>
  );
}
