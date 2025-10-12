import { HttpService } from "@/services/base";
import { Customer } from "@/types/models/customer";

interface GetCustomerParams {
  xcomp_id: number;
  xcust_type?: number;
  xcust_code?: number;
}

class CustomerService extends HttpService<Customer> {
  constructor() {
    super("");
  }

  async getAllCustomers(params?: GetCustomerParams): Promise<Customer[]> {
    try {
      const response = await this.get<Customer[]>(
        "customers_list",
        {
          xcom_id: params?.xcomp_id || 1,
          xcust_type: params?.xcust_type || 0,
          xcust_code: params?.xcust_code || 0,
        },
        {
          cache: "force-cache",
          next: { tags: ["customers"] },
        },
      );

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
