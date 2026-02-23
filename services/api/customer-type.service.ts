import { HttpService } from "@/services/base";
import { rethrowAuthenticationError } from "@/utilities/errors/Authentication";

interface CustomerType {
  id: number;
  type_name: string;
  type_name_e: string;
  type_desc: string;
  cr_date: string;
  type_status: boolean;
}

type CustomerTypePayload = Omit<CustomerType, "id" | "cr_date">;
type CustomerTypeUpdatePayload = Partial<CustomerTypePayload>;

class CustomerTypeService extends HttpService<CustomerType> {
  constructor() {
    super("");
  }

  private normalizeCustomerType(rawType: unknown): CustomerType {
    const raw = (rawType ?? {}) as Record<string, unknown>;
    const parsedId = Number(raw.id);
    const rawStatus = raw.type_status;

    return {
      id: Number.isFinite(parsedId) ? parsedId : 0,
      type_name: String(raw.type_name ?? ""),
      type_name_e: String(raw.type_name_e ?? ""),
      type_desc: String(raw.type_desc ?? ""),
      cr_date: String(raw.cr_date ?? ""),
      type_status:
        typeof rawStatus === "boolean"
          ? rawStatus
          : typeof rawStatus === "number"
            ? rawStatus === 1
            : ["1", "true", "yes", "active"].includes(
                String(rawStatus ?? "")
                  .trim()
                  .toLowerCase(),
              ),
    };
  }

  private extractCustomerTypes(payload: unknown): CustomerType[] {
    if (Array.isArray(payload)) {
      return payload.map((type) => this.normalizeCustomerType(type));
    }

    if (payload && typeof payload === "object") {
      const results = (payload as { results?: unknown }).results;

      if (Array.isArray(results)) {
        return results.map((type) => this.normalizeCustomerType(type));
      }
    }

    return [];
  }

  async getAllCustomerTypes(): Promise<CustomerType[]> {
    try {
      const response = await this.get<CustomerType[]>(
        "cust_type_list",
        undefined,
        {
          cache: "no-store",
          next: { tags: ["customer-types"] },
        },
      );

      if (response.success) return this.extractCustomerTypes(response.data);

      return [];
    } catch (error) {
      console.error("Error fetching customer types:", error);
      rethrowAuthenticationError(error);
      throw new Error("حدث خطأ أثناء جلب بيانات أنواع العملاء");
    }
  }

  async createCustomerType(
    customerType: Omit<CustomerType, "id">,
  ): Promise<CustomerType | null> {
    try {
      const payload: CustomerTypePayload = {
        type_name: String(customerType.type_name ?? "").trim(),
        type_name_e: String(customerType.type_name_e ?? "").trim(),
        type_desc: String(customerType.type_desc ?? "").trim(),
        type_status: Boolean(customerType.type_status),
      };

      const response = await this.post<CustomerType>(
        "api_create_cust_type",
        payload,
        undefined,
        {
          cache: "no-store",
        },
      );

      if (response.success) {
        return this.normalizeCustomerType(response.data);
      }

      return null;
    } catch (error) {
      console.error("Error creating customer type:", error);
      rethrowAuthenticationError(error);
      throw new Error("حدث خطأ أثناء إنشاء نوع العميل");
    }
  }

  async updateCustomerType(
    id: number,
    customerType: Partial<CustomerType>,
  ): Promise<CustomerType | null> {
    try {
      const payload: CustomerTypeUpdatePayload = {};

      if (customerType.type_name !== undefined) {
        payload.type_name = String(customerType.type_name).trim();
      }
      if (customerType.type_name_e !== undefined) {
        payload.type_name_e = String(customerType.type_name_e).trim();
      }
      if (customerType.type_desc !== undefined) {
        payload.type_desc = String(customerType.type_desc).trim();
      }
      if (customerType.type_status !== undefined) {
        payload.type_status = Boolean(customerType.type_status);
      }

      const response = await this.put<CustomerType>(
        `api_update_cust_type/${id}`,
        payload,
        undefined,
        {
          cache: "no-store",
        },
      );

      if (response.success) {
        return this.normalizeCustomerType(response.data);
      }

      return null;
    } catch (error) {
      console.error("Error updating customer type:", error);
      rethrowAuthenticationError(error);
      throw new Error("حدث خطأ أثناء تحديث نوع العميل");
    }
  }

  async deleteCustomerType(id: number): Promise<boolean> {
    try {
      const response = await this.delete(
        `api_delete_cust_type/${id}`,
        undefined,
        {
          cache: "no-store",
        },
      );

      return response.success;
    } catch (error) {
      console.error("Error deleting customer type:", error);
      rethrowAuthenticationError(error);
      throw new Error("حدث خطأ أثناء حذف نوع العميل");
    }
  }

  async getCustomerTypeById(id: number): Promise<CustomerType | null> {
    try {
      const customerTypes = await this.getAllCustomerTypes();
      const normalizedId = Number(id);

      if (!Number.isFinite(normalizedId) || normalizedId <= 0) {
        return null;
      }

      return (
        customerTypes.find(
          (customerType) => Number(customerType.id) === normalizedId,
        ) || null
      );
    } catch (error) {
      console.error("Error fetching customer type by ID:", error);

      return null;
    }
  }
}

export default new CustomerTypeService();
