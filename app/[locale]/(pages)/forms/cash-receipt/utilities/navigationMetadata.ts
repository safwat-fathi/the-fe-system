const resolvePaginatedVoucherHref = (vouchId: number | null) => {
  if (!vouchId) return null;

  const basePath = "/forms/cash-receipt";

  return `${basePath}/${vouchId}?mode=preview`;
};

const navigationMetadata = (navigationInfo: {
  next: number | null;
  previous: number | null;
  last: number | null;
  first: number | null;
  vouchersCount: number | null;
}) => {
  if (!navigationInfo) return null;

  const nav = navigationInfo;

  return {
    nextVoucherHref: resolvePaginatedVoucherHref(nav.next ?? null),
    prevVoucherHref: resolvePaginatedVoucherHref(nav.previous ?? null),
    lastVoucherHref: resolvePaginatedVoucherHref(nav.last ?? null),
    firstVoucherHref: resolvePaginatedVoucherHref(nav.first ?? null),
    totalVouchers: nav.vouchersCount,
  };
};

export default navigationMetadata;
