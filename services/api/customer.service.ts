import { HttpService } from "@/services/base";
import { Customer } from "@/types/models/customer";
import { Invoice, TransTypes } from "@/types/models/invoice";
import { rethrowAuthenticationError } from "@/utilities/errors/Authentication";

interface GetCustomerParams {
  xcom_id: number;
  xcust_type?: number;
  xcust_code?: number;
}

export type CustomerInvoiceTransType =
  | TransTypes.PURCHASE_RETURN
  | TransTypes.SALES_RETURN;

export interface GetCustomerInvoicesParams {
  xcust_id: number;
  xtrans_type: CustomerInvoiceTransType;
  xcom_id?: number;
  xyear_id?: number;
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
          xcom_id: params?.xcom_id || 1,
          xcust_type: params?.xcust_type || 0,
          xcust_code: params?.xcust_code || 0,
        },
        {
          cache: "force-cache",
          next: {
            tags: [
              `customers-${params?.xcom_id}-${params?.xcust_type}-${params?.xcust_code}`,
            ],
          },
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
      rethrowAuthenticationError(error);
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

  async createCustomer(
    customer: Omit<Customer, "id">,
  ): Promise<Customer | null> {
    try {
      const response = await this.post<Customer>(
        "api_create_customer",
        customer,
        undefined,
        {
          cache: "no-store",
        },
      );

      if (response.success) {
        return response.data as Customer;
      }

      return null;
    } catch (error) {
      console.error("Error creating customer:", error);
      rethrowAuthenticationError(error);
      throw new Error("حدث خطأ أثناء إنشاء العميل");
    }
  }

  async updateCustomer(
    id: number,
    customer: Partial<Customer>,
  ): Promise<Customer | null> {
    try {
      const response = await this.put<Customer>(
        `api_update_customer/${id}`,
        customer,
        undefined,
        {
          cache: "no-store",
        },
      );

      if (response.success) {
        return response.data as Customer;
      }

      return null;
    } catch (error) {
      console.error("Error updating customer:", error);
      rethrowAuthenticationError(error);
      throw new Error("حدث خطأ أثناء تحديث العميل");
    }
  }

  async deleteCustomer(id: number): Promise<boolean> {
    try {
      const response = await this.delete(
        `api_delete_customer/${id}`,
        undefined,
        {
          cache: "no-store",
        },
      );

      return response.success;
    } catch (error) {
      console.error("Error deleting customer:", error);
      rethrowAuthenticationError(error);
      throw new Error("حدث خطأ أثناء حذف العميل");
    }
  }

  async getCustomerById(id: number): Promise<Customer | null> {
    try {
      const customers = await this.getAllCustomers();

      return customers.find((customer) => customer.id === id) || null;
    } catch (error) {
      console.error("Error fetching customer by ID:", error);

      return null;
    }
  }

  async getCustomerInvoices({
    xcust_id,
    xtrans_type,
    xcom_id = 1,
    xyear_id = 1,
  }: GetCustomerInvoicesParams): Promise<Invoice[]> {
    try {
      const response = await this.get<Invoice[] | { results?: Invoice[] }>(
        "getCustomerInvoices",
        {
          xcust_id,
          xtrans_type,
          xcom_id,
          xyear_id,
        },
        {
          cache: "force-cache",
          next: {
            tags: [
              `customer-invoices-${xcom_id}-${xyear_id}-${xcust_id}-${xtrans_type}`,
            ],
          },
        },
      );

      if (response.success) {
        const payload = response.data;

        if (Array.isArray(payload)) {
          return payload;
        }

        if (payload && Array.isArray(payload.results)) {
          return payload.results;
        }
      }

      return [];
    } catch (error) {
      console.error("Error fetching customer invoices:", error);
      rethrowAuthenticationError(error);
      throw new Error("حدث خطأ أثناء جلب فواتير العميل");
    }
  }
}

export default new CustomerService();
