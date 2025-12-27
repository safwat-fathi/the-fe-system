"use client";

import type { Category, ItemType, Unit } from "@/types/items";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Button, Input, Select, SelectItem } from "@heroui/react";
import {
  FunnelIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";

import { useQueryParams } from "@/utilities/hooks/useQueryParams";

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

export type ItemsFilterProps = {
  categories: Category[];
  itemTypes: ItemType[];
  units: Unit[];
};

export default function ItemsFilter({
  categories,
  itemTypes,
}: ItemsFilterProps) {
  const router = useRouter();
  const t = useTranslations("basic.items" as any) as any;
  const [isPending, startTransition] = useTransition();

  const [searchValue, setSearchValue] = useState("");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

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
      refreshOnChange: true,
      debounce: 0,
    },
  );

  useEffect(() => {
    setSearchValue(params.search || "");
  }, [params.search]);

  const ITEM_STATUS_FILTERS = useMemo(
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

  const itemTypeOptions = useMemo(
    () =>
      itemTypes.map(({ id, type_name }) => ({
        key: String(id),
        label: type_name,
      })),
    [itemTypes],
  );

  const clearFilters = () => {
    setSearchValue("");
    startTransition(() =>
      setParams({
        category: "",
        itemType: "",
        status: "all",
        page: "1",
        search: "",
      }),
    );
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      startTransition(() =>
        setParams({
          search: value,
          page: "1",
        }),
      );
    }, 400);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Prefetch the "new item" page when the browser is idle
  useEffect(() => {
    const idleCallback = window.requestIdleCallback
      ? window.requestIdleCallback
      : (cb: () => void) => setTimeout(cb, 1);

    const handle = idleCallback(() => {
      router.prefetch("/basic/items/new");
    });

    return () => {
      if (window.cancelIdleCallback) {
        window.cancelIdleCallback(handle as number);
      }
    };
  }, [router]);

  return (
    <div className="flex-shrink-0 flex flex-wrap items-center gap-1.5 mb-1">
      {/* زر إضافة صنف */}
      <Link href="/basic/items/new" prefetch={false}>
        <Button
          className="bg-gray-100 hover:bg-gray-200 border-gray-300"
          size="sm"
          startContent={<PlusIcon className="h-3 w-3" />}
          variant="bordered"
        >
          {t("actions.add")}
        </Button>
      </Link>

      {/* فاصل خطي */}
      <div className="h-5 w-px bg-gray-300" />

      {/* حقول الفرز */}
      <div className="flex flex-wrap items-center gap-1 flex-1">
        <Select
          aria-label={t("labels.selectCategory")}
          className="input-field flex-1 min-w-[90px]"
          placeholder={t("labels.selectCategory")}
          size="sm"
          selectedKeys={
            params.category ? new Set([params.category]) : new Set()
          }
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
          selectedKeys={
            params.itemType ? new Set([params.itemType]) : new Set()
          }
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
          selectedKeys={new Set([params.status || "all"])}
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
            isPending ? (
              <div className="h-3 w-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <MagnifyingGlassIcon className="h-3 w-3 text-gray-400" />
            )
          }
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>
    </div>
  );
}
