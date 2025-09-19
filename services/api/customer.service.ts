import { HttpService } from "@/services/base";
import { API_ENDPOINTS } from "@/utilities/api";

interface Customer {
  id: number;
  // Add other customer properties as needed
}

class CustomerService extends HttpService<Customer> {
  constructor() {
    super("");
  }

  async getAllCustomers(): Promise<Customer[]> {
    try {
      const response = await this.get<Customer[]>("customers_list", undefined, {
        cache: "force-cache",
        next: { tags: ["customers"] },
      });
      
      if (response.success) {
        if (Array.isArray(response.data)) {
          return response.data;
        } else if (Array.isArray((response.data as any)?.results)) {
          return (response.data as any).results;
        }
      }
      
      return [];
    } catch (error) {
      console.error("Error fetching customers:", error);
      throw new Error("حدث خطأ أثناء جلب بيانات العملاء");
    }
  }

  async getCustomerCount(): Promise<number> {
    try {
      const customers = await this.getAllCustomers();
      return customers.length;
    } catch (error) {
      console.error("Error counting customers:", error);
      return 0;
    }
  }
}

export default new CustomerService();
