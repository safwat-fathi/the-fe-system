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
import { Input, Button, Pagination, Select, SelectItem } from "@heroui/react";

import customerService from "@/services/api/customer.service";
import { ConfirmationModal } from "@/components/Modal";
import AppDataTable from "@/components/AppDataTable";
import { createCustomerColumns } from "@/components/customers/customerColumns";
import { getLocaleDir } from "@/i18n/config";
import { usePermissionStore } from "@/stores/permissionStore";

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
  initialAccounts: any[];
  initialBoxTypes: any[];
}

export default function CustomersClient({
  initialCustomers,
  initialCustomerTypes,
  initialCustomerStatus,
}: CustomersClientProps) {
  const router = useRouter();
  const locale = useLocale();
  const dir = getLocaleDir(locale as "ar" | "en");
  const textAlign = dir === "rtl" ? "text-right" : "text-left";
  const t = useTranslations("basic.customers" as any) as any;
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [customerTypes] = useState<CustomerType[]>(initialCustomerTypes);
  const [customerStatus] = useState<any[]>(initialCustomerStatus);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [custTypeFilter, setCustTypeFilter] = useState<number | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(
    null,
  );
  const rowsPerPage = 10;

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

  const ability = usePermissionStore((state) => state.ability);
  const hasActionPermission =
    ability.can("view", "basic.customers") ||
    ability.can("update", "basic.customers") ||
    ability.can("delete", "basic.customers");

  const columns = useMemo(
    () =>
      createCustomerColumns({
        getStatusLabel,
        onDelete: handleDeleteClick,
        t,
        hasActionPermission,
      }),
    [getStatusLabel, handleDeleteClick, t, hasActionPermission],
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

  const loadCustomers = async () => {
    try {
      const data = await customerService.getAllCustomers();

      setCustomers(data as any);
    } catch (error) {
      console.error(t("messages.loadError"), error);
      toast.error(t("messages.loadError"));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!customerToDelete?.id) {
      setDeleteModalOpen(false);
      setCustomerToDelete(null);

      return;
    }

    const previousCustomers = customers;

    // Optimistic delete
    setCustomers((prevCustomers) =>
      prevCustomers.filter((c) => c.id !== customerToDelete.id),
    );

    try {
      const result = await customerService.deleteCustomer(customerToDelete.id);

      if (result) {
        toast.success(t("messages.deleteSuccess"));
        await loadCustomers();
      } else {
        setCustomers(previousCustomers);
        toast.error(t("messages.deleteFailed"));
      }
    } catch {
      setCustomers(previousCustomers);
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

  const filteredCustomers = useMemo(() => {
    const searchLower = search.toLowerCase();

    return customers.filter((c) => {
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

      // فلترة حسب نوع العميل - تحويل القيم إلى أرقام للمقارنة
      const customerTypeMatch =
        !custTypeFilter || Number(c.cust_type) === Number(custTypeFilter);

      return (
        fieldsToSearch.some((field) =>
          field?.toString().toLowerCase().includes(searchLower),
        ) && customerTypeMatch
      );
    });
  }, [customers, search, custTypeFilter]);

  const paginatedCustomers = useMemo(() => {
    const start = (page - 1) * rowsPerPage;

    return filteredCustomers.slice(start, start + rowsPerPage);
  }, [filteredCustomers, page]);

  const clearFilters = () => {
    setCustTypeFilter(null);
    setSearch("");
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex flex-wrap items-center gap-3 mb-2">
        <Button
          className="bg-gray-100"
          variant="bordered"
          onPress={() => router.push("/basic/customers/new")}
        >
          <PlusIcon className="h-3 w-3" />
          {t("actions.add")}
        </Button>

        <div className="h-8 w-px bg-gray-300" />

        <div className="flex flex-wrap items-center gap-1 flex-1 min-w-[200px]">
          <Select
            aria-label={t("labels.customerType")}
            items={customerTypeOptions}
            className="input-field flex-1 min-w-[90px]"
            placeholder={t("labels.customerType")}
            size="sm"
            selectedKeys={
              custTypeFilter !== null ? [String(custTypeFilter)] : ["all"]
            }
            onSelectionChange={(keys) => {
              const key = Array.from(keys)[0];

              setCustTypeFilter(key === "all" ? null : Number(key));
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
            size="sm"
            title={t("labels.clearFilters")}
            variant="bordered"
            onPress={clearFilters}
          >
            <FunnelIcon className="h-3 w-3" />
          </Button>
        </div>

        <div className="h-8 w-px bg-gray-300" />

        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder={t("labels.searchPlaceholder")}
            size="sm"
            startContent={
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0 overflow-hidden">
          <AppDataTable
            className="h-full"
            columns={columns}
            data={paginatedCustomers}
            emptyContent={t("labels.emptyContent")}
            filterable={false}
            searchable={false}
          />
        </div>

        <div className="py-4 flex justify-between items-center">
          <span className={`text-sm text-gray-500 ${textAlign}`}>
            {t("labels.totalCount", { count: filteredCustomers.length })}
          </span>
          <Pagination
            color="primary"
            page={page}
            total={Math.ceil(filteredCustomers.length / rowsPerPage)}
            onChange={setPage}
          />
        </div>
      </div>

      <ConfirmationModal
        cancelText={t("modals.cancel")}
        confirmColor="danger"
        confirmText={t("modals.confirm")}
        isOpen={deleteModalOpen}
        message={t("modals.deleteMessage", {
          name: customerToDelete?.cust_name,
        })}
        size="md"
        title={t("modals.deleteTitle")}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
