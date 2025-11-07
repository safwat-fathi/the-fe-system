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
    const response = await this.delete(
      `api_delete_gl_transaction/${id}`,
      params,
    );

    // إذا كانت الاستجابة لا تحتوي على success، نضيفها
    if (response && typeof response.success === "undefined") {
      return {
        ...response,
        success: true, // نعتبر الحذف نجح إذا لم يكن هناك خطأ
      };
    }

    return response;
  }

  /**
   * جلب جميع سجلات الترحيل
   */
  async getAll(
    params?: IParams,
  ): Promise<
    | IPaginatedResponse<GLTransaction>
    | { success: boolean; data?: GLTransaction[]; message?: string }
  > {
    try {
      // إضافة xcom_id إذا لم يكن موجوداً
      // ملاحظة: gl_transaction_list يحتاج معاملات محددة
      // تحويل جميع القيم إلى strings لأن API يتوقع strings
      const queryParams: IParams = {
        xcom_id: String(params?.xcom_id || params?.com || "1"),
        xyear_id: String(params?.xyear_id || params?.year || "0"),
        xfrom_date: String(params?.xfrom_date || params?.from_date || "0"),
        xto_date: String(params?.xto_date || params?.to_date || "0"),
        xtrans_type: String(params?.xtrans_type || "0"),
        xtrans_id: String(params?.xtrans_id || "0"),
        xcost_id: String(params?.xcost_id || "0"), // مركز التكلفة
        xcust_id: String(params?.xcust_id || "0"), // رقم العميل
        xacc_id: String(params?.xacc_id || "0"), // رقم الحساب
      };

      // إزالة undefined/null values
      Object.keys(queryParams).forEach((key) => {
        if (
          queryParams[key] === undefined ||
          queryParams[key] === null ||
          queryParams[key] === ""
        ) {
          delete queryParams[key];
        }
      });

      const response = await this.get<
        IPaginatedResponse<GLTransaction> | GLTransaction[]
      >("gl_transaction_list", queryParams, {
        cache: "no-store", // عدم استخدام cache للحصول على البيانات الحالية
      });

      // Logging مؤقت للتشخيص
      if (process.env.NODE_ENV === "development") {
        console.log("[GL Transaction Service] getAll response:", {
          success: response.success,
          hasData: !!response.data,
          dataType: typeof response.data,
          isArray: Array.isArray(response.data),
          dataLength: Array.isArray(response.data)
            ? response.data.length
            : "N/A",
          message: response.message,
        });
      }

      // التحقق من success
      if (!response.success) {
        return {
          success: false,
          message: response.message || "فشل جلب البيانات من API",
          data: [],
        };
      }

      // إذا كان response.data هو array مباشرة (بدون pagination)
      if (Array.isArray(response.data)) {
        return {
          success: true,
          data: response.data,
        };
      }

      // إذا كان paginated response
      if (
        response.data &&
        typeof response.data === "object" &&
        (response.data as any).results
      ) {
        return {
          success: true,
          data: (response.data as any).results,
        };
      }

      // إذا كان response.data object مباشر (وليس array)
      if (
        response.data &&
        typeof response.data === "object" &&
        !Array.isArray(response.data)
      ) {
        // قد يكون object واحد، نجعله array
        return {
          success: true,
          data: [response.data as GLTransaction],
        };
      }

      // إذا لم يكن هناك data أو كان null
      return {
        success: true,
        data: [],
        message: "لا توجد بيانات",
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "حدث خطأ",
        data: [],
      };
    }
  }
}

const glTransactionService = new GLTransactionService();

export default glTransactionService;
