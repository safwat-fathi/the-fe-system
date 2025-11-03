import { HttpService } from "@/services/base";
import { GLTransaction } from "@/types/models/gl-transaction";
import { IParams, IPaginatedResponse } from "@/types/services/base";

class GLTransactionService extends HttpService<GLTransaction> {
  constructor() {
    super("");
  }

  /**
   * إنشاء سجل ترحيل جديد
   */
  async create(data: Partial<GLTransaction>) {
    return this.post<GLTransaction>("api_create_gl_transaction", data);
  }

  /**
   * تحديث سجل ترحيل
   */
  async update(id: number, data: Partial<GLTransaction>) {
    return this.patch<GLTransaction>(`api_update_gl_transaction/${id}`, data);
  }

  /**
   * حذف سجل ترحيل
   */
  async deleteTransaction(id: number, params?: IParams) {
    // استخدام delete المحمي من HttpService (مثل voucher.service.ts)
    return this.delete(`api_delete_gl_transaction/${id}`, params);
  }

  /**
   * جلب جميع سجلات الترحيل
   */
  async getAll(params?: IParams): Promise<IPaginatedResponse<GLTransaction> | { success: boolean; data?: GLTransaction[]; message?: string }> {
    try {
      const response = await this.get<IPaginatedResponse<GLTransaction>>(
        "gl_transaction_list",
        params,
      );

      // إذا كان response.data هو array مباشرة (بدون pagination)
      if (Array.isArray(response.data)) {
        return {
          success: true,
          data: response.data,
        };
      }

      // إذا كان paginated response
      if (response.data && (response.data as any).results) {
        return {
          success: true,
          data: (response.data as any).results,
        };
      }

      return {
        success: true,
        data: [],
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "حدث خطأ",
      };
    }
  }
}

const glTransactionService = new GLTransactionService();
export default glTransactionService;

