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

  async getDashboardStats(): Promise<DashboardStats> {
    try {
      // Fetch all required data in parallel with individual error handling
      const [invoices, customers, categories, items, goldPrice] =
        await Promise.all([
          invoiceService.getAllInvoices().catch((err) => {
            console.error("Error fetching invoices:", err);

            return null;
          }),
          customerService.getAllCustomers().catch((err) => {
            console.error("Error fetching customers:", err);

            return [];
          }),
          categoryService.getAllCategories().catch((err) => {
            console.error("Error fetching categories:", err);

            return [];
          }),
          itemService.getAllItems().catch((err) => {
            console.error("Error fetching items:", err);

            return [];
          }),
          goldPriceService.getCurrentGoldPrice().catch((err) => {
            console.error("Error fetching gold price:", err);

            return null;
          }),
        ]);

      // Calculate monthly sales
      const invoicesList = Array.isArray(invoices?.results) 
        ? invoices.results 
        : [];
      
      const monthlySales = await invoiceService
        .calculateMonthlySales(invoicesList)
        .catch((err) => {
          console.error("Error calculating monthly sales:", err);

          return new Array(12).fill(0);
        });

      return {
        invoices,
        customerCount: customers.length,
        itemCount: items.length,
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
