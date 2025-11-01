"use client";

import type { Category, ItemForm, ItemType, Unit } from "@/types/items";
import type { Item as ItemModel } from "@/types/models/item";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Button, CardBody, Input, Select, SelectItem } from "@heroui/react";
import {
  FunnelIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import AddItem from "./AddItem";

import Card from "@/components/Card";
import AppDataTable from "@/components/AppDataTable";
import { useQueryParams } from "@/utilities/hooks/useQueryParams";
import useFractions, { Fractions } from "@/utilities/useFractions";
import itemService from "@/services/api/item.service";
import { createItemColumns } from "@/components/items/itemColumns";
import { revalidateItemsDataAction } from "@/app/actions/item";

type ModalMode = "add" | "edit" | "view";

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
  search: string;
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
  search: "",
  category: "",
  itemType: "",
  status: "all",
  page: "1",
};

const createEmptyItem = (companyId: number): ItemForm => ({
  id: 0,
  item_name: "",
  item_name_e: "",
  item_price: "0.00",
  item_img: null,
  item_code: "0000000000000",
  item_barcode: "",
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
  com: companyId,
});

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
  const [searchValue, setSearchValue] = useState(initialQuery);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemModel | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("add");
  const [newItem, setNewItem] = useState<ItemForm>(() =>
    createEmptyItem(companyId),
  );

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
    ["search", "category", "itemType", "status", "page"],
    {
      defaultValues: DEFAULT_FILTERS,
      schema: {
        search: {
          parse: (value) => value ?? "",
          serialize: (value) => value ?? "",
          default: "",
        },
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
      refreshOnChange: true,
      debounce: 350,
    },
  );

  useEffect(() => {
    setItems(initialItems);
    setItemsCount(totalItems);
  }, [initialItems, totalItems]);

  useEffect(() => {
    setSearchValue(params.search ?? "");
  }, [params.search]);

  const handleOpenAddModal = () => {
    setModalMode("add");
    setNewItem(createEmptyItem(companyId));
    setIsModalOpen(true);
  };

  const handleAddItem = async () => {
    if (!(newItem.item_img instanceof File)) {
      toast.error("❌ يجب رفع صورة للصنف قبل الحفظ");

      return;
    }

    try {
      const result = await itemService.createItem(newItem);

      if (result) {
        toast.success("✅ تمت إضافة الصنف بنجاح");
        setIsModalOpen(false);
        setNewItem(createEmptyItem(companyId));
        await revalidateItemsDataAction();
        // await refreshItems();
      } else {
        toast.error("❌ فشل في إضافة الصنف");
      }
    } catch (error) {
      toast.error("❌ حدث خطأ أثناء إضافة الصنف");
    }
  };

  const handleUpdateItem = () => {
    toast("تعديل الأصناف غير متاح حالياً", { icon: "ℹ️" });
  };

  const filteredItems = useMemo(() => {
    const term = (params.search ?? "").trim().toLowerCase();
    const categoryFilter = params.category?.trim();
    const typeFilter = params.itemType?.trim();
    const statusFilter = params.status ?? "all";

    return items.filter((item) => {
      const matchesSearch =
        term.length === 0 ||
        (item.item_name ?? "").toLowerCase().includes(term) ||
        (item.item_code ?? "").toLowerCase().includes(term) ||
        (item.item_name_e ?? "").toLowerCase().includes(term);

      const matchesCategory =
        !categoryFilter || String(item.cat ?? "") === categoryFilter;

      const matchesType =
        !typeFilter || String(item.item_type ?? "") === typeFilter;

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
            ? Number(item.item_status ?? 0) === 1
            : Number(item.item_status ?? 0) !== 1;

      return matchesSearch && matchesCategory && matchesType && matchesStatus;
    });
  }, [items, params]);

  const columns = useMemo(
    () =>
      createItemColumns({
        fractions,
        getCategoryLabel: (value) =>
          value != null ? (categoryLookup.get(Number(value)) ?? "-") : "-",
        getItemTypeLabel: (value) =>
          value != null ? (itemTypeLookup.get(Number(value)) ?? "-") : "-",
        onView: (item) => {
          setSelectedItem(item);
          setIsDetailsOpen(true);
        },
        onEdit: () => {
          toast("تحرير الأصناف سيضاف لاحقاً", { icon: "ℹ️" });
        },
        onDelete: () => {
          toast("حذف الأصناف غير متاح حالياً", { icon: "ℹ️" });
        },
      }),
    [fractions, categoryLookup, itemTypeLookup],
  );

  const clearFilters = () => {
    setSearchValue("");

    startTransition(() =>
      setParams({
        search: "",
        category: "",
        itemType: "",
        status: "all",
        page: "1",
      }),
    );
  };

  const selectedCategoryLabel =
    selectedItem?.cat != null
      ? (categoryLookup.get(Number(selectedItem.cat)) ?? "-")
      : "-";

  const selectedItemTypeLabel =
    selectedItem?.item_type != null
      ? (itemTypeLookup.get(Number(selectedItem.item_type)) ?? "-")
      : "-";

  return (
    <>
      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl text-right font-semibold text-gray-800">
                إدارة الأصناف
              </h2>
              <p className="text-sm text-gray-500">
                ابحث، فرّز، وتابع الأصناف المسجلة في النظام.
              </p>
            </div>
            <Button
              startContent={<PlusIcon className="h-4 w-4" />}
              onPress={handleOpenAddModal}
            >
              إضافة صنف
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Input
              className="input-field"
              endContent={
                isPending ? (
                  <span className="text-xs text-gray-400">جاري التحديث…</span>
                ) : undefined
              }
              placeholder="البحث بالاسم أو الكود..."
              startContent={<MagnifyingGlassIcon className="h-4 w-4" />}
              value={searchValue}
              onChange={(event) => {
                const value = event.target.value;

                setSearchValue(value);

                startTransition(() => setParams({ page: "1", search: value }));
              }}
            />

            <Select
              className="input-field"
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
              className="input-field"
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
              className="input-field"
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
          </div>

          <div>
            <Button
              className="btn-secondary"
              startContent={<FunnelIcon className="h-4 w-4" />}
              variant="bordered"
              onPress={clearFilters}
            >
              مسح الفلاتر
            </Button>
          </div>
        </CardBody>
      </Card>

      <div className="my-4 flex flex-col gap-2 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
        <span>
          إجمالي الأصناف:{" "}
          <strong className="font-semibold text-gray-800">{itemsCount}</strong>
        </span>
        {/* <span>
          الصفحة الحالية:{" "}
          <strong className="font-semibold text-gray-800">
            {currentPage} / {Math.max(totalPages, 1)}
          </strong>
        </span>
        <span>
          عناصر الصفحة الحالية:{" "}
          <strong className="font-semibold text-gray-800">
            {filteredItems.length}
          </strong>
        </span> */}
      </div>

      <AppDataTable
        className="card"
        columns={columns}
        data={filteredItems}
        emptyContent={
          params.search
            ? "لا توجد أصناف مطابقة لبحثك."
            : "لم يتم العثور على أصناف."
        }
        filterable={false}
        searchable={false}
        title={`قائمة الأصناف (${itemsCount} صنف)`}
      />

      <AddItem
        categories={categories}
        isOpen={isModalOpen}
        item={newItem}
        itemTypes={itemTypesState}
        mode={modalMode}
        units={units}
        onAdd={handleAddItem}
        onChange={setNewItem}
        onClose={() => setIsModalOpen(false)}
        onUpdate={handleUpdateItem}
      />
    </>
  );
}
