"use client";

import type { Category, ItemType } from "@/types/items";
import type { Item as ItemModel } from "@/types/models/item";

import {
  useEffect,
  useMemo,
  useState,
  useTransition,
  useCallback,
} from "react";
import { Pagination } from "@heroui/react";
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
  companyId: number;
  currentPage?: number;
  initialQuery?: string;
  totalPages?: number;
};

type FilterParams = {
  page: string;
};

const DEFAULT_FILTERS: FilterParams = {
  page: "1",
};

export default function ItemsClient({
  initialItems,
  totalItems,
  initialCategories,
  initialItemTypes,
}: ItemsClientProps) {
  const router = useRouter();
  const t = useTranslations("basic.items" as any) as any;
  const [items, setItems] = useState<ItemModel[]>(initialItems);
  const [itemsCount, setItemsCount] = useState(totalItems);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [itemTypesState] = useState<ItemType[]>(initialItemTypes);
  const [, startTransition] = useTransition();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ItemModel | null>(null);

  const fractions = useFractions() as Fractions;

  const categoryLookup = useMemo(() => {
    const lookup = new Map<number, string>();

    categories.forEach((category) => {
      lookup.set(category.id, category.cat_name);
    });

    return lookup;
  }, [categories]);

  const itemTypeLookup = useMemo(() => {
    const lookup = new Map<number, string>();

    itemTypesState.forEach((type) => {
      lookup.set(type.id, type.type_name);
    });

    return lookup;
  }, [itemTypesState]);

  const { params, setParams } = useQueryParams<FilterParams>(["page"], {
    defaultValues: DEFAULT_FILTERS,
    schema: {
      page: {
        parse: (value) => value ?? "1",
        serialize: (value) => value ?? "1",
        default: "1",
      },
    },
    pushMode: "replace",
    refreshOnChange: true,
    debounce: 0,
  });

  useEffect(() => {
    setItems(initialItems);
    setItemsCount(totalItems);
    setCategories(initialCategories);
  }, [initialItems, totalItems, initialCategories]);

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
  const itemsPerTablePage = 20;
  const currentPageNum = Number(params.page ?? "1") || 1;

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

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0 overflow-hidden">
          <AppDataTable
            className="h-full"
            columns={columns}
            data={items}
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
