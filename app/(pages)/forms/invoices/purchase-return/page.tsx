import { redirect } from "next/navigation";

export default function PurchaseReturnInvoiceLegacyPage() {
  redirect("/forms/invoices?type=purchase-return&mode=new");
}
