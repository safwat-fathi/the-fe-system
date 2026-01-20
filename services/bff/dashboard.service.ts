import invoiceService from "../api/invoice.service";
import customerService from "../api/customer.service";
import categoryService from "../api/category.service";
import itemService from "../api/item.service";
import goldPriceService from "../api/gold-price.service";

import { HttpService } from "@/services/base";
import { getBranchParams } from "@/app/actions/branch-params";
import { Invoice } from "@/types/models/invoice";
import { IPaginatedResponse } from "@/types/services/base";
import { AuthenticationError } from "@/utilities/errors/Authentication";

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
      // Get company ID
      const branchParams = await getBranchParams();
      const parsedCompanyId = Number(branchParams.com ?? "1");
      const companyId =
        Number.isFinite(parsedCompanyId) && parsedCompanyId > 0
          ? parsedCompanyId
          : 1;

      // Fetch all required data in parallel with individual error handling.
      // AuthenticationError must be allowed to bubble up for proper redirects.
      const [invoices, customers, categories, items, goldPrice] =
        await Promise.all([
          invoiceService.getAllInvoices({
            xcom_id: String(companyId),
            xyear_id: "0",
          }),
          customerService
            .getAllCustomers({
              xcom_id: companyId,
              xcust_type: 0,
              xcust_code: 0,
            })
            .catch((error) => {
              if (error instanceof AuthenticationError) {
                throw error;
              }

              return [];
            }),
          categoryService.getAllCategories().catch((error) => {
            if (error instanceof AuthenticationError) {
              throw error;
            }

            return [];
          }),
          itemService
            .searchItems({
              page: 1,
              companyId,
              categoryId: "0",
              itemTypeId: "0",
              itemStatus: "0",
            })
            .catch((error) => {
              if (error instanceof AuthenticationError) {
                throw error;
              }

              return {
                count: 0,
                results: [],
                next: null,
                previous: null,
              };
            }),
          goldPriceService.getCurrentGoldPrice().catch((error) => {
            if (error instanceof AuthenticationError) {
              throw error;
            }

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
        itemCount: items?.count || 0,
        categoryCount: categories.length,
        goldPrice,
        monthlySales,
      };
    } catch (error) {
      throw error;
    }
  }
}

export default new DashboardService();
