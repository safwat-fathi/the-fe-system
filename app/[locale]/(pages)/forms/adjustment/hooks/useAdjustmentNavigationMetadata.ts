import { useCallback, useMemo } from "react";

const useAdjustmentNavigationMetadata = ({
  navigationInfo,
}: {
  navigationInfo?: {
    previous?: number | null;
    next?: number | null;
    first?: number | null;
    last?: number | null;
    vouchersCount?: number | null;
  };
}) => {
  const resolvePaginatedVoucherHref = useCallback((vouchId: number | null) => {
    if (!vouchId) return null;

    return `/forms/adjustment/${vouchId}?mode=preview`;
  }, []);
  const navigationMetadata = useMemo(() => {
    if (!navigationInfo) return null;

    return {
      nextVoucherHref: resolvePaginatedVoucherHref(navigationInfo.next ?? null),
      prevVoucherHref: resolvePaginatedVoucherHref(
        navigationInfo.previous ?? null,
      ),
      lastVoucherHref: resolvePaginatedVoucherHref(navigationInfo.last ?? null),
      firstVoucherHref: resolvePaginatedVoucherHref(
        navigationInfo.first ?? null,
      ),
      totalVouchers: navigationInfo.vouchersCount,
    };
  }, [navigationInfo, resolvePaginatedVoucherHref]);

  return navigationMetadata;
};

export default useAdjustmentNavigationMetadata;
