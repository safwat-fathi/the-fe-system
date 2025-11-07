import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { Button, Chip } from "@heroui/react";
import { EyeIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

import { Item } from "@/types/models/item";
import { formatAmount } from "@/utilities/formatAmount";
import { Fractions } from "@/utilities/useFractions";

type GetLabelFn = (value: number | null) => string;

type CreateItemColumnsOptions = {
  fractions: Fractions;
  getCategoryLabel: GetLabelFn;
  getItemTypeLabel: GetLabelFn;
  onDelete: (item: Item) => void;
};

const columnHelper = createColumnHelper<Item>();

const renderAmount = (value: Item["item_price"], digits: number) => {
  const numeric = Number(value ?? 0);

  if (Number.isNaN(numeric)) {
    return value ?? "-";
  }

  return formatAmount(numeric, digits);
};

export const createItemColumns = ({
  fractions,
  getCategoryLabel,
  getItemTypeLabel,
  onDelete,
}: CreateItemColumnsOptions): ColumnDef<Item>[] => {
  // Create a component that uses router
  const ActionsCell = ({ item }: { item: Item }) => {
    const router = useRouter();
    
    const handleView = () => {
      router.push(`/basic/items/${item.id}`);
    };
    
    const handleEdit = () => {
      router.push(`/basic/items/${item.id}?mode=edit`);
    };
    
    return (
      <div className="flex items-center gap-2">
        <Button
          isIconOnly
          size="sm"
          variant="light"
          onPress={handleView}
        >
          <EyeIcon className="h-4 w-4 text-blue-500" />
        </Button>
        <Button
          isIconOnly
          size="sm"
          variant="light"
          onPress={handleEdit}
        >
          <PencilIcon className="h-4 w-4 text-yellow-500" />
        </Button>
        <Button
          isIconOnly
          color="danger"
          size="sm"
          variant="light"
          onPress={() => onDelete(item)}
        >
          <TrashIcon className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  return [
  columnHelper.accessor("item_code", {
    header: () => "كود الصنف",
    cell: (info) => info.getValue() || "-",
    enableSorting: true,
  }),
  columnHelper.accessor("item_name", {
    header: () => "اسم الصنف",
    cell: (info) => info.getValue() || "-",
    enableSorting: true,
  }),
  columnHelper.accessor("item_price", {
    header: () => "السعر",
    cell: (info) => renderAmount(info.getValue(), fractions.frac),
    enableSorting: true,
  }),
  columnHelper.accessor("item_weight", {
    header: () => "الوزن",
    cell: (info) => info.getValue() ?? "-",
    enableSorting: true,
  }),
  columnHelper.accessor("cat", {
    header: () => "الفئة",
    cell: (info) => getCategoryLabel(info.getValue() ?? null),
  }),
  columnHelper.accessor("item_type", {
    header: () => "نوع الصنف",
    cell: (info) => getItemTypeLabel(info.getValue() ?? null),
  }),
  columnHelper.accessor("item_status", {
    header: () => "الحالة",
    cell: (info) => {
      const isActive = Number(info.getValue() ?? 0) === 1;

      return (
        <Chip color={isActive ? "success" : "warning"} size="sm" variant="flat">
          {isActive ? "فعال" : "غير فعال"}
        </Chip>
      );
    },
  }),
  columnHelper.display({
    id: "actions",
    header: () => "الإجراءات",
    cell: ({ row }) => <ActionsCell item={row.original} />,
  }),
];
};
