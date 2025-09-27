"use client";

import { useQueryParams } from "@/utilities/hooks/useQueryParams";
import { ArrowLeftIcon, ArrowRightIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Button, Pagination } from "@heroui/react";

type Props = { total: number };

const AppPagination = ({ total }: Props) => {
  const { params, setParam } = useQueryParams(["page"], {
    refreshOnChange: true,
    defaultValues: { page: 1 },
    pushMode: "replace",
  });
  console.log("🚀 ~ :15 ~ AppPagination ~ params:", typeof params.page)

  return (
    <div className="flex items-center justify-start gap-4 mt-4">
      <Button
        color="default"
        size="sm"
        onPress={() => setParam("page", Number(params.page) - 1)}
        startContent={<ArrowRightIcon className="w-4 h-4" />}
        disabled={Number(params.page) === 1}
      >
        الصفحة السابقة
      </Button>
      <Pagination
        color="primary"
        page={Number(params.page) || 1}
        total={total}
        onChange={(newPage) =>
          (Number(params.page) !== newPage || newPage >= 1) && setParam("page", newPage)
        }
        initialPage={1}
        showShadow
      />
      <Button
        size="sm"
        color="default"
        endContent={<ArrowLeftIcon className="w-4 h-4" />}
        onPress={() => setParam("page", Number(params.page) + 1)}
        className="responsive-btn"
        disabled={Number(params.page) === total}
      >
        الصفحة التالية
      </Button>
    </div>
  );
};

export default AppPagination;
