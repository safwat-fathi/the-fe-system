"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { useTranslations, useLocale } from "next-intl";
import {
  Input,
  Button,
  Pagination,
  Select,
  SelectItem,
} from "@heroui/react";

import customerService from "@/services/api/customer.service";
import { ConfirmationModal } from "@/components/Modal";
import AppDataTable from "@/components/AppDataTable";
import { createCustomerColumns } from "@/components/customers/customerColumns";
import {
  CONFIRM_MODAL,
  FONT,
  PAGE_SIZE_OVERRIDES,
  PAGINATION_BAR,
  TABLE_STYLE,
  TOOLBAR,
} from "@/constants/ui";
import { getLocaleDir } from "@/i18n/config";
import { useQueryParams } from "@/utilities/hooks/useQueryParams";

interface Customer {
  id: number;
  cust_code?: string;
  cust_name: string;
  cust_name_e: string;
  mobile: number | string;
  email: string;
  address: string;
  vat_no: number | null;
  cr_no: number | null;
  phone: string;
  fax: string;
  gov: string;
  city: string;
  area: string;
  street: string;
  build_no: string;
  post_code: string;
  cust_status: number;
  acc?: number;
  acc_name?: string;
  cust_type?: number;
  box_type: string;
  handling: string;
  handling_e?: string;
  perc?: number;
  expt?: boolean;
  hide?: boolean;
}

interface CustomerType {
  id: number;
  type_name: string;
}

interface CustomersClientProps {
  initialCustomers: Customer[];
  initialCustomerTypes: CustomerType[];
  initialCustomerStatus: any[];
  totalCount: number;
  initialPage: number;
  initialCustType: number | null;
}

export default function CustomersClient({
  initialCustomers,
  initialCustomerTypes,
  initialCustomerStatus,
  totalCount,
  initialPage,
  initialCustType,
}: CustomersClientProps) {
  const router = useRouter();
  const locale = useLocale();
  const dir = getLocaleDir(locale as "ar" | "en");
  const textAlign = dir === "rtl" ? "text-right" : "text-left";
  const t = useTranslations("basic.customers" as any) as any;

  const { params, setParam, setParams } = useQueryParams(
    ["page", "cust_type"],
    {
      defaultValues: { page: initialPage, cust_type: initialCustType },
      schema: {
        page: {
          parse: (v) => Math.max(1, Number(v) || 1),
          serialize: (v) => String(v),
          default: 1,
        },
        cust_type: {
          parse: (v) =>
            v === "all" || v === "" || v === null ? undefined : Number(v),
          serialize: (v) => (v == null ? "" : String(v)),
          default: undefined,
        },
      },
      refreshOnChange: true,
    },
  );

  const [customerTypes] = useState<CustomerType[]>(initialCustomerTypes);
  const [customerStatus] = useState<any[]>(initialCustomerStatus);
  const [search, setSearch] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(
    null,
  );

  const page = Number(params.page) || 1;
  const custTypeFilter = params.cust_type ?? null;
  const pageSize = PAGE_SIZE_OVERRIDES.customers;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  const handleDeleteClick = useCallback(
    (customer: Customer) => {
      if (!customer.id) {
        toast.error(t("messages.deleteErrorNoId"));

        return;
      }

      setCustomerToDelete(customer);
      setDeleteModalOpen(true);
    },
    [t],
  );

  const getStatusLabel = useCallback(
    (status: number) => {
      const statusObj = customerStatus.find((t) => t.code_id === status);

      return statusObj?.code_desc || "-";
    },
    [customerStatus],
  );

  const columns = useMemo(
    () =>
      createCustomerColumns({
        getStatusLabel,
        onDelete: handleDeleteClick,
        t,
      }),
    [getStatusLabel, handleDeleteClick, t],
  );

  const customerTypeOptions = useMemo(
    () => [
      { key: "all", label: t("labels.allTypes") },
      ...customerTypes.map((type) => ({
        key: String(type.id),
        label: type.type_name,
      })),
    ],
    [customerTypes, t],
  );

  const handleDeleteConfirm = async () => {
    if (!customerToDelete?.id) {
      setDeleteModalOpen(false);
      setCustomerToDelete(null);

      return;
    }

    try {
      const result = await customerService.deleteCustomer(customerToDelete.id);

      if (result) {
        toast.success(t("messages.deleteSuccess"));
        router.refresh();
      } else {
        toast.error(t("messages.deleteFailed"));
      }
    } catch {
      toast.error(t("messages.deleteError"));
    } finally {
      setDeleteModalOpen(false);
      setCustomerToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setCustomerToDelete(null);
  };

  const tableData = useMemo(() => {
    if (!search.trim()) return initialCustomers;

    const searchLower = search.toLowerCase();

    return initialCustomers.filter((c) => {
      const fieldsToSearch = [
        c.cust_code?.toString(),
        c.cust_name,
        c.cust_name_e,
        c.mobile?.toString(),
        c.email,
        c.vat_no?.toString(),
        c.cr_no?.toString(),
        c.phone,
        c.fax,
        c.address,
        c.gov,
        c.city,
        c.area,
        c.street,
        c.build_no,
        c.post_code,
        c.handling,
      ];

      return fieldsToSearch.some((field) =>
        field?.toString().toLowerCase().includes(searchLower),
      );
    });
  }, [initialCustomers, search]);

  const clearFilters = () => {
    setSearch("");
    setParams({ cust_type: undefined, page: 1 });
  };

  return (
    <>
      <div className={TOOLBAR.root}>
        <Button
          className={TOOLBAR.addButton}
          variant={TOOLBAR.addButtonVariant}
          onPress={() => router.push("/basic/customers/new")}
        >
          <PlusIcon className={TOOLBAR.iconAdd} />
          {t("actions.add")}
        </Button>

        <div className={TOOLBAR.divider} />

        <div className="flex flex-wrap items-center gap-1 flex-1 min-w-[200px]">
          <Select
            aria-label={t("labels.customerType")}
            items={customerTypeOptions}
            className="input-field flex-1 min-w-[90px]"
            placeholder={t("labels.customerType")}
            size={TOOLBAR.inputSize}
            selectedKeys={
              custTypeFilter !== null ? [String(custTypeFilter)] : ["all"]
            }
            onSelectionChange={(keys) => {
              const key = Array.from(keys)[0] as string;

              setParams({
                cust_type: key === "all" ? undefined : Number(key),
                page: 1,
              });
            }}
          >
            {(option) => (
              <SelectItem key={option.key} textValue={option.label}>
                {option.label}
              </SelectItem>
            )}
          </Select>

          <Button
            isIconOnly
            size={TOOLBAR.inputSize}
            title={t("labels.clearFilters")}
            variant="bordered"
            onPress={clearFilters}
          >
            <FunnelIcon className={TOOLBAR.iconAdd} />
          </Button>
        </div>

        <div className={TOOLBAR.divider} />

        <div className={TOOLBAR.searchWrapper}>
          <Input
            placeholder={t("labels.searchPlaceholder")}
            size={TOOLBAR.inputSize}
            startContent={
              <MagnifyingGlassIcon className={TOOLBAR.iconSearch} />
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <AppDataTable
        bare
        className={FONT.table}
        columns={columns}
        data={tableData}
        emptyContent={t("labels.emptyContent")}
        filterable={false}
        searchable={false}
        tableClassNames={TABLE_STYLE}
      />

      <div className={PAGINATION_BAR.root}>
        <span className={`${PAGINATION_BAR.countText} ${textAlign}`}>
          {t("labels.totalCount", { count: totalCount })}
        </span>
        <Pagination
          color={PAGINATION_BAR.color}
          page={page}
          total={totalPages}
          onChange={(p) => setParam("page", p)}
        />
      </div>

      <ConfirmationModal
        cancelText={t("modals.cancel")}
        confirmColor={CONFIRM_MODAL.confirmColor}
        confirmText={t("modals.confirm")}
        isOpen={deleteModalOpen}
        message={t("modals.deleteMessage", {
          name: customerToDelete?.cust_name,
        })}
        size={CONFIRM_MODAL.size}
        title={t("modals.deleteTitle")}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
