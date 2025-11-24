import InvoiceClientPage, {
  type InvoiceClientPageProps,
} from "@/app/[locale]/(pages)/forms/invoices/InvoiceClientPage";

export default async function InvoiceClientPageWrapper(
  props: InvoiceClientPageProps,
) {
  return <InvoiceClientPage {...props} />;
}
