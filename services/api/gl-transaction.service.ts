import { HttpService } from "@/services/base";
import { IParams } from "@/types/services/base";
import { GLTransaction } from "@/types/models/gl-transaction";
import { rethrowAuthenticationError } from "@/utilities/errors/Authentication";

export interface GetGLTransactionsParams extends IParams {
  xcom_id?: string | number;
  xyear_id?: string | number;
  xtrans_type?: string | number; // نوع الحركة (0-5)
  xtrans_id?: string | number; // رقم الحركة
  xfrom_date?: string | number;
  xto_date?: string | number;
  xcost_id?: string | number;
  xcust_id?: string | number;
  xacc_id?: string | number; // رقم الحساب
  page?: string | number;
  skipCache?: boolean; // تخطي الـ cache (مفيد عند الحذف)
}

class GLTransactionService extends HttpService<GLTransaction> {
  constructor() {
    super("");
  }

  private normalizeCompanyId(value: unknown): string | null {
    if (value === null || value === undefined || value === "") {
      return null;
    }

    const numeric = Number(value);

    if (!Number.isFinite(numeric) || numeric <= 0) {
      return null;
    }

    return String(numeric);
  }

  private async resolveCompanyId(
    params?: Partial<GetGLTransactionsParams>,
  ): Promise<string> {
    const explicitCompanyId = this.normalizeCompanyId(params?.xcom_id);

    if (explicitCompanyId) {
      return explicitCompanyId;
    }

    const activeCompanyId = await this._getCompanyId();
    const normalizedActiveCompanyId = this.normalizeCompanyId(activeCompanyId);

    if (normalizedActiveCompanyId) {
      return normalizedActiveCompanyId;
    }

    return "1";
  }

  /**
   * إعداد جميع الـ params المطلوبة للـ API
   * دالة واحدة بسيطة وذكية تضمن إرسال جميع الـ params دائماً
   */
  private buildQueryParams(
    params: Partial<GetGLTransactionsParams> | undefined,
    companyId: string,
  ): any {
    return {
      xcom_id: companyId,
      xyear_id: String(params?.xyear_id || "0"),
      xtrans_type: String(params?.xtrans_type || params?.trans_type || "0"),
      xtrans_id: String(params?.xtrans_id || params?.trans_id || "0"),
      xfrom_date: String(params?.xfrom_date || "0"),
      xto_date: String(params?.xto_date || "0"),
      xcost_id: String(params?.xcost_id || "0"),
      xcust_id: String(params?.xcust_id || "0"),
      xacc_id: String(params?.xacc_id || "0"),
      page: String(params?.page || "1"),
    };
  }

  /**
   * الحصول على جميع القيود المحاسبية (مع pagination)
   */
  async getAll(params?: GetGLTransactionsParams) {
    const companyId = await this.resolveCompanyId(params);
    const queryParams = this.buildQueryParams(params, companyId);
    const skipCache = params?.skipCache || false;

    try {
      const response = await this.getPaginated<GLTransaction>(
        "gl_transaction_list",
        queryParams,
        skipCache ? {
          cache: "no-store", // تخطي الـ cache عند الحذف
        } : {
          cache: "force-cache",
          next: {
            revalidate: 60, // Cache for 1 minute
            tags: [
              "gl-transactions",
              `gl-transactions-type-${queryParams.xtrans_type}`,
              `gl-transactions-id-${queryParams.xtrans_id}`,
            ],
          },
        },
      );

      if (!response.success) {
        return {
          success: false,
          data: [],
          count: 0,
          message: response.message || "فشل جلب القيود المحاسبية",
        };
      }

      const data = response.data as any;

      // معالجة الاستجابة المُقسّمة (pagination)
      if (data.results && Array.isArray(data.results)) {
        return {
          success: true,
          data: data.results as GLTransaction[],
          count: data.count || data.results.length,
          next: data.next,
          previous: data.previous,
          message: response.message,
        };
      }

      // إذا كانت array مباشرة
      if (Array.isArray(data)) {
        return {
          success: true,
          data: data as GLTransaction[],
          count: data.length,
          message: response.message,
        };
      }

      return {
        success: false,
        data: [],
        count: 0,
        message: "استجابة غير متوقعة من الخادم",
      };
    } catch (error) {
      rethrowAuthenticationError(error);
      console.error("Error fetching GL transactions:", error);

      return {
        success: false,
        data: [],
        count: 0,
        message:
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء جلب القيود المحاسبية",
      };
    }
  }

  /**
   * الحصول على قيود حركة معينة (سند معين)
   * @param transId - رقم الحركة (vouch_id)
   * @param transType - نوع الحركة (vouch_type)
   * @param params - معاملات إضافية
   * @param skipCache - تخطي الـ cache (مفيد عند الحذف)
   */
  async getByTransaction(
    transId: number | string,
    transType: number,
    params?: Omit<GetGLTransactionsParams, "xtrans_id" | "xtrans_type">,
    skipCache: boolean = false,
  ) {
    const companyId = await this.resolveCompanyId(params);

    if (skipCache) {
      // استخدام buildQueryParams لضمان إرسال جميع الـ params
      const queryParams = this.buildQueryParams({
        ...(params || {}),
        xcom_id: companyId,
        xtrans_id: String(transId),
        xtrans_type: String(transType),
      }, companyId);

      try {
        const response = await this.getPaginated<GLTransaction>(
          "gl_transaction_list",
          queryParams,
          {
            cache: "no-store", // تخطي الـ cache
          },
        );

        if (!response.success) {
          return {
            success: false,
            data: [],
            count: 0,
            message: response.message || "فشل جلب القيود المحاسبية",
          };
        }

        const data = response.data as any;

        if (data.results && Array.isArray(data.results)) {
          return {
            success: true,
            data: data.results as GLTransaction[],
            count: data.count || data.results.length,
            next: data.next,
            previous: data.previous,
            message: response.message,
          };
        }

        if (Array.isArray(data)) {
          return {
            success: true,
            data: data as GLTransaction[],
            count: data.length,
            message: response.message,
          };
        }

        return {
          success: false,
          data: [],
          count: 0,
          message: "استجابة غير متوقعة من الخادم",
        };
      } catch (error) {
        rethrowAuthenticationError(error);
        console.error("Error fetching GL transactions:", error);

        return {
          success: false,
          data: [],
          count: 0,
          message: error instanceof Error ? error.message : "حدث خطأ أثناء جلب القيود المحاسبية",
        };
      }
    }
    
    return this.getAll({
      ...(params || {}),
      xcom_id: companyId,
      xtrans_id: String(transId),
      xtrans_type: String(transType),
    });
  }

  /**
   * الحصول على قيود حساب معين
   * @param accId - رقم الحساب
   * @param params - معاملات إضافية
   */
  async getByAccount(
    accId: number | string,
    params?: Omit<GetGLTransactionsParams, "xacc_id">,
  ) {
    return this.getAll({
      ...params,
      xacc_id: String(accId),
    });
  }

  /**
   * الحصول على قيود ضمن فترة زمنية
   * @param fromDate - تاريخ البداية (YYYY-MM-DD)
   * @param toDate - تاريخ النهاية (YYYY-MM-DD)
   * @param params - معاملات إضافية
   */
  async getByDateRange(
    fromDate: string,
    toDate: string,
    params?: Omit<
      GetGLTransactionsParams,
      "xfrom_date" | "xto_date"
    >,
  ) {
    return this.getAll({
      ...params,
      xfrom_date: fromDate,
      xto_date: toDate,
    });
  }

  /**
   * الحصول على قيود حسب نوع الحركة
   * @param transType - نوع الحركة (0-5)
   * @param params - معاملات إضافية
   */
  async getByType(
    transType: number,
    params?: Omit<GetGLTransactionsParams, "xtrans_type">,
  ) {
    return this.getAll({
      ...params,
      xtrans_type: String(transType),
    });
  }

  /**
   * إنشاء قيد محاسبي جديد
   */
  async create(transaction: Partial<GLTransaction>) {
    return this.post<GLTransaction>("api_create_gl_transaction", transaction);
  }

  /**
   * تحديث قيد محاسبي موجود
   */
  async update(id: number, transaction: Partial<GLTransaction>) {
    return this.patch<GLTransaction>(`api_update_gl_transaction/${id}`, transaction);
  }

  /**
   * حذف قيد محاسبي
   * @param id - رقم القيد المحاسبي
   * @param params - معاملات إضافية (مطلوبة للـ backend)
   */
  async deleteTransaction(
    id: number,
    params?: Partial<GetGLTransactionsParams>,
  ) {
    const companyId = await this.resolveCompanyId(params);
    // إرسال جميع الـ params المطلوبة مع طلب الحذف
    const queryParams = this.buildQueryParams({
      ...(params || {}),
      xcom_id: companyId,
    }, companyId);
    
    const result = await this.delete(`api_delete_gl_transaction/${id}`, queryParams);

    return result;
  }

  /**
   * حذف جميع القيود المحاسبية من الجدول
   * ⚠️ تحذير: هذه العملية لا يمكن التراجع عنها!
   * 
   * ملاحظة: يتم حذف القيود واحداً تلو الآخر بشكل متسلسل لتجنب أخطاء 500
   * قد تستغرق هذه العملية وقتاً طويلاً إذا كان هناك عدد كبير من القيود
   */
  async deleteAll(): Promise<{
    success: boolean;
    message: string;
    deletedCount?: number;
    totalCount?: number;
    failedIds?: number[];
  }> {
    try {
      const companyId = await this.resolveCompanyId();

      // أولاً: جلب جميع القيود مع skipCache لضمان أحدث البيانات
      const allTransactionsResponse = await this.getAll({
        xcom_id: companyId,
        xyear_id: "0",
        xtrans_type: "0",
        xtrans_id: "0",
        page: "1",
        skipCache: true,
      });

      if (!allTransactionsResponse.success) {
        return {
          success: false,
          message: "فشل جلب القيود المحاسبية",
        };
      }

      const transactions = allTransactionsResponse.data || [];
      const totalCount = allTransactionsResponse.count || transactions.length;

      if (transactions.length === 0) {
        return {
          success: true,
          message: "لا توجد قيود محاسبية للحذف",
          deletedCount: 0,
          totalCount: 0,
        };
      }

      // جمع جميع القيود من جميع الصفحات (مع trans_id و trans_type)
      let allTransactions: GLTransaction[] = [...transactions];

      // إذا كان هناك pagination، نحتاج لجلب جميع الصفحات
      if (totalCount > transactions.length) {
        // جلب جميع الصفحات
        const totalPages = Math.ceil(totalCount / transactions.length);

        for (let page = 1; page <= totalPages; page++) {
          const pageResponse = await this.getAll({
            xcom_id: companyId,
            xyear_id: "0",
            xtrans_type: "0",
            xtrans_id: "0",
            page: String(page),
            skipCache: true,
          });

          if (pageResponse.success && pageResponse.data) {
            allTransactions = [...allTransactions, ...pageResponse.data];
          }
        }
      }

      // إزالة التكرارات بناءً على id
      const uniqueTransactions = allTransactions.filter(
        (t, index, self) => 
          t.id && 
          t.id > 0 && 
          index === self.findIndex(tr => tr.id === t.id)
      );

      // استخراج IDs فقط
      const allIds = uniqueTransactions
        .map((t) => t.id)
        .filter((id): id is number => id !== undefined && id !== null && id > 0);

      if (allIds.length === 0) {
        return {
          success: false,
          message: "لم يتم العثور على قيود محاسبية للحذف",
          deletedCount: 0,
          totalCount,
        };
      }

      // إنشاء خريطة للوصول السريع للقيود
      const transactionMap = new Map<number, GLTransaction>();

      uniqueTransactions.forEach(t => {
        if (t.id) {
          transactionMap.set(t.id, t);
        }
      });

      // حذف القيود بشكل متسلسل (sequential) لتجنب أخطاء 500
      let deletedCount = 0;
      const failedIds: number[] = [];
      const maxRetries = 3;
      const retryDelay = 500; // 500ms بين المحاولات

      // دالة مساعدة لإعادة المحاولة
      const deleteWithRetry = async (id: number, retries = maxRetries): Promise<boolean> => {
        for (let attempt = 1; attempt <= retries; attempt++) {
          try {
            // الحصول على trans_id و trans_type من الخريطة
            const transaction = transactionMap.get(id);
            const transId = transaction?.trans_id ? String(transaction.trans_id) : "0";
            const transType = transaction?.trans_type ? String(transaction.trans_type) : "0";

            const response = await this.deleteTransaction(id, {
              xcom_id: companyId,
              xyear_id: "0",
              xtrans_type: transType,
              xtrans_id: transId,
              xfrom_date: "0",
              xto_date: "0",
              xcost_id: "0",
              xcust_id: "0",
              xacc_id: "0",
            });

            if (response.success) {
              return true;
            }

            // إذا فشلت المحاولة الأخيرة
            if (attempt === retries) {
              return false;
            }

            // انتظار قبل إعادة المحاولة
            await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
          } catch (error) {
            // إذا فشلت المحاولة الأخيرة
            if (attempt === retries) {
              console.error(`Failed to delete GL transaction ${id} after ${retries} attempts:`, error);

              return false;
            }

            // انتظار قبل إعادة المحاولة
            await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
          }
        }

        return false;
      };

      // حذف القيود واحداً تلو الآخر
      for (let i = 0; i < allIds.length; i++) {
        const id = allIds[i];
        const success = await deleteWithRetry(id);

        if (success) {
          deletedCount++;
        } else {
          failedIds.push(id);
        }

        // إضافة تأخير صغير بين الحذفات لتجنب إرهاق الـ API
        if (i < allIds.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      if (deletedCount === allIds.length) {
        return {
          success: true,
          message: `تم حذف جميع القيود المحاسبية بنجاح (${deletedCount} قيد)`,
          deletedCount,
          totalCount: allIds.length,
        };
      } else if (deletedCount > 0) {
        return {
          success: true,
          message: `تم حذف ${deletedCount} من ${allIds.length} قيد. فشل حذف ${failedIds.length} قيد.`,
          deletedCount,
          totalCount: allIds.length,
          failedIds,
        };
      } else {
        return {
          success: false,
          message: `فشل حذف جميع القيود المحاسبية (${failedIds.length} فشل)`,
          deletedCount: 0,
          totalCount: allIds.length,
          failedIds,
        };
      }
    } catch (error) {
      rethrowAuthenticationError(error);
      console.error("Error deleting GL transactions:", error);

      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء حذف القيود المحاسبية",
      };
    }
  }
}

export default new GLTransactionService();
