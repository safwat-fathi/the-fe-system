import { HttpService } from "@/services/base";
import { API_ENDPOINTS } from "@/utilities/api";
import { cookies } from "next/headers";
import { STORAGE_KEYS } from "@/constants";

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
      // Get auth token from cookies
      const cookieStore = await cookies();
      const token = cookieStore.get(STORAGE_KEYS.AUTH_TOKEN)?.value;
      
      // Set the token for authenticated requests
      if (token) {
        this._token = token;
      }

      // Fetch all required data in parallel
      const [invoicesRes, customersRes, categoriesRes, itemsRes, goldPrice] = await Promise.all([
        this.get<any[]>(API_ENDPOINTS.INVOICES_LIST.replace(this._baseUrl, "").replace(/^\//, "")),
        this.get<any[]>(API_ENDPOINTS.CUSTOMERS_LIST.replace(this._baseUrl, "").replace(/^\//, "")),
        this.get<any[]>(API_ENDPOINTS.CATEGORIES_LIST.replace(this._baseUrl, "").replace(/^\//, "")),
        this.get<any[]>(API_ENDPOINTS.GET_ITEMS_LIST.replace(this._baseUrl, "").replace(/^\//, "")),
        this.fetchGoldPrice()
      ]);

      // Process invoice data
      const invoices = invoicesRes.success && Array.isArray(invoicesRes.data) ? invoicesRes.data : [];
      const invoiceCount = invoices.length;

      // Calculate monthly sales
      const monthlySales: number[] = new Array(12).fill(0);
      invoices.forEach((inv) => {
        const date = new Date(inv.inv_date);
        const month = date.getMonth();
        monthlySales[month] += parseFloat(inv.inv_amt ?? inv.inv_net ?? 0);
      });

      // Process other counts
      const customers = customersRes.success && Array.isArray(customersRes.data) ? customersRes.data : [];
      const customerCount = customers.length;

      const categories = categoriesRes.success ? (
        Array.isArray(categoriesRes.data) ? categoriesRes.data : 
        (Array.isArray((categoriesRes.data as any)?.results) ? (categoriesRes.data as any).results : [])
      ) : [];
      const categoryCount = categories.length;

      const items = itemsRes.success ? (
        Array.isArray(itemsRes.data) ? itemsRes.data : 
        (Array.isArray((itemsRes.data as any)?.results) ? (itemsRes.data as any).results : [])
      ) : [];
      const itemCount = items.length;

      return {
        invoiceCount,
        customerCount,
        itemCount,
        categoryCount,
        goldPrice,
        monthlySales
      };
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      throw new Error("حدث خطأ أثناء جلب إحصائيات لوحة التحكم");
    }
  }

  private async fetchGoldPrice(): Promise<number | null> {
    try {
      const response = await fetch("https://data-asg.goldprice.org/dbXRates/SAR");
      
      if (!response.ok) throw new Error("Network response was not ok");
      
      const data = await response.json();
      const pricePerOunce = data?.items?.[0]?.xauPrice;
      
      if (!pricePerOunce) return null;
      
      const pricePerGram = pricePerOunce / 31.1035;
      return parseFloat(pricePerGram.toFixed(2));
    } catch (error) {
      console.error("❌ فشل جلب سعر الذهب:", error);
      return null;
    }
  }
}

export default new DashboardService();