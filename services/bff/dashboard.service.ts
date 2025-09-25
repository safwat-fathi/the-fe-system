import { cookies } from "next/headers";
import { STORAGE_KEYS } from "@/constants";
import invoiceService from "../api/invoice.service";
import customerService from "../api/customer.service";
import categoryService from "../api/category.service";
import itemService from "../api/item.service";
import goldPriceService from "../api/gold-price.service";
import { HttpService } from "@/services/base";

interface DashboardStats {
  invoiceCount: number;
  customerCount: number;
  itemCount: number;
  categoryCount: number;
  goldPrice: number | null;
  monthlySales: number[];
}

class DashboardService extends HttpService<any> {
  constructor() {
    super("");
  }

  async getDashboardStats(): Promise<DashboardStats> {
    try {
      // Fetch all required data in parallel
      const [invoices, customers, categories, items, goldPrice] =
        await Promise.all([
          invoiceService.getAllInvoices(),
          customerService.getAllCustomers(),
          categoryService.getAllCategories(),
          itemService.getAllItems(),
          goldPriceService.getCurrentGoldPrice(),
        ]);
      console.log(
        "🚀 ~ :28 ~ DashboardService ~ getDashboardStats ~ invoices:",
        invoices,
      );

      // Calculate monthly sales
      // const monthlySales = await invoiceService.calculateMonthlySales(
      //   invoices?.results as any,
      // );

      return {
        invoiceCount: invoices?.count || 0,
        customerCount: customers.length,
        itemCount: items.length,
        categoryCount: categories.length,
        goldPrice,
        // monthlySales,
      };
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      throw new Error("حدث خطأ أثناء جلب إحصائيات لوحة التحكم");
    }
  }
}

export default new DashboardService();
