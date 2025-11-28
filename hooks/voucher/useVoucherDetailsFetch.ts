/**
 * Hook for fetching voucher details in parallel
 * Hook لجلب تفاصيل السندات بشكل متوازي
 */

import type { Voucher } from "@/types/voucher";

import { useState, useEffect, useCallback } from "react";

import { voucherService } from "@/services/api";
import { fetchInParallel } from "@/utilities/api/parallel-fetch";

interface VoucherDetail {
  voucherId: number;
  details: any[];
}

interface UseVoucherDetailsFetchProps {
  vouchers: Voucher[];
  enabled?: boolean;
}

export const useVoucherDetailsFetch = ({
  vouchers,
  enabled = true,
}: UseVoucherDetailsFetchProps) => {
  const [voucherDetails, setVoucherDetails] = useState<Record<string, any[]>>(
    {},
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchDetails = useCallback(async () => {
    if (!enabled || vouchers.length === 0) return;

    // Filter vouchers that need details fetched
    const vouchersToFetch = vouchers.filter((voucher) => {
      const voucherId = voucher.id || voucher.vouch_id;

      if (!voucherId) return false;
      const key = String(voucherId);

      // Skip if already fetched
      if (voucherDetails[key] && Array.isArray(voucherDetails[key])) {
        return false;
      }

      return true;
    });

    if (vouchersToFetch.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const results = await fetchInParallel<Voucher, VoucherDetail>(
        vouchersToFetch,
        async (voucher) => {
          const voucherId = voucher.id || voucher.vouch_id;

          if (!voucherId) return null;
          const numericId = Number(voucherId);

          if (!Number.isFinite(numericId)) {
            return null;
          }

          const branchId = Number(voucher.com_id ?? voucher.com ?? 1) || 1;
          const response = await voucherService.getDetails(numericId, {
            xcom_id: branchId,
          });

          if (response.success && response.data) {
            const details = Array.isArray(response.data) ? response.data : [];

            return { voucherId: numericId, details };
          }

          return { voucherId: numericId, details: [] };
        },
        {
          batchSize: 10,
          onError: (voucher, err) => {
            console.error(
              `Error fetching details for voucher ${voucher.vouch_id}:`,
              err,
            );
          },
        },
      );

      // Update state with fetched details
      setVoucherDetails((prev) => {
        const updated = { ...prev };

        results.forEach((result) => {
          if (result && result.voucherId && result.details.length >= 0) {
            updated[String(result.voucherId)] = result.details;
          }
        });

        return updated;
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  }, [vouchers, enabled, voucherDetails]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  return {
    voucherDetails,
    isLoading,
    error,
    refetch: fetchDetails,
  };
};
