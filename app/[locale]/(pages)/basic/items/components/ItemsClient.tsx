"use client";

import type { Category, ItemType, Unit } from "@/types/items";
import type { Item as ItemModel } from "@/types/models/item";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  useCallback,
  useDeferredValue,
} from "react";
import { Button, Input, Select, SelectItem, Pagination } from "@heroui/react";
import {
  FunnelIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import AppDataTable from "@/components/AppDataTable";
import { useQueryParams } from "@/utilities/hooks/useQueryParams";
import useFractions, { Fractions } from "@/utilities/useFractions";
import itemService from "@/services/api/item.service";
import { createItemColumns } from "@/components/items/itemColumns";
import { ConfirmationModal } from "@/components/Modal";

type ItemsClientProps = {
  initialItems: ItemModel[];
  totalItems: number;
  initialCategories: Category[];
  initialItemTypes: ItemType[];
  initialUnits: Unit[];
  companyId: number;
  currentPage?: number;
  initialQuery?: string;
  totalPages?: number;
};

type FilterParams = {
  category: string;
  itemType: string;
  status: string;
  page: string;
  search: string;
};

const DEFAULT_FILTERS: FilterParams = {
  category: "",
  itemType: "",
  status: "all",
  page: "1",
  search: "",
};

export default function ItemsClient({
  initialItems,
  totalItems,
  initialCategories,
  initialItemTypes,
  companyId,
}: ItemsClientProps) {
  const router = useRouter();
  const t = useTranslations("basic.items" as any) as any;
  const [items, setItems] = useState<ItemModel[]>(initialItems);
  const [itemsCount, setItemsCount] = useState(totalItems);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [itemTypesState] = useState<ItemType[]>(initialItemTypes);
  const [searchValue, setSearchValue] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [, startTransition] = useTransition();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ItemModel | null>(null);

  // Debounce search value
  const deferredSearch = useDeferredValue(searchValue);

  const fractions = useFractions() as Fractions;

  const ITEM_STATUS_FILTERS: { key: string; label: string }[] = useMemo(
    () => [
      { key: "all", label: t("labels.allStatuses") },
      { key: "active", label: t("labels.active") },
      { key: "inactive", label: t("labels.inactive") },
    ],
    [t],
  );

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
    ["category", "itemType", "status", "page", "search"],
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
        search: {
          parse: (value) => value ?? "",
          serialize: (value) => value ?? "",
          default: "",
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
    setCategories(initialCategories);
  }, [initialItems, totalItems, initialCategories]);

  useEffect(() => {
    setSearchValue(params.search ?? "");
  }, [params.search]);

  const handleOpenAddModal = () => {
    router.push("/basic/items/new");
  };

  const handleDeleteClick = useCallback(
    (item: ItemModel) => {
      if (!item.id) {
        toast.error(t("messages.deleteErrorNoId"));

        return;
      }

      setItemToDelete(item);
      setDeleteModalOpen(true);
    },
    [t],
  );

  const handleDeleteConfirm = async () => {
    if (!itemToDelete?.id) {
      setDeleteModalOpen(false);
      setItemToDelete(null);

      return;
    }

    // Optimistic delete
    setItems((prevItems) => prevItems.filter((i) => i.id !== itemToDelete.id));
    setItemsCount((prevCount) => Math.max(0, prevCount - 1));

    try {
      const result = await itemService.deleteItem(itemToDelete.id);

      if (result) {
        toast.success(t("messages.deleteSuccess"));

        // إعادة التحقق من البيانات في الخلفية
        router.refresh();
      } else {
        toast.error(t("messages.deleteFailed"));
        // إعادة تحميل البيانات في حالة الفشل
        router.refresh();
      }
    } catch (error: any) {
      console.error("Error deleting item:", error);

      // عرض رسالة خطأ واضحة
      const errorMessage = error?.message || t("messages.deleteError");

      toast.error(errorMessage);

      // إعادة تحميل البيانات في حالة الخطأ
      router.refresh();
    } finally {
      setDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  const handleDeleteCancel = useCallback(() => {
    setDeleteModalOpen(false);
    setItemToDelete(null);
  }, []);

  // Server-side pagination: API يعيد 20 صنف لكل صفحة
  // نعرض 20 أصناف من الـ 20 المحملة (لا حاجة لتقسيم إضافي)
  const itemsPerTablePage = 20; // عدد الأصناف المعروضة في الجدول
  const currentPageNum = Number(params.page ?? "1") || 1;

  // حساب صفحة API: كل صفحة من الجدول = صفحة واحدة من API
  const apiPage = currentPageNum;

  // دالة لجلب البيانات من API
  const fetchItems = useCallback(
    async (searchQuery: string = "", pageOverride?: number) => {
      try {
        setIsSearching(true);
        const pageToUse = pageOverride ?? apiPage;
        const itemsData = await itemService.searchItems({
          page: pageToUse,
          companyId,
          categoryId: params.category || "0",
          itemTypeId: params.itemType || "0",
          itemStatus:
            params.status === "active"
              ? "1"
              : params.status === "inactive"
                ? "2"
                : "0",
          query: searchQuery,
        });

        if (itemsData.results) {
          setItems(itemsData.results);
          setItemsCount(itemsData.count);
        }
      } catch (error) {
        console.error("Error fetching items:", error);
        toast.error(t("messages.loadError"));
      } finally {
        setIsSearching(false);
      }
    },
    [apiPage, companyId, params.category, params.itemType, params.status, t],
  );

  // جلب البيانات عند تغيير صفحة API أو الفلاتر
  // لا نجلب في التحميل الأولي لأن البيانات محملة من server component
  const prevApiPageRef = useRef(0); // تهيئة بـ 0 لتجنب الجلب في التحميل الأولي
  const prevCategoryRef = useRef(params.category);
  const prevItemTypeRef = useRef(params.itemType);
  const prevStatusRef = useRef(params.status);
  const prevSearchRef = useRef(deferredSearch);

  // جلب البيانات عند تغيير الفلاتر أو الصفحة
  useEffect(() => {
    const apiPageChanged = prevApiPageRef.current !== apiPage;
    const categoryChanged = prevCategoryRef.current !== params.category;
    const itemTypeChanged = prevItemTypeRef.current !== params.itemType;
    const statusChanged = prevStatusRef.current !== params.status;
    const hasSearch = deferredSearch.trim().length > 0;

    // فقط إذا تغيرت صفحة API أو الفلاتر (وليس في التحميل الأولي)
    // إذا كان هناك بحث، نستخدم البحث، وإلا نستخدم البحث العادي
    if (apiPageChanged || categoryChanged || itemTypeChanged || statusChanged) {
      if (hasSearch) {
        fetchItems(deferredSearch.trim());
      } else {
        fetchItems("");
      }
    }

    // تحديث المراجع
    prevApiPageRef.current = apiPage;
    prevCategoryRef.current = params.category;
    prevItemTypeRef.current = params.itemType;
    prevStatusRef.current = params.status;
  }, [
    apiPage,
    companyId,
    params.category,
    params.itemType,
    params.status,
    deferredSearch,
    fetchItems,
  ]);

  // جلب البيانات عند البحث (server-side search)
  useEffect(() => {
    const searchChanged = prevSearchRef.current !== deferredSearch;

    if (searchChanged) {
      // إعادة تعيين الصفحة إلى 1 عند تغيير البحث
      const shouldResetPage = currentPageNum !== 1;

      if (shouldResetPage) {
        startTransition(() =>
          setParams({
            page: "1",
            search: deferredSearch,
          }),
        );
        // جلب البيانات مع الصفحة 1
        if (!deferredSearch.trim()) {
          fetchItems("", 1);
        } else {
          fetchItems(deferredSearch.trim(), 1);
        }
      } else {
        // إذا لم نغير الصفحة، نجلب البيانات بشكل طبيعي
        if (!deferredSearch.trim()) {
          fetchItems("");
        } else {
          fetchItems(deferredSearch.trim());
        }
      }
    }

    prevSearchRef.current = deferredSearch;
  }, [deferredSearch, fetchItems, currentPageNum, setParams, startTransition]);

  // نعرض كل البيانات المحملة (20 صنف) بدون تقسيم إضافي
  // البحث يتم من server-side الآن
  const paginatedItems = items;

  const columns = useMemo(
    () =>
      createItemColumns({
        fractions,
        getCategoryLabel: (value) =>
          value != null ? (categoryLookup.get(Number(value)) ?? "-") : "-",
        getItemTypeLabel: (value) =>
          value != null ? (itemTypeLookup.get(Number(value)) ?? "-") : "-",
        onDelete: handleDeleteClick,
        t,
      }),
    [fractions, categoryLookup, itemTypeLookup, handleDeleteClick, t],
  );

  const clearFilters = useCallback(() => {
    startTransition(() =>
      setParams({
        category: "",
        itemType: "",
        status: "all",
        page: "1",
        search: "",
      }),
    );
  }, [setParams, startTransition]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-shrink-0 flex flex-wrap items-center gap-1.5 mb-1">
        {/* زر إضافة صنف */}
        <Button
          className="bg-gray-100 hover:bg-gray-200 border-gray-300"
          size="sm"
          startContent={<PlusIcon className="h-3 w-3" />}
          variant="bordered"
          onPress={handleOpenAddModal}
        >
          {t("actions.add")}
        </Button>

        {/* فاصل خطي */}
        <div className="h-5 w-px bg-gray-300" />

        {/* حقول الفرز */}
        <div className="flex flex-wrap items-center gap-1 flex-1">
          <Select
            aria-label={t("labels.selectCategory")}
            className="input-field flex-1 min-w-[90px]"
            placeholder={t("labels.selectCategory")}
            size="sm"
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
            aria-label={t("labels.itemType")}
            className="input-field flex-1 min-w-[90px]"
            placeholder={t("labels.itemType")}
            size="sm"
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
            aria-label={t("labels.status")}
            className="input-field flex-1 min-w-[90px]"
            placeholder={t("labels.status")}
            size="sm"
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
            className="h-7"
            size="sm"
            title={t("labels.clearFilters")}
            variant="bordered"
            onPress={clearFilters}
          >
            <FunnelIcon className="h-3 w-3" />
          </Button>
        </div>

        {/* فاصل خطي */}
        <div className="h-5 w-px bg-gray-300" />

        {/* حقل البحث */}
        <div className="w-36">
          <Input
            className="w-full"
            placeholder={t("labels.searchPlaceholder")}
            size="sm"
            startContent={
              isSearching ? (
                <div className="h-3 w-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <MagnifyingGlassIcon className="h-3 w-3 text-gray-400" />
              )
            }
            value={searchValue}
            onChange={(e) => {
              const value = e.target.value;

              setSearchValue(value);
              startTransition(() => setParams({ page: "1", search: value }));
            }}
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0 overflow-hidden">
          <AppDataTable
            className="h-full"
            columns={columns}
            data={paginatedItems}
            emptyContent={t("labels.emptyContent")}
            filterable={false}
            searchable={false}
          />
        </div>

        {itemsCount > 0 && (
          <div className="flex-shrink-0 flex justify-center py-1">
            <Pagination
              showShadow
              color="primary"
              size="sm"
              page={currentPageNum}
              total={Math.ceil(itemsCount / itemsPerTablePage)}
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
      </div>

      <ConfirmationModal
        cancelText={t("modals.cancel")}
        confirmColor="danger"
        confirmText={t("modals.confirm")}
        isOpen={deleteModalOpen}
        message={t("modals.deleteMessage", { name: itemToDelete?.item_name })}
        size="md"
        title={t("modals.deleteTitle")}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
