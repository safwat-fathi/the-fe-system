import { HttpService } from "@/services/base";

interface CustomerType {
  id: number;
  type_name: string;
  type_name_e: string;
  type_desc: string;
  cr_date: string;
  type_status: boolean;
}

class CustomerTypeService extends HttpService<CustomerType> {
  constructor() {
    super("");
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

      if (response.success) {
        if (Array.isArray(response.data)) {
          return response.data;
        } else if (Array.isArray((response.data as any)?.results)) {
          return (response.data as any).results;
        }
      }

      return [];
    } catch (error) {
      console.error("Error fetching customer types:", error);
      throw new Error("حدث خطأ أثناء جلب بيانات أنواع العملاء");
    }
  }

  async createCustomerType(
    customerType: Omit<CustomerType, "id">,
  ): Promise<CustomerType | null> {
    try {
      const response = await this.post<CustomerType>(
        "api_create_cust_type",
        customerType,
        undefined,
        {
          cache: "no-store",
        },
      );

      if (response.success) {
        return response.data as CustomerType;
      }

      return null;
    } catch (error) {
      console.error("Error creating customer type:", error);
      throw new Error("حدث خطأ أثناء إنشاء نوع العميل");
    }
  }

  async updateCustomerType(
    id: number,
    customerType: Partial<CustomerType>,
  ): Promise<CustomerType | null> {
    try {
      const response = await this.put<CustomerType>(
        `api_update_cust_type/${id}`,
        customerType,
        undefined,
        {
          cache: "no-store",
        },
      );

      if (response.success) {
        return response.data as CustomerType;
      }

      return null;
    } catch (error) {
      console.error("Error updating customer type:", error);
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
      throw new Error("حدث خطأ أثناء حذف نوع العميل");
    }
  }

  async getCustomerTypeById(id: number): Promise<CustomerType | null> {
    try {
      const customerTypes = await this.getAllCustomerTypes();

      return (
        customerTypes.find((customerType) => customerType.id === id) || null
      );
    } catch (error) {
      console.error("Error fetching customer type by ID:", error);

      return null;
    }
  }
}

export default new CustomerTypeService();
