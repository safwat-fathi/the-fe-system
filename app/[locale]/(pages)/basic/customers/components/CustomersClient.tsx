"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Button,
  Pagination,
  Select,
  SelectItem,
} from "@heroui/react";

import customerService from "@/services/api/customer.service";
import { ConfirmationModal } from "@/components/Modal";

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
  const rowsPerPage = 12;

  const columns = useMemo(
    () => [
      { name: t("columns.custCode"), uid: "cust_code" },
      { name: t("columns.custName"), uid: "cust_name" },
      { name: t("columns.custNameEn"), uid: "cust_name_e" },
      { name: t("columns.mobile"), uid: "mobile" },
      { name: t("columns.email"), uid: "email" },
      { name: t("columns.status"), uid: "cust_status" },
      { name: "", uid: "actions" },
    ],
    [t],
  );

  const customerTypeOptions = useMemo(
    () => [
      { key: "all", label: t("labels.allTypes") },
      ...customerTypes.map((type) => ({
        key: String(type.id),
        label: type.type_name,
      })),
    ],
    [customerTypes],
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

  const handleDeleteClick = (customer: Customer) => {
    if (!customer.id) {
      toast.error(t("messages.deleteErrorNoId"));

      return;
    }

    setCustomerToDelete(customer);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!customerToDelete?.id) {
      setDeleteModalOpen(false);
      setCustomerToDelete(null);

      return;
    }

    // Optimistic delete
    setCustomers((prevCustomers) =>
      prevCustomers.filter((c) => c.id !== customerToDelete.id),
    );

    try {
      const result = await customerService.deleteCustomer(customerToDelete.id);

      if (result) {
        toast.success(t("messages.deleteSuccess"));
        loadCustomers();
      } else {
        toast.error(t("messages.deleteFailed"));
        loadCustomers();
      }
    } catch {
      toast.error(t("messages.deleteError"));
      loadCustomers();
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

  const renderActions = (cust: Customer) => (
    <div className="flex gap-2">
      <Button
        isIconOnly
        size="sm"
        variant="light"
        onPress={() => router.push(`/basic/customers/${cust.id}`)}
      >
        <EyeIcon className="h-4 w-4 text-blue-500" />
      </Button>
      <Button
        isIconOnly
        size="sm"
        variant="light"
        onPress={() => router.push(`/basic/customers/${cust.id}?mode=edit`)}
      >
        <PencilIcon className="h-4 w-4 text-yellow-500" />
      </Button>
      <Button
        isIconOnly
        color="danger"
        size="sm"
        variant="light"
        onPress={() => handleDeleteClick(cust)}
      >
        <TrashIcon className="h-4 w-4" />
      </Button>
    </div>
  );

  const clearFilters = () => {
    setCustTypeFilter(null);
    setSearch("");
  };

  return (
    <div className="responsive-container font-cairo">
      <div className="flex flex-wrap items-center gap-3 mb-2">
        {/* زر إضافة عميل */}
        <Button
          className="bg-gray-100 hover:bg-gray-200 border-gray-300"
          startContent={<PlusIcon className="h-4 w-4" />}
          variant="bordered"
          onPress={() => router.push("/basic/customers/new")}
        >
          {t("actions.add")}
        </Button>

        {/* فاصل خطي */}
        <div className="h-8 w-px bg-gray-300" />

        {/* حقول الفرز */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <Select
            items={customerTypeOptions}
            className="input-field flex-1 min-w-[120px]"
            placeholder={t("labels.customerType")}
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
            className="h-10"
            title={t("labels.clearFilters")}
            variant="bordered"
            onPress={clearFilters}
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
            placeholder={t("labels.searchPlaceholder")}
            startContent={
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="responsive-table">
        <Table aria-label={t("labels.tableAriaLabel")}>
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn key={column.uid}>{column.name}</TableColumn>
            )}
          </TableHeader>
          <TableBody items={paginatedCustomers}>
            {(cust) => (
              <TableRow key={cust.id}>
                <TableCell>{cust.cust_code}</TableCell>
                <TableCell>{cust.cust_name}</TableCell>
                <TableCell>{cust.cust_name_e}</TableCell>
                <TableCell>{cust.mobile}</TableCell>
                <TableCell>{cust.email}</TableCell>
                <TableCell>
                  {customerStatus.find((t) => t.code_id === cust.cust_status)
                    ?.code_desc || "-"}
                </TableCell>
                <TableCell>{renderActions(cust)}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="responsive-pagination">
        <span>
          {t("labels.totalCount", { count: filteredCustomers.length })}
        </span>
        <Pagination
          color="primary"
          page={page}
          total={Math.ceil(filteredCustomers.length / rowsPerPage)}
          onChange={setPage}
        />
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
