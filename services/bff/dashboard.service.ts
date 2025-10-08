import invoiceService from "../api/invoice.service";
import customerService from "../api/customer.service";
import categoryService from "../api/category.service";
import itemService from "../api/item.service";
import goldPriceService from "../api/gold-price.service";
import { HttpService } from "@/services/base";
import { Invoice } from "@/types/models/invoice";
import { IPaginatedResponse } from "@/types/services/base";

interface DashboardStats {
  invoices: IPaginatedResponse<Invoice> | null;
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

  async getDashboardStats(): Promise<DashboardStats | null> {
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

      if (!invoices || !customers || !categories || !items) return null;

      // Calculate monthly sales
      const monthlySales = await invoiceService.calculateMonthlySales(
        invoices?.results as any,
      );

      return {
        invoices,
        customerCount: customers.length,
        itemCount: items?.count || 0,
        categoryCount: categories.length,
        goldPrice,
        monthlySales,
      };
    } catch (error) {
      throw new Error("حدث خطأ أثناء  إحصائيات لوحة التحكم");
    }
  }
}

export default new DashboardService();
