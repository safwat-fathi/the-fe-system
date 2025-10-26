"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Button, CardBody, Input, Select, SelectItem } from "@heroui/react";
import {
  FunnelIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import Card from "@/components/Card";
import AppDataTable from "@/components/AppDataTable";
import {
  HeroModal as Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
} from "@/components/Modal";
import { useQueryParams } from "@/utilities/hooks/useQueryParams";
import useFractions, { Fractions } from "@/utilities/useFractions";
import { Item } from "@/types/models/item";
import { createItemColumns } from "@/components/items/itemColumns";

type Category = {
  id: number;
  cat_name: string;
};

type ItemType = {
  id: number;
  type_name: string;
};

type ItemsClientProps = {
  initialItems: Item[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  initialQuery: string;
  initialCategories: Category[];
  initialItemTypes: ItemType[];
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

export default function ItemsClient({
  initialItems,
  totalItems,
  totalPages,
  currentPage,
  initialQuery,
  initialCategories,
  initialItemTypes,
}: ItemsClientProps) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [searchValue, setSearchValue] = useState(initialQuery);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isPending, startTransition] = useTransition();

  const fractions = useFractions() as Fractions;

  const categoryOptions = useMemo(
    () =>
      initialCategories.map(({ id, cat_name }) => ({
        key: String(id),
        label: cat_name,
      })),
    [initialCategories],
  );

  const categoryLookup = useMemo(() => {
    const lookup = new Map<number, string>();

    initialCategories.forEach((category) => {
      lookup.set(category.id, category.cat_name);
    });

    return lookup;
  }, [initialCategories]);

  const itemTypeOptions = useMemo(
    () =>
      initialItemTypes.map(({ id, type_name }) => ({
        key: String(id),
        label: type_name,
      })),
    [initialItemTypes],
  );

  const itemTypeLookup = useMemo(() => {
    const lookup = new Map<number, string>();

    initialItemTypes.forEach((type) => {
      lookup.set(type.id, type.type_name);
    });

    return lookup;
  }, [initialItemTypes]);

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
  }, [initialItems]);

  useEffect(() => {
    setSearchValue(params.search ?? "");
  }, [params.search]);

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
              // color="primary"
              startContent={<PlusIcon className="h-4 w-4" />}
              onPress={() =>
                toast("إضافة الأصناف ستتوفر قريباً", { icon: "🛠️" })
              }
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
          <strong className="font-semibold text-gray-800">{totalItems}</strong>
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
        title={`قائمة الأصناف (${totalItems} صنف)`}
      />

      <Modal
        isOpen={isDetailsOpen && Boolean(selectedItem)}
        placement="center"
        size="lg"
        onClose={() => setIsDetailsOpen(false)}
      >
        <ModalContent className="font-cairo">
          <ModalHeader>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                تفاصيل الصنف
              </h3>
              <p className="text-sm text-gray-500">
                استعرض معلومات الصنف المحدد
              </p>
            </div>
          </ModalHeader>
          <ModalBody className="space-y-3">
            {selectedItem ? (
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-gray-500">اسم الصنف</dt>
                  <dd className="text-sm font-medium text-gray-800">
                    {selectedItem.item_name || "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">كود الصنف</dt>
                  <dd className="text-sm font-medium text-gray-800">
                    {selectedItem.item_code || "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">الفئة</dt>
                  <dd className="text-sm font-medium text-gray-800">
                    {selectedCategoryLabel}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">نوع الصنف</dt>
                  <dd className="text-sm font-medium text-gray-800">
                    {selectedItemTypeLabel}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">السعر</dt>
                  <dd className="text-sm font-medium text-gray-800">
                    {selectedItem.item_price ?? "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">الوزن</dt>
                  <dd className="text-sm font-medium text-gray-800">
                    {selectedItem.item_weight ?? "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">الحالة</dt>
                  <dd className="text-sm font-medium text-gray-800">
                    {Number(selectedItem.item_status ?? 0) === 1
                      ? "فعال"
                      : "غير فعال"}
                  </dd>
                </div>
              </dl>
            ) : null}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
