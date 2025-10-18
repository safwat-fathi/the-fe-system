import { redirect } from "next/navigation";

export default function SaleReturnInvoiceLegacyPage() {
  redirect("/forms/invoices?type=sale-return&mode=new");
}
