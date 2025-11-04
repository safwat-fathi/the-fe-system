/**
 * Hook for voucher navigation and search
 * التنقل بين السندات والبحث
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import type { Voucher } from "@/types/voucher";
import { voucherService } from "@/services/api";
import { getVoucherRoute } from "@/utilities/voucher/routing";

interface UseVoucherNavigationProps {
  vouchersList: any[];
  currentVoucher: Voucher;
  vouchType: number;
}

export const useVoucherNavigation = ({
  vouchersList,
  currentVoucher,
  vouchType,
}: UseVoucherNavigationProps) => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
  const [currentRecord, setCurrentRecord] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Load vouchers list
  const loadVouchersList = async () => {
    try {
      const response = await voucherService.getAll({
        xvouch_type: "3",
        xcom_id: "1",
        xyear_id: "0",
      });

      if (response.success && response.data && Array.isArray(response.data)) {
        const settlementVouchers = response.data.filter(
          (v: any) => v.vouch_type === 3,
        );

        return settlementVouchers;
      }
    } catch (error) {
      console.error("Error loading vouchers:", error);
    }

    return [];
  };

  // Navigate to voucher
  const navigateToVoucher = (direction: "first" | "prev" | "next" | "last") => {
    if (vouchersList.length === 0) return;

    let targetIndex = 0;
    const currentIndex = vouchersList.findIndex(
      (v) => v.vouch_id === currentVoucher.vouch_id || v.id === currentVoucher.id,
    );

    switch (direction) {
      case "first":
        targetIndex = 0;
        break;
      case "prev":
        targetIndex = currentIndex > 0 ? currentIndex - 1 : 0;
        break;
      case "next":
        targetIndex =
          currentIndex < vouchersList.length - 1
            ? currentIndex + 1
            : vouchersList.length - 1;
        break;
      case "last":
        targetIndex = vouchersList.length - 1;
        break;
    }

    const targetVoucher = vouchersList[targetIndex];

    if (targetVoucher) {
      const targetId = targetVoucher.id || targetVoucher.vouch_id;

      if (targetId) {
        const route = getVoucherRoute(vouchType, targetId, "preview");
        router.push(route);
      }
    }
  };

  // Search for voucher
  const handleSearch = async () => {
    if (!searchTerm || searchTerm.trim() === "") {
      toast.error("يرجى إدخال رقم القيد للبحث");
      return;
    }

    const searchValue = searchTerm.trim();

    try {
      const vouchersResponse = await voucherService.getAll({
        xvouch_type: vouchType.toString(),
        xvouch_id: searchValue,
        xcom_id: "1",
        xyear_id: "0",
      });

      if (vouchersResponse.success && vouchersResponse.data) {
        const vouchers = Array.isArray(vouchersResponse.data)
          ? vouchersResponse.data
          : [];

        let foundVoucher = vouchers.find(
          (v: any) =>
            v.vouch_id?.toString() === searchValue ||
            v.id?.toString() === searchValue,
        );

        if (!foundVoucher) {
          foundVoucher = vouchers.find(
            (v: any) =>
              v.vouch_id?.toString().includes(searchValue) ||
              v.id?.toString().includes(searchValue),
          );
        }

        if (foundVoucher) {
          const targetId = foundVoucher.id || foundVoucher.vouch_id;

          if (targetId) {
            const finalId = foundVoucher.id || targetId;
            const route = getVoucherRoute(vouchType, finalId, "preview");
            router.push(route);
            router.refresh();
            setSearchTerm("");
            return;
          }
        }
      }

      const allVouchersResponse = await voucherService.getAll({
        xvouch_type: "0",
        xvouch_id: searchValue,
        xcom_id: "1",
        xyear_id: "0",
      });

      if (allVouchersResponse.success && allVouchersResponse.data) {
        const allVouchers = Array.isArray(allVouchersResponse.data)
          ? allVouchersResponse.data
          : [];

        const foundAny = allVouchers.find(
          (v: any) =>
            v.vouch_id?.toString() === searchValue ||
            v.id?.toString() === searchValue,
        );

        if (foundAny) {
          if (foundAny.vouch_type !== vouchType) {
            toast.error(
              `القيد الموجود (${foundAny.vouch_id}) ليس من نوع قيد تسوية`,
            );
            return;
          }

          const targetId = foundAny.id || foundAny.vouch_id;

          if (targetId) {
            const finalId = foundAny.id || targetId;
            const route = getVoucherRoute(vouchType, finalId, "preview");
            router.push(route);
            router.refresh();
            setSearchTerm("");
            return;
          }
        }
      }

      toast.error(`لم يتم العثور على قيد تسوية برقم: ${searchValue}`);
    } catch (error) {
      console.error("Error searching voucher:", error);
      toast.error("حدث خطأ أثناء البحث. يرجى المحاولة مرة أخرى");
    }
  };

  return {
    searchTerm,
    setSearchTerm,
    selectedVoucher,
    setSelectedVoucher,
    currentRecord,
    setCurrentRecord,
    totalRecords,
    setTotalRecords,
    loadVouchersList,
    navigateToVoucher,
    handleSearch,
  };
};

