"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { Button, Pagination } from "@heroui/react";

import { useQueryParams } from "@/utilities/hooks/useQueryParams";

type Props = { total: number };

const AppPagination = ({ total }: Props) => {
  const { params, setParam } = useQueryParams(["page"], {
    defaultValues: {
      page: 1,
    },
    schema: {
      page: {
        parse: (value) => Number(value) || 1,
        serialize: (value) => String(value),
        default: 1,
      },
    },
    refreshOnChange: true,
  });

  return (
    <div className="flex items-center justify-start gap-4 mt-4">
      <Button
        color="default"
        disabled={Number(params.page) === 1 || total === 0}
        size="sm"
        startContent={<ArrowRightIcon className="w-4 h-4" />}
        onPress={() => setParam("page", Number(params.page) - 1)}
      >
        الصفحة السابقة
      </Button>
      <Pagination
        showShadow
        color="primary"
        initialPage={1}
        page={Number(params.page) || 1}
        total={total}
        onChange={(newPage) =>
          (Number(params.page) !== newPage || newPage >= 1) &&
          setParam("page", newPage)
        }
      />
      <Button
        className="responsive-btn"
        color="default"
        disabled={Number(params.page) === total || total === 0}
        endContent={<ArrowLeftIcon className="w-4 h-4" />}
        size="sm"
        onPress={() => setParam("page", Number(params.page) + 1)}
      >
        الصفحة التالية
      </Button>
    </div>
  );
};

export default AppPagination;
