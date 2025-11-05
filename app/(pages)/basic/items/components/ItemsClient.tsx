"use client";

import type { Category, ItemType, Unit } from "@/types/items";
import type { Item as ItemModel } from "@/types/models/item";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Button, Input, Select, SelectItem, Pagination } from "@heroui/react";
import {
  FunnelIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import { useRouter } from "next/navigation";

import AppDataTable from "@/components/AppDataTable";
import { useQueryParams } from "@/utilities/hooks/useQueryParams";
import useFractions, { Fractions } from "@/utilities/useFractions";
import itemService from "@/services/api/item.service";
import { createItemColumns } from "@/components/items/itemColumns";
import { revalidateItemsDataAction } from "@/app/actions/item";


type ItemsClientProps = {
  initialItems: ItemModel[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  initialQuery: string;
  initialCategories: Category[];
  initialItemTypes: ItemType[];
  initialUnits: Unit[];
  companyId: number;
};

type FilterParams = {
  category: string;
  itemType: string;
  status: string;
  page: string;
};

const ITEM_STATUS_FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "كل الحالات" },
  { key: "active", label: "فعال" },
  { key: "inactive", label: "غير فعال" },
];

const DEFAULT_FILTERS: FilterParams = {
  category: "",
  itemType: "",
  status: "all",
  page: "1",
};


export default function ItemsClient({
  initialItems,
  totalItems,
  totalPages,
  currentPage,
  initialQuery,
  initialCategories,
  initialItemTypes,
  initialUnits,
  companyId,
}: ItemsClientProps) {
  const [items, setItems] = useState<ItemModel[]>(initialItems);
  const [itemsCount, setItemsCount] = useState(totalItems);
  const [categories] = useState<Category[]>(initialCategories);
  const [itemTypesState] = useState<ItemType[]>(initialItemTypes);
  const [units] = useState<Unit[]>(initialUnits);
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");
  const [, startTransition] = useTransition();

  const fractions = useFractions() as Fractions;

  const categoryOptions = useMemo(
    () =>
      categories.map(({ id, cat_name }) => ({
        key: String(id),
        label: cat_name,
      })),
    [categories],
  );

  const categoryLookup = useMemo(() => {
    const lookup = new Map<number, string>();

    categories.forEach((category) => {
      lookup.set(category.id, category.cat_name);
    });

    return lookup;
  }, [categories]);

  const itemTypeOptions = useMemo(
    () =>
      itemTypesState.map(({ id, type_name }) => ({
        key: String(id),
        label: type_name,
      })),
    [itemTypesState],
  );

  const itemTypeLookup = useMemo(() => {
    const lookup = new Map<number, string>();

    itemTypesState.forEach((type) => {
      lookup.set(type.id, type.type_name);
    });

    return lookup;
  }, [itemTypesState]);

  const { params, setParams } = useQueryParams<FilterParams>(
    ["category", "itemType", "status", "page"],
    {
      defaultValues: DEFAULT_FILTERS,
      schema: {
        category: {
          parse: (value) => value ?? "",
          serialize: (value) => value ?? "",
          default: "",
        },
        itemType: {
          parse: (value) => value ?? "",
          serialize: (value) => value ?? "",
          default: "",
        },
        status: {
          parse: (value) => value ?? "all",
          serialize: (value) => value ?? "all",
          default: "all",
        },
        page: {
          parse: (value) => value ?? "1",
          serialize: (value) => value ?? "1",
          default: "1",
        },
      },
      pushMode: "replace",
      refreshOnChange: true, // تفعيل refresh عند تغيير الفلاتر
      debounce: 0, // بدون debounce لأننا لا نستخدم البحث
    },
  );

  useEffect(() => {
    setItems(initialItems);
    setItemsCount(totalItems);
  }, [initialItems, totalItems]);

  const handleOpenAddModal = () => {
    router.push("/basic/items/new");
  };


  const handleDeleteItem = async (item: ItemModel) => {
    if (!item.id) {
      toast.error("❌ لا يمكن حذف صنف بدون معرف");
      return;
    }

    if (!confirm(`هل أنت متأكد من حذف الصنف "${item.item_name}"؟`)) {
      return;
    }

    try {
      const result = await itemService.deleteItem(item.id);

      if (result) {
        toast.success("✅ تم حذف الصنف بنجاح");
        await revalidateItemsDataAction();
      } else {
        toast.error("❌ فشل في حذف الصنف");
      }
    } catch (error) {
      toast.error("❌ حدث خطأ أثناء حذف الصنف");
    }
  };

  // Server-side pagination: API يعيد 20 صنف لكل صفحة
  // Client-side pagination: نعرض 10 أصناف من الـ 20 المحملة
  // حساب صفحة API بناءً على صفحة الجدول
  const itemsPerTablePage = 10; // عدد الأصناف المعروضة في الجدول
  const itemsPerApiPage = 20; // عدد الأصناف التي يعيدها API
  const currentPageNum = Number(params.page ?? "1") || 1;
  
  // حساب صفحة API: كل صفحتين من الجدول = صفحة واحدة من API
  const apiPage = Math.ceil(currentPageNum / 2);
  // حساب الفهرس داخل صفحة API
  const indexInApiPage = ((currentPageNum - 1) % 2) * itemsPerTablePage;
  
  // جلب البيانات عند تغيير صفحة API أو الفلاتر
  // لا نجلب في التحميل الأولي لأن البيانات محملة من server component
  const prevApiPageRef = useRef(0); // تهيئة بـ 0 لتجنب الجلب في التحميل الأولي
  const prevCategoryRef = useRef(params.category);
  const prevItemTypeRef = useRef(params.itemType);
  const prevStatusRef = useRef(params.status);

  useEffect(() => {
    const apiPageChanged = prevApiPageRef.current !== apiPage;
    const categoryChanged = prevCategoryRef.current !== params.category;
    const itemTypeChanged = prevItemTypeRef.current !== params.itemType;
    const statusChanged = prevStatusRef.current !== params.status;

    // فقط إذا تغيرت صفحة API أو الفلاتر (وليس في التحميل الأولي)
    if (apiPageChanged || categoryChanged || itemTypeChanged || statusChanged) {
      const fetchItems = async () => {
        try {
          const itemsData = await itemService.searchItems({
            page: apiPage,
            companyId,
            categoryId: params.category || "0",
            itemTypeId: params.itemType || "0",
            itemStatus:
              params.status === "active"
                ? "1"
                : params.status === "inactive"
                  ? "2"
                  : "0",
          });

          if (itemsData.results) {
            setItems(itemsData.results);
            setItemsCount(itemsData.count);
          }
        } catch (error) {
          console.error("Error fetching items:", error);
        }
      };

      fetchItems();
    }

    // تحديث المراجع
    prevApiPageRef.current = apiPage;
    prevCategoryRef.current = params.category;
    prevItemTypeRef.current = params.itemType;
    prevStatusRef.current = params.status;
  }, [apiPage, companyId, params.category, params.itemType, params.status]);

  // Filter items based on search value (client-side filtering)
  const filteredItemsBySearch = useMemo(() => {
    if (!searchValue.trim()) {
      return items;
    }
    const searchTerm = searchValue.trim().toLowerCase();
    return items.filter(
      (item) =>
        (item.item_name || "").toLowerCase().includes(searchTerm) ||
        (item.item_name_e || "").toLowerCase().includes(searchTerm) ||
        (item.item_code || "").toLowerCase().includes(searchTerm)
    );
  }, [items, searchValue]);

  const paginatedItems = useMemo(() => {
    const start = indexInApiPage;
    const end = start + itemsPerTablePage;
    return filteredItemsBySearch.slice(start, end);
  }, [filteredItemsBySearch, indexInApiPage]);

  const columns = useMemo(
    () =>
      createItemColumns({
        fractions,
        getCategoryLabel: (value) =>
          value != null ? (categoryLookup.get(Number(value)) ?? "-") : "-",
        getItemTypeLabel: (value) =>
          value != null ? (itemTypeLookup.get(Number(value)) ?? "-") : "-",
        onDelete: handleDeleteItem,
      }),
    [fractions, categoryLookup, itemTypeLookup, handleDeleteItem],
  );

  const clearFilters = () => {
    startTransition(() =>
      setParams({
        category: "",
        itemType: "",
        status: "all",
        page: "1",
      }),
    );
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-2">
        {/* زر إضافة صنف */}
        <Button
          variant="bordered"
          startContent={<PlusIcon className="h-4 w-4" />}
          onPress={handleOpenAddModal}
          className="bg-gray-100 hover:bg-gray-200 border-gray-300"
        >
          إضافة صنف
        </Button>

        {/* فاصل خطي */}
        <div className="h-8 w-px bg-gray-300" />

        {/* حقول الفرز */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <Select
            className="input-field flex-1 min-w-[120px]"
            placeholder="اختر الفئة"
            selectedKeys={params.category ? [params.category] : []}
            onSelectionChange={(keys) =>
              startTransition(() =>
                setParams({
                  category: Array.from(keys)[0]?.toString() ?? "",
                  page: "1",
                }),
              )
            }
          >
            {categoryOptions.map((category) => (
              <SelectItem key={category.key}>{category.label}</SelectItem>
            ))}
          </Select>

          <Select
            className="input-field flex-1 min-w-[120px]"
            placeholder="نوع الصنف"
            selectedKeys={params.itemType ? [params.itemType] : []}
            onSelectionChange={(keys) =>
              startTransition(() =>
                setParams({
                  itemType: Array.from(keys)[0]?.toString() ?? "",
                  page: "1",
                }),
              )
            }
          >
            {itemTypeOptions.map((type) => (
              <SelectItem key={type.key}>{type.label}</SelectItem>
            ))}
          </Select>

          <Select
            className="input-field flex-1 min-w-[120px]"
            placeholder="حالة الصنف"
            selectedKeys={[params.status || "all"]}
            onSelectionChange={(keys) =>
              startTransition(() =>
                setParams({
                  status: Array.from(keys)[0]?.toString() ?? "all",
                  page: "1",
                }),
              )
            }
          >
            {ITEM_STATUS_FILTERS.map((status) => (
              <SelectItem key={status.key}>{status.label}</SelectItem>
            ))}
          </Select>

          <Button
            isIconOnly
            variant="bordered"
            className="h-10"
            onPress={clearFilters}
            title="مسح الفلاتر"
          >
            <FunnelIcon className="h-4 w-4" />
          </Button>
        </div>

        {/* فاصل خطي */}
        <div className="h-8 w-px bg-gray-300" />

        {/* حقل البحث */}
        <div className="w-48">
          <Input
            className="w-full"
            placeholder="بحث بالاسم..."
            value={searchValue}
            onChange={(e) => {
              const value = e.target.value;
              setSearchValue(value);
              startTransition(() => setParams({ page: "1", search: value }));
            }}
            startContent={
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
            }
          />
        </div>
      </div>

      <AppDataTable
        className=""
        columns={columns}
        data={paginatedItems}
        emptyContent="لم يتم العثور على أصناف."
        filterable={false}
        searchable={false}
      />

      {filteredItemsBySearch.length > 0 && (
        <div className="flex justify-center mt-1">
          <Pagination
            showShadow
            color="primary"
            page={currentPageNum}
            total={Math.ceil(filteredItemsBySearch.length / itemsPerTablePage)}
            onChange={(newPage) => {
              startTransition(() =>
                setParams({
                  page: String(newPage),
                }),
              );
            }}
          />
        </div>
      )}

    </>
  );
}
