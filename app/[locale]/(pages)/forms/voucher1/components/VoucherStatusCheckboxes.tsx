"use client";

import { Checkbox } from "@heroui/react";
import { useTranslations } from "next-intl";

type VoucherStatusCheckboxesProps = {
  commit?: boolean;
  post?: boolean;
  print?: boolean;
};

export default function VoucherStatusCheckboxes({
  commit = false,
  post = false,
  print = false,
}: VoucherStatusCheckboxesProps) {
  const t = useTranslations("forms.cashReceiptVoucher");

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="flex items-center gap-1">
        <Checkbox
          color="success"
          isDisabled
          isSelected={commit}
          size="sm"
        />
        <span className="text-xs text-slate-600">
          {t("status.committed")}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <Checkbox
          color="warning"
          isDisabled
          isSelected={post}
          size="sm"
        />
        <span className="text-xs text-slate-600">
          {t("status.posted")}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <Checkbox
          color="warning"
          isDisabled
          isSelected={print}
          size="sm"
        />
        <span className="text-xs text-slate-600">
          {t("status.printed")}
        </span>
      </div>
    </div>
  );
}

