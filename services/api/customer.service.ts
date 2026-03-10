import { HttpService } from "@/services/base";
import { Customer } from "@/types/models/customer";
import { Invoice, TransTypes } from "@/types/models/invoice";
import { IPaginatedResponse } from "@/types/services/base";
import { PAGE_SIZE_OVERRIDES } from "@/constants/ui";
import { rethrowAuthenticationError } from "@/utilities/errors/Authentication";

interface GetCustomerParams {
  xcom_id?: number;
  xcust_type?: number;
  xcust_code?: number;
}

export type GetCustomersPageParams = GetCustomerParams & { page?: number };

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

  private extractCustomerList(payload: unknown): Customer[] {
    if (Array.isArray(payload)) {
      return payload as Customer[];
    }

    if (payload && typeof payload === "object") {
      const results = (payload as { results?: unknown }).results;

      if (Array.isArray(results)) {
        return results as Customer[];
      }
    }

    return [];
  }

  private parseNullableNumber(value: unknown): number | null | undefined {
    if (value === undefined) return undefined;
    if (value === null || value === "") return null;
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : null;
  }

  private parseNullableString(value: unknown): string | null | undefined {
    if (value === undefined) return undefined;
    if (value === null) return null;
    const normalized = String(value).trim();

    return normalized === "" ? null : normalized;
  }

  private sanitizeCustomerPayload(customer: Partial<Customer>): Partial<Customer> {
    return {
      ...customer,
      cust_code:
        customer.cust_code === undefined || customer.cust_code === null
          ? undefined
          : String(customer.cust_code).trim(),
      cust_name: String(customer.cust_name ?? "").trim(),
      cust_name_e: this.parseNullableString(customer.cust_name_e),
      mobile: this.parseNullableString(customer.mobile),
      email: this.parseNullableString(customer.email),
      address: this.parseNullableString(customer.address),
      vat_no: this.parseNullableNumber(customer.vat_no),
      cr_no: this.parseNullableString(customer.cr_no),
      phone: this.parseNullableString(customer.phone),
      fax: this.parseNullableString(customer.fax),
      gov: this.parseNullableString(customer.gov),
      city: this.parseNullableString(customer.city),
      area: this.parseNullableString(customer.area),
      street: this.parseNullableString(customer.street),
      build_no: this.parseNullableString(customer.build_no),
      post_code: this.parseNullableString(customer.post_code),
      cust_status: this.parseNullableNumber(customer.cust_status),
      acc: this.parseNullableNumber(customer.acc),
      acc_name: this.parseNullableString(customer.acc_name),
      box_type:
        customer.box_type === undefined || customer.box_type === null
          ? null
          : String(customer.box_type).trim(),
      handling: this.parseNullableString(customer.handling),
      handling_e: this.parseNullableString(customer.handling_e),
      perc: this.parseNullableNumber(customer.perc),
      cust_type: this.parseNullableNumber(customer.cust_type),
      expt:
        customer.expt === undefined || customer.expt === null
          ? null
          : Boolean(customer.expt),
      hide:
        customer.hide === undefined || customer.hide === null
          ? null
          : Boolean(customer.hide),
      post_no: this.parseNullableString(customer.post_no),
    };
  }

  async getAllCustomers(params?: GetCustomerParams): Promise<Customer[]> {
    try {
      const xcust_type = params?.xcust_type ?? 0;
      const xcust_code = params?.xcust_code ?? 0;

      const queryParams: Record<string, string | number> = {
        xcust_type,
        xcust_code,
      };

      if (params?.xcom_id != null) {
        queryParams.xcom_id = params.xcom_id;
      }

      const response = await this.get<Customer[]>(
        "customers_list",
        queryParams,
        {
          cache: "no-store",
          next: {
            tags: [`customers-{xcom_id}-${xcust_type}-${xcust_code}`],
          },
        },
      );

      if (response.success) {
        return this.extractCustomerList(response.data);
      }

      return [];
    } catch (error) {
      console.error("Error fetching customers:", error);
      rethrowAuthenticationError(error);
      throw new Error("حدث خطأ أثناء جلب بيانات العملاء");
    }
  }

  async getCustomersPage(
    params?: GetCustomersPageParams,
  ): Promise<IPaginatedResponse<Customer> | null> {
    try {
      const xcust_type = params?.xcust_type ?? 0;
      const xcust_code = params?.xcust_code ?? 0;
      const page = params?.page ?? 1;

      const queryParams: Record<string, string | number> = {
        xcust_type,
        xcust_code,
        page,
      };

      if (params?.xcom_id != null) {
        queryParams.xcom_id = params.xcom_id;
      }

      const pageSize = PAGE_SIZE_OVERRIDES.customers;

      const response = await this.get<IPaginatedResponse<Customer>>(
        "customers_list",
        { ...queryParams, page_size: pageSize },
        {
          cache: "no-store",
          next: {
            tags: [
              `customers-page-{xcom_id}-${xcust_type}-${xcust_code}-${page}-${pageSize}`,
            ],
          },
        },
      );

      if (response.success && response.data) {
        const data = response.data as IPaginatedResponse<Customer>;
        const results = Array.isArray(data.results)
          ? data.results
          : this.extractCustomerList(response.data);

        return {
          count: Number(data.count) ?? 0,
          next: data.next ?? null,
          previous: data.previous ?? null,
          results,
        };
      }

      return null;
    } catch (error) {
      console.error("Error fetching customers page:", error);
      rethrowAuthenticationError(error);
      throw new Error("حدث خطأ أثناء جلب بيانات العملاء");
    }
  }

  async getCustomerCount(): Promise<number> {
    try {
      const data = await this.getCustomersPage({ page: 1 });

      return data?.count ?? 0;
    } catch (error) {
      console.error("Error counting customers:", error);

      return 0;
    }
  }

  /**
   * Returns the next suggested customer code (max existing cust_code + 1).
   * Use for default value when adding a new customer to avoid duplicates.
   * Scoped by xcom_id when provided.
   */
  async getNextCustomerCode(params?: GetCustomerParams): Promise<string> {
    try {
      const customers = await this.getAllCustomers(params);
      const codes = customers
        .map((c) => Number(c.cust_code))
        .filter((n) => Number.isFinite(n));

      const max = codes.length > 0 ? Math.max(...codes) : 0;

      return String(max + 1);
    } catch (error) {
      console.error("Error getting next customer code:", error);
      rethrowAuthenticationError(error);

      return "1";
    }
  }

  async createCustomer(
    customer: Omit<Customer, "id">,
  ): Promise<Customer | null> {
    try {
      const payload = this.sanitizeCustomerPayload(customer);
      const response = await this.post<Customer>(
        "api_create_customer",
        payload,
        undefined,
      );

      if (response.success && response.data != null) {
        const created = response.data as Customer;

        if (created.id != null && created.id !== 0) {
          return created;
        }
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
      const payload = this.sanitizeCustomerPayload(customer);
      const response = await this.put<Customer>(
        `api_update_customer/${id}`,
        payload,
        undefined,
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
      );

      return response.success;
    } catch (error) {
      console.error("Error deleting customer:", error);
      rethrowAuthenticationError(error);
      throw new Error("حدث خطأ أثناء حذف العميل");
    }
  }

  async getCustomerById(id: number, xcom_id?: number): Promise<Customer | null> {
    try {
      const targetedCustomers = await this.getAllCustomers({
        xcom_id,
        xcust_code: id,
      });

      const targetedMatch =
        targetedCustomers.find((customer) => Number(customer.id) === Number(id)) ||
        targetedCustomers.find(
          (customer) => Number(customer.cust_code) === Number(id),
        );

      if (targetedMatch) {
        return targetedMatch;
      }

      const customers = await this.getAllCustomers({ xcom_id });

      return customers.find((customer) => customer.id === id) || null;
    } catch (error) {
      console.error("Error fetching customer by ID:", error);

      return null;
    }
  }

  async getCustomerInvoices({
    xcust_id,
    xtrans_type,
    xcom_id,
    xyear_id = 1,
  }: GetCustomerInvoicesParams): Promise<Invoice[]> {
    try {
      const queryParams: any = {
        xcust_id,
        xtrans_type,
        xyear_id,
      };

      if (xcom_id) {
        queryParams.xcom_id = xcom_id;
      }

      const response = await this.get<Invoice[] | { results?: Invoice[] }>(
        "getCustomerInvoices",
        queryParams,
        {
          cache: "force-cache",
          next: {
            tags: [
              `customer-invoices-{xcom_id}-${xyear_id}-${xcust_id}-${xtrans_type}`,
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
