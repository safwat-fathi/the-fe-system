export interface VoucherNavigationSource {
  previous_voucher_id?: number | string | null;
  previous?: number | string | null;
  next_voucher_id?: number | string | null;
  next?: number | string | null;
  first_voucher_id?: number | string | null;
  first?: number | string | null;
  last_voucher_id?: number | string | null;
  last?: number | string | null;
  vouchers_count?: number | string | null;
}

const useNavigationInfo = (
  voucherForNav: VoucherNavigationSource | null | undefined,
) => {
  const parseNavId = (value: unknown): number | null => {
    if (value === null || value === undefined || value === "") {
      return null;
    }

    const numeric = Number(value);

    return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
  };

  const parseVouchersCount = (value: unknown): number | null => {
    if (value === null || value === undefined || value === "") {
      return null;
    }

    const numeric = Number(value);

    return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
  };

  const navigationInfo = voucherForNav
    ? {
        previous: parseNavId(
          voucherForNav.previous_voucher_id ?? voucherForNav.previous,
        ),
        next: parseNavId(voucherForNav.next_voucher_id ?? voucherForNav.next),
        first: parseNavId(
          voucherForNav.first_voucher_id ?? voucherForNav.first,
        ),
        last: parseNavId(voucherForNav.last_voucher_id ?? voucherForNav.last),
        vouchersCount: parseVouchersCount(voucherForNav.vouchers_count),
      }
    : undefined;

  return navigationInfo;
};

export default useNavigationInfo;
