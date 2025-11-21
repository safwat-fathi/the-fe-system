import InvoiceClientPage, {
  type InvoiceClientPageProps,
} from "@/app/(pages)/forms/invoices/InvoiceClientPage";

export default async function InvoiceClientPageWrapper(
  props: InvoiceClientPageProps,
) {
	
	
  return <InvoiceClientPage {...props} />;
}
