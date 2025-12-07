import { createColumnHelper } from "@tanstack/react-table";
import { Button } from "@heroui/react";
import { EyeIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

type Customer = {
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
};

type CreateCustomerColumnsOptions = {
  getStatusLabel: (status: number) => string;
  onDelete: (customer: Customer) => void;
  t: (key: string) => string;
};

const columnHelper = createColumnHelper<Customer>();

export const createCustomerColumns = ({
  getStatusLabel,
  onDelete,
  t,
}: CreateCustomerColumnsOptions) => {
  const ActionsCell = ({ customer }: { customer: Customer }) => {
    const router = useRouter();

    const handleView = () => {
      router.push(`/basic/customers/${customer.id}`);
    };

    const handleEdit = () => {
      router.push(`/basic/customers/${customer.id}?mode=edit`);
    };

    return (
      <div className="flex items-center gap-2">
        <Button isIconOnly size="sm" variant="light" onPress={handleView}>
          <EyeIcon className="h-4 w-4 text-blue-500" />
        </Button>
        <Button isIconOnly size="sm" variant="light" onPress={handleEdit}>
          <PencilIcon className="h-4 w-4 text-yellow-500" />
        </Button>
        <Button
          isIconOnly
          color="danger"
          size="sm"
          variant="light"
          onPress={() => onDelete(customer)}
        >
          <TrashIcon className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  return [
    columnHelper.accessor("cust_code", {
      header: () => t("columns.custCode"),
      cell: (info) => info.getValue() || "-",
      enableSorting: true,
    }),
    columnHelper.accessor("cust_name", {
      header: () => t("columns.custName"),
      cell: (info) => info.getValue() || "-",
      enableSorting: true,
    }),
    columnHelper.accessor("cust_name_e", {
      header: () => t("columns.custNameEn"),
      cell: (info) => info.getValue() || "-",
      enableSorting: true,
    }),
    columnHelper.accessor("mobile", {
      header: () => t("columns.mobile"),
      cell: (info) => info.getValue() || "-",
      enableSorting: true,
    }),
    columnHelper.accessor("email", {
      header: () => t("columns.email"),
      cell: (info) => info.getValue() || "-",
      enableSorting: true,
    }),
    columnHelper.accessor("cust_status", {
      header: () => t("columns.status"),
      cell: (info) => getStatusLabel(info.getValue() ?? 0),
      enableSorting: true,
    }),
    columnHelper.display({
      id: "actions",
      header: () => "",
      cell: ({ row }) => <ActionsCell customer={row.original} />,
    }),
  ];
};

