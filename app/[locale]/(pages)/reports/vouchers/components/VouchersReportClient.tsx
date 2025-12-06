"use client";

import {
  useState,
  useEffect,
  useMemo,
  useTransition,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import toast from "react-hot-toast";
import { Button, Tabs, Tab, Tooltip, CardBody } from "@heroui/react";
import {
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

import VouchersFilters from "./VouchersFilters";
import VoucherTotals from "./VoucherTotals";
import VouchersTable from "./VouchersTable";

import Card from "@/components/Card";
import { PrintButton } from "@/components";
import { Voucher } from "@/types/voucher";
import { useQueryParams } from "@/utilities/hooks/useQueryParams";
import { IParams } from "@/types/services/base";
import { voucherService } from "@/services/api";
import { getVoucherRoute } from "@/utilities/voucher/routing";
import { getLocaleDir } from "@/i18n/config";

interface VoucherType {
  id: number;
  type_name: string;
  type_name_e: string;
  type_desc?: string;
}

interface VouchersReportClientProps {
  initialVouchers: Voucher[];
  initialVoucherTypes: VoucherType[];
  searchParams: IParams;
  totalVouchers: number;
  totalPages: number;
  overallTotals: {
    totalAmount: number;
    totalGold: number;
  };
}

const VouchersReportClient = ({
  initialVouchers,
  initialVoucherTypes,
  searchParams,
  totalVouchers,
  totalPages,
  overallTotals,
}: VouchersReportClientProps) => {
  const router = useRouter();
  const t = useTranslations("reports.vouchers");
  const locale = useLocale();
  const dir = getLocaleDir(locale);
  const textAlign = dir === "rtl" ? "text-right" : "text-left";

  // Query parameters management
  const { params, setParams } = useQueryParams<{
    xvouch_type: string;
    xvouch_id: string;
    xfrom_date: string;
    xto_date: string;
    page: string;
  }>(["xvouch_type", "xvouch_id", "xfrom_date", "xto_date", "page"], {
    defaultValues: {
      xvouch_type: searchParams.xvouch_type || "0",
      xvouch_id: searchParams.xvouch_id || "0",
      xfrom_date: searchParams.xfrom_date || "0",
      xto_date: searchParams.xto_date || "0",
      page: searchParams.page || "1",
    },
    schema: {
      xvouch_type: {
        parse: (value) => value,
        serialize: (value) => value,
        default: "0",
      },
      xvouch_id: {
        parse: (value) => value,
        serialize: (value) => value,
        default: "0",
      },
      xfrom_date: {
        parse: (value) => value,
        serialize: (value) => value,
        default: "0",
      },
      xto_date: {
        parse: (value) => value,
        serialize: (value) => value,
        default: "0",
      },
      page: {
        parse: (value) => value,
        serialize: (value) => value,
        default: "1",
      },
    },
    pushMode: "replace",
    refreshOnChange: true,
    debounce: 350,
  });

  // State
  const [vouchers] = useState<Voucher[]>(initialVouchers);
  const [voucherTypes] = useState<VoucherType[]>(initialVoucherTypes);
  const [searchQ, setSearchQ] = useState(params.xvouch_id || "");
  const [activeTab, setActiveTab] = useState("all");
  const [, startTransition] = useTransition();
  const [isPaging, startPagingTransition] = useTransition();
  const currentPage = Number(params.page) || 1;

  // Clear filters function
  const clearFilters = () => {
    setSearchQ("");
    startTransition(() =>
      setParams({
        xvouch_type: "0",
        xvouch_id: "0",
        xfrom_date: "0",
        xto_date: "0",
        page: "1",
      }),
    );
  };

  const handlePageChange = useCallback(
    (nextPage: number) => {
      if (!Number.isFinite(nextPage) || nextPage <= 0) return;
      if (totalPages > 0 && nextPage > totalPages) return;

      startPagingTransition(() => {
        setParams({
          ...params,
          page: String(nextPage),
        });
      });
    },
    [params, setParams, totalPages],
  );

  // Get vouchers by type (filtered on client side for tabs) - memoized
  const getVouchersByType = useCallback(
    (typeId: number) => {
      return vouchers.filter((v) => v.vouch_type === typeId);
    },
    [vouchers],
  );

  // Get vouchers for specific types (vouch_type values) - memoized
  const openingVouchers = useMemo(
    () => getVouchersByType(0),
    [getVouchersByType],
  );
  const receiptVouchers = useMemo(
    () => getVouchersByType(1),
    [getVouchersByType],
  );
  const paymentVouchers = useMemo(
    () => getVouchersByType(2),
    [getVouchersByType],
  );
  const customerReceiptVouchers = useMemo(
    () => getVouchersByType(4),
    [getVouchersByType],
  );
  const customerPaymentVouchers = useMemo(
    () => getVouchersByType(5),
    [getVouchersByType],
  );
  const adjustmentVouchers = useMemo(
    () => getVouchersByType(3),
    [getVouchersByType],
  );

  // Handle actions - using utility function
  const handleView = (voucher: Voucher) => {
    const voucherId = voucher.id || voucher.vouch_id;
    const route = getVoucherRoute(
      voucher.vouch_type || 0,
      voucherId,
      "preview",
    );

    router.push(route);
  };

  const handleEdit = (voucher: Voucher) => {
    const voucherId = voucher.id || voucher.vouch_id;
    const route = getVoucherRoute(voucher.vouch_type || 0, voucherId, "edit");

    router.push(route);
  };

  const handlePrint = (voucher: Voucher) => {
    const voucherId = voucher.id || voucher.vouch_id;
    const printUrl = getVoucherRoute(
      voucher.vouch_type || 0,
      voucherId,
      "preview",
    );
    const printWindow = window.open(printUrl, "_blank");

    if (printWindow) {
      printWindow.addEventListener("load", () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      });
    }
  };

  const handleDelete = async (voucher: Voucher) => {
    if (!confirm(t("messages.deleteConfirm"))) return;

    try {
      if (!voucher.vouch_id) return;

      // Dynamic import for server action to avoid bundling it in client
      const { deleteVoucherAction } = await import(
        "@/app/actions/voucher.action"
      );

      const result = await deleteVoucherAction(Number(voucher.vouch_id));

      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message || t("messages.deleteError"));
      }
    } catch (error) {
      console.error("Error deleting voucher:", error);
      toast.error(t("messages.deleteError"));
    }
  };

  const handleNewVoucher = () => {
    router.push("/forms/voucher");
  };

  // State for storing voucher details
  const [voucherDetails, setVoucherDetails] = useState<Record<number, any[]>>(
    {},
  );

  // Calculate cash totals for each voucher - محسن للأداء
  const calculateVoucherCashTotal = (voucher: Voucher) => {
    // أولاً: استخدام vouch_amt مباشرة إذا كان متوفراً (أسرع)
    const voucherAmount = Number(voucher.vouch_amt ?? 0);

    if (Number.isFinite(voucherAmount) && voucherAmount > 0) {
      return voucherAmount;
    }

    // ثانياً: استخدام التفاصيل المحملة إذا كانت متوفرة
    const voucherId = voucher.id || voucher.vouch_id;
    const details = voucherDetails[Number(voucherId)] || [];

    if (details.length > 0) {
      return details.reduce((total: number, detail: any) => {
        const debit = parseFloat(detail.debit) || 0;
        const credit = parseFloat(detail.credit) || 0;

        return total + debit + credit;
      }, 0);
    }

    return 0;
  };

  // Calculate gold totals for each voucher - محسن للأداء
  const calculateVoucherGoldTotal = (voucher: Voucher) => {
    // أولاً: استخدام bag_wt مباشرة إذا كان متوفراً (أسرع)
    if (
      voucher.bag_wt !== undefined &&
      voucher.bag_wt !== null &&
      voucher.bag_wt > 0
    ) {
      return parseFloat(String(voucher.bag_wt)) || 0;
    }

    // ثانياً: استخدام التفاصيل المحملة إذا كانت متوفرة
    const voucherId = voucher.id || voucher.vouch_id;
    const details = voucherDetails[Number(voucherId)] || [];

    if (details.length > 0) {
      return details.reduce((total: number, detail: any) => {
        const debitG = parseFloat(detail.debit_g) || 0;
        const creditG = parseFloat(detail.credit_g) || 0;

        return total + debitG + creditG;
      }, 0);
    }

    return 0;
  };

  // Fetch voucher details in parallel - optimized version
  useEffect(() => {
    const fetchAllVoucherDetails = async () => {
      const vouchersToFetch = vouchers.filter((voucher) => {
        const voucherId = voucher.id || voucher.vouch_id;

        if (!voucherId) return false;

        // Skip if already fetched
        if (
          voucherDetails[Number(voucherId)] &&
          Array.isArray(voucherDetails[Number(voucherId)])
        ) {
          return false;
        }

        return true;
      });

      if (vouchersToFetch.length === 0) {
        return;
      }

      try {
        const detailsPromises = vouchersToFetch.map(async (voucher) => {
          const voucherId = voucher.id || voucher.vouch_id;

          if (!voucherId) return null;

          const branchId = Number(voucher.com_id ?? voucher.com ?? 1) || 1;
          const response = await voucherService.getDetails(Number(voucherId), {
            xcom_id: branchId,
          });

          if (response.success && response.data) {
            const details = Array.isArray(response.data) ? response.data : [];

            return { voucherId, details };
          }

          return { voucherId, details: [] };
        });

        const results = await Promise.all(detailsPromises);

        // Update state with all fetched details at once
        setVoucherDetails((prev) => {
          const updated = { ...prev };

          results.forEach((result) => {
            if (result && result.voucherId && result.details.length >= 0) {
              updated[Number(result.voucherId)] = result.details;
            }
          });

          return updated;
        });
      } catch (error) {
        console.error("Error fetching voucher details:", error);
      }
    };

    if (vouchers.length > 0) {
      fetchAllVoucherDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vouchers]);

  return (
    <div className="font-cairo p-1 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-2">
        <div className="flex justify-between items-center mb-2">
          <h1 className={`text-2xl font-bold mt-2 ${textAlign}`}>{t("header")}</h1>
          <div className="flex items-center gap-2">
            {totalPages > 1 && (
              <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 shadow-sm">
                <Tooltip content={t("navigation.previous")} placement="bottom">
                  <Button
                    isIconOnly
                    aria-label={t("navigation.previous")}
                    className="h-7 w-7"
                    isDisabled={currentPage <= 1 || isPaging}
                    size="sm"
                    variant="light"
                    onPress={() => handlePageChange(currentPage - 1)}
                  >
                    <ChevronRightIcon className="h-4 w-4 text-slate-600" />
                  </Button>
                </Tooltip>
                <span className="text-xs font-medium text-slate-500">
                  {currentPage}/{totalPages}
                </span>
                <Tooltip content={t("navigation.next")} placement="bottom">
                  <Button
                    isIconOnly
                    aria-label={t("navigation.next")}
                    className="h-7 w-7"
                    isDisabled={currentPage >= totalPages || isPaging}
                    size="sm"
                    variant="light"
                    onPress={() => handlePageChange(currentPage + 1)}
                  >
                    <ChevronLeftIcon className="h-4 w-4 text-slate-600" />
                  </Button>
                </Tooltip>
              </div>
            )}
            <PrintButton />
            <Button
              color="primary"
              startContent={<PlusIcon className="h-4 w-4" />}
              onPress={handleNewVoucher}
            >
              {t("newVoucher")}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <VouchersFilters
          fromDate={params.xfrom_date || "0"}
          searchQ={searchQ}
          toDate={params.xto_date || "0"}
          voucherType={params.xvouch_type || "0"}
          voucherTypes={voucherTypes}
          onClearFilters={clearFilters}
          onFromDateChange={(value) =>
            startTransition(() => setParams({ xfrom_date: value, page: "1" }))
          }
          onSearchChange={(value) => {
            setSearchQ(value);
            if (value === params.xvouch_id) return;
            startTransition(() => setParams({ xvouch_id: value, page: "1" }));
          }}
          onToDateChange={(value) =>
            startTransition(() => setParams({ xto_date: value, page: "1" }))
          }
          onVoucherTypeChange={(value) =>
            startTransition(() => setParams({ xvouch_type: value, page: "1" }))
          }
        />
      </div>

      {/* Vouchers Table with Tabs */}
      <Card>
        <CardBody className="p-2">
          <Tabs
            aria-label={t("tabs.ariaLabel")}
            color="primary"
            selectedKey={activeTab}
            variant="underlined"
            onSelectionChange={(key) => setActiveTab(key as string)}
          >
            <Tab key="all" title={`${t("tabs.all")} (${vouchers.length})`}>
              <VouchersTable
                calculateVoucherCashTotal={calculateVoucherCashTotal}
                calculateVoucherGoldTotal={calculateVoucherGoldTotal}
                vouchers={vouchers}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onPrint={handlePrint}
                onView={handleView}
              />
            </Tab>
            <Tab
              key="opening"
              title={`${t("tabs.opening")} (${openingVouchers.length})`}
            >
              <VouchersTable
                calculateVoucherCashTotal={calculateVoucherCashTotal}
                calculateVoucherGoldTotal={calculateVoucherGoldTotal}
                vouchers={openingVouchers}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onPrint={handlePrint}
                onView={handleView}
              />
            </Tab>
            <Tab
              key="receipt"
              title={`${t("tabs.receipt")} (${receiptVouchers.length})`}
            >
              <VouchersTable
                calculateVoucherCashTotal={calculateVoucherCashTotal}
                calculateVoucherGoldTotal={calculateVoucherGoldTotal}
                vouchers={receiptVouchers}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onPrint={handlePrint}
                onView={handleView}
              />
            </Tab>
            <Tab
              key="payment"
              title={`${t("tabs.payment")} (${paymentVouchers.length})`}
            >
              <VouchersTable
                calculateVoucherCashTotal={calculateVoucherCashTotal}
                calculateVoucherGoldTotal={calculateVoucherGoldTotal}
                vouchers={paymentVouchers}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onPrint={handlePrint}
                onView={handleView}
              />
            </Tab>
            <Tab
              key="customer-receipt"
              title={`${t("tabs.customerReceipt")} (${customerReceiptVouchers.length})`}
            >
              <VouchersTable
                calculateVoucherCashTotal={calculateVoucherCashTotal}
                calculateVoucherGoldTotal={calculateVoucherGoldTotal}
                vouchers={customerReceiptVouchers}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onPrint={handlePrint}
                onView={handleView}
              />
            </Tab>
            <Tab
              key="customer-payment"
              title={`${t("tabs.customerPayment")} (${customerPaymentVouchers.length})`}
            >
              <VouchersTable
                calculateVoucherCashTotal={calculateVoucherCashTotal}
                calculateVoucherGoldTotal={calculateVoucherGoldTotal}
                vouchers={customerPaymentVouchers}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onPrint={handlePrint}
                onView={handleView}
              />
            </Tab>
            <Tab
              key="adjustment"
              title={`${t("tabs.adjustment")} (${adjustmentVouchers.length})`}
            >
              <VouchersTable
                calculateVoucherCashTotal={calculateVoucherCashTotal}
                calculateVoucherGoldTotal={calculateVoucherGoldTotal}
                vouchers={adjustmentVouchers}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onPrint={handlePrint}
                onView={handleView}
              />
            </Tab>
          </Tabs>

          {/* Summary */}
          <VoucherTotals
            calculateVoucherCashTotal={calculateVoucherCashTotal}
            calculateVoucherGoldTotal={calculateVoucherGoldTotal}
            overallTotals={{
              totalAmount: overallTotals.totalAmount,
              totalGold: overallTotals.totalGold,
            }}
            totalVoucherCount={totalVouchers}
            voucherDetails={voucherDetails}
            vouchers={vouchers}
          />
          {/* أزرار التنقل انتقلت إلى أعلى الصفحة */}
        </CardBody>
      </Card>
    </div>
  );
};

export default VouchersReportClient;
