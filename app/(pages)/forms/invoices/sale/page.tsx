import { redirect } from "next/navigation";

export default function SaleInvoiceLegacyPage() {
  redirect("/forms/invoices?type=sale&mode=new");
}
