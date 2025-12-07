import BalanceVoucherClientPage, {
  type BalanceVoucherClientPageProps,
} from "./BalanceVoucherClientPage";

export default async function BalanceVoucherClientPageWrapper(
  props: BalanceVoucherClientPageProps,
) {
  return <BalanceVoucherClientPage {...props} />;
}
