import { Metadata } from "next";
import { glTransactionService } from "@/services/api";
import GLTransactionsClient from "./components/GLTransactionsClient";

export const metadata: Metadata = {
  title: "القيد المحاسبي - NafeesWeb",
  description: "عرض جميع القيود المحاسبية",
};

export const revalidate = 60;

export default async function GLTransactionsPage() {
  // جلب جميع الحركات من gl_transaction
  const response = await glTransactionService.getAll({
    xcom_id: "1",
    xyear_id: "0",
    xfrom_date: "0",
    xto_date: "0",
    xtrans_id: "0",
    xtrans_type: "0",
  });

  const transactions = response.success && response.data
    ? Array.isArray(response.data)
      ? response.data
      : []
    : [];

  return (
    <div className="font-cairo space-y-4 p-4">
      <GLTransactionsClient initialTransactions={transactions} />
    </div>
  );
}

