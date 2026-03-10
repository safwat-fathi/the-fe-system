"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import { voucherService } from "@/services/api";

export const useVoucherSearch = (vouchType: number) => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const t = useTranslations("forms.cashReceiptVoucher.messages");

  const handleSearch = useCallback(async () => {
    if (!searchTerm || !searchTerm.trim()) {
      toast.error(t("searchError"));

      return;
    }

    const searchValue = searchTerm.trim();
    const searchNumber = Number(searchValue);

    if (!Number.isFinite(searchNumber) || searchNumber <= 0) {
      toast.error(t("searchInvalid"));

      return;
    }

    try {
      let foundVoucher = await voucherService.getVoucherById(searchNumber, {
        xvouch_type: vouchType.toString(),
      });

      if (!foundVoucher) {
        foundVoucher = await voucherService.getVoucherById(searchNumber, {
          xvouch_type: "0",
        });
      }

      if (foundVoucher) {
        const voucherData = foundVoucher as {
          vouch_type: number;
          vouch_id: number | string;
          id: number;
        };

        if (voucherData.vouch_type !== vouchType) {
          const typeName =
            vouchType === 1 ? t("voucherTypeReceipt") : t("voucherTypePayment");

          toast.error(
            t("voucherWrongType", {
              id: voucherData.vouch_id,
              type: typeName,
            }),
          );

          return;
        }

        const targetVouchId = voucherData.vouch_id;

        if (targetVouchId && Number(targetVouchId) > 0) {
          const basePath =
            vouchType === 1 ? "/forms/cash-receipt" : "/forms/payment-receipt";

          router.push(`${basePath}/${targetVouchId}?mode=preview`);
          router.refresh();
          setSearchTerm("");

          return;
        }

        toast.error(t("voucherAccessError"));
      } else {
        const typeName =
          vouchType === 1 ? t("voucherTypeReceipt") : t("voucherTypePayment");

        toast.error(
          t("voucherNotFound", {
            type: typeName,
            number: searchValue,
          }),
        );
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error(t("searchErrorGeneric"));
    }
  }, [searchTerm, t, vouchType, router]);

  return {
    searchTerm,
    setSearchTerm,
    handleSearch,
  };
};

export default useVoucherSearch;
