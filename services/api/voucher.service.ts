import { HttpService } from "@/services/base";
import { IParams, IPaginatedResponse } from "@/types/services/base";

export interface Voucher {
  id?: number;
  vouch_id?: number;
  vouch_date: string;
  vouch_type: number;
  vouch_amt?: number;
  pay_type?: number;
  cr_date?: string;
  vouch_status?: number;
  vouch_notes?: string;
  ref_no?: string;
  acc_id?: number;
  cost_id?: number;
  opps_vouch?: number;
  com_id?: number;
  com?: number;
  cust_id?: number;
  commit?: boolean;
  post?: boolean;
  print?: boolean;
}

export interface VoucherDetail {
  dtl_id?: number;
  vouch_id?: number;
  acc_id?: number;
  acc_name?: string;
  cost_id?: number;
  cost_name?: string;
  debit?: number; // مدين (نقد)
  credit?: number; // دائن (نقد)
  debit_base?: number; // مدين اساس
  credit_base?: number; // دائن اساس
  p_debit?: number; // مدين مدفوع (غير مستخدم حالياً)
  p_credit?: number; // دائن مدفوع (غير مستخدم حالياً)
  gauge?: number; // العيار
  g_debit?: number; // مدين (ذهب)
  g_credit?: number; // دائن (ذهب)
  g_debit_base?: number; // مدين معاير (ذهب)
  g_credit_base?: number; // دائن معاير (ذهب)
  tax?: number;
  tax_prc?: number;
  notes?: string;
  seq?: number;
}

export interface VoucherBox {
  box_id?: number;
  vouch_id?: number;
  box_no?: string;
  box_type?: number;
  gold_type?: number;
  weight?: number;
  notes?: string;
}

export class VoucherService extends HttpService<Voucher> {
  constructor() {
    super("");
  }

  /**
   * الحصول على جميع السندات (مع pagination)
   */
  async getAll(params?: IParams) {
    const queryParams: any = {
      xcom_id: "1",
      xyear_id: "0",
      xvouch_type: params?.xvouch_type || params?.vouch_type || "0",
      xvouch_id: params?.xvouch_id || "0",
      xfrom_date: params?.xfrom_date || "0",
      xto_date: params?.xto_date || "0",
      page: params?.page || "1",
    };

    const vouchType = queryParams.xvouch_type || "0";

    const response = await this.get<IPaginatedResponse<Voucher>>(
      "vouchers_list",
      queryParams,
      {
        cache: "force-cache",
        next: {
          revalidate: 300, // Cache for 5 minutes
          tags: ["vouchers", `vouchers-type-${vouchType}`],
        },
      },
    );

    // معالجة الاستجابة المُقسّمة (pagination)
    if (response.success && response.data) {
      const data = response.data as any;

      // إذا كانت الاستجابة تحتوي على results (pagination)
      if (data.results && Array.isArray(data.results)) {
        return {
          success: true,
          data: data.results,
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
          data: data,
          count: data.length,
          message: response.message,
        };
      }
    }

    return {
      success: false,
      data: [],
      count: 0,
      message: response.message || "لم يتم العثور على قيود",
    };
  }

  /**
   * الحصول على جميع السندات مع إجماليات عبر جميع الصفحات
   * يعيد بيانات الصفحة الحالية بالإضافة إلى إجماليات كاملة
   */
  async getAllWithTotals(params?: IParams) {
    const toPositiveInt = (value: unknown, fallback = 0): number => {
      const numeric = Number(value);

      return Number.isFinite(numeric) && numeric > 0 ? numeric : fallback;
    };

    const requestedPageRaw =
      typeof params?.page === "string" ? params.page : params?.page;
    const requestedPageNumber = toPositiveInt(requestedPageRaw, 1);
    const safeRequestedPage = requestedPageNumber > 0 ? requestedPageNumber : 1;

    const filters: IParams = { ...(params || {}) };

    if ("page" in filters) {
      delete filters.page;
    }

    const totals = {
      totalAmount: 0,
      totalGold: 0,
    };

    const pageResultsMap = new Map<number, any[]>();
    let aggregatedCount = 0;
    let highestCountFromApi = 0;
    let lastPageSize = 0;
    let currentPage = 1;
    let shouldContinue = true;
    let loopGuard = 0;

    while (shouldContinue) {
      loopGuard += 1;

      if (loopGuard > 200) {
        console.warn(
          "[voucherService.getAllWithTotals] Pagination loop exceeded safety limit (200 iterations).",
        );
        break;
      }

      const response = await this.getAll({
        ...filters,
        page: String(currentPage),
      });

      if (!response.success || !response.data) {
        break;
      }

      const pageResults: any[] = Array.isArray(response.data)
        ? response.data
        : [];

      pageResultsMap.set(currentPage, pageResults);

      pageResults.forEach((voucher) => {
        totals.totalAmount += parseFloat(String(voucher?.vouch_amt ?? 0)) || 0;
        totals.totalGold += parseFloat(String(voucher?.bag_wt ?? 0)) || 0;
      });

      aggregatedCount += pageResults.length;
      lastPageSize = pageResults.length > 0 ? pageResults.length : lastPageSize;

      const responseCount = toPositiveInt(response.count, 0);

      highestCountFromApi = Math.max(highestCountFromApi, responseCount);

      const hasNext =
        typeof response.next === "string" && response.next.trim().length > 0;
      const reachedDeclaredCount =
        highestCountFromApi > 0 && aggregatedCount >= highestCountFromApi;
      const noData = pageResults.length === 0;

      if (!hasNext || reachedDeclaredCount || noData) {
        shouldContinue = false;
      } else {
        currentPage += 1;
      }
    }

    if (pageResultsMap.size === 0) {
      return {
        success: true,
        pageData: [],
        count: 0,
        totalPages: 0,
        totals,
      };
    }

    const firstPageResults = pageResultsMap.get(1) ?? [];
    const firstPageSize =
      firstPageResults.length > 0
        ? firstPageResults.length
        : lastPageSize > 0
          ? lastPageSize
          : 1;

    const finalCount =
      highestCountFromApi > 0
        ? Math.max(highestCountFromApi, aggregatedCount)
        : aggregatedCount;

    const derivedTotalPages =
      firstPageSize > 0 && finalCount > 0
        ? Math.ceil(finalCount / firstPageSize)
        : pageResultsMap.size;

    const totalPages = Math.max(pageResultsMap.size, derivedTotalPages, 1);

    const normalizedRequestedPage =
      safeRequestedPage > totalPages ? totalPages : safeRequestedPage;

    const currentPageData =
      pageResultsMap.get(normalizedRequestedPage) ?? firstPageResults;

    return {
      success: true,
      pageData: currentPageData,
      count: finalCount,
      totalPages,
      totals,
    };
  }

  /**
   * الحصول على السندات حسب النوع
   */
  async getByType(voucherType: number, params?: IParams) {
    return this.getAll({ ...params, xvouch_type: voucherType });
  }

  /**
   * التحقق من وجود قيد افتتاحي (بدون cache للدقة)
   */
  async checkExistingOpeningEntry(comId: string | number = "1") {
    const queryParams: any = {
      xcom_id: String(comId),
      xyear_id: "0",
      xvouch_type: "0", // قيد افتتاحي فقط
      xvouch_id: "0",
      xfrom_date: "0",
      xto_date: "0",
      page: "1",
    };

    // ✅ استخدام no-store للتحقق الدقيق من قاعدة البيانات
    const response = await this.get<IPaginatedResponse<Voucher>>(
      "vouchers_list",
      queryParams,
      {
        cache: "no-store", // ✅ بدون cache للتحقق الدقيق
      },
    );

    if (response.success && response.data) {
      const data = response.data as any;
      let vouchers: any[] = [];

      if (data.results && Array.isArray(data.results)) {
        vouchers = data.results;
      } else if (Array.isArray(data)) {
        vouchers = data;
      }

      // البحث عن قيد افتتاحي ينتمي للفرع المحدد
      const openingEntry = vouchers.find((v: any) => {
        const isCorrectType = v?.vouch_type === 0 || v?.vouch_type === "0";
        const voucherCom = Number(v?.com_id ?? v?.com ?? 1);
        const isCorrectBranch = voucherCom === Number(comId);

        return isCorrectType && isCorrectBranch;
      });

      return openingEntry || null;
    }

    return null;
  }

  /**
   * الحصول على سند واحد بالـ ID (مباشر وسريع - مثل getInvoiceById)
   */
  async getVoucherById(
    id: number | string,
    params?: IParams,
  ): Promise<Voucher | null> {
    try {
      const branchParam =
        params?.["xcom_id"] ?? params?.["com_id"] ?? params?.["com"] ?? "1";

      // البحث بالـ ID يمكن أن يكون id (primary key) أو vouch_id (رقم القيد)
      const requestedId = String(id).trim();
      const numericRequestedId = Number(id);

      const queryParams: IParams = {
        xcom_id: branchParam,
        xyear_id: params?.xyear_id || "0",
        xvouch_type: params?.xvouch_type || params?.vouch_type || "0", // "0" = جميع الأنواع
        xvouch_id: requestedId, // البحث بالـ ID (يمكن أن يكون id أو vouch_id)
        xfrom_date: "0",
        xto_date: "0",
        page: "1", // صفحة واحدة فقط
      };

      // ✅ استخدام no-store للحصول على أحدث البيانات من قاعدة البيانات
      const response = await this.get<IPaginatedResponse<Voucher> | Voucher[]>(
        "vouchers_list",
        queryParams,
        {
          cache: "no-store", // ✅ بدون cache للحصول على أحدث البيانات
        },
      );

      if (response.success && response.data) {
        const data: any = response.data;

        // Helper to pick best match from a list
        const pickFromList = (list: any[]): Voucher | null => {
          if (!Array.isArray(list)) return null;

          // البحث أولاً بـ id (primary key)
          const byId = list.find(
            (v: any) => Number(v?.id) === numericRequestedId,
          );

          if (byId) return byId as Voucher;

          // Fallback إلى vouch_id
          const byVouchId = list.find(
            (v: any) => Number(v?.vouch_id) === numericRequestedId,
          );

          if (byVouchId) return byVouchId as Voucher;

          // آخر حل: أول عنصر في القائمة
          return (list[0] ?? null) as Voucher;
        };

        // معالجة paginated response
        if (Array.isArray(data)) {
          return pickFromList(data);
        }

        if (Array.isArray((data as any)?.results)) {
          return pickFromList((data as any).results);
        }

        // إذا كان object مباشر
        if (data && typeof data === "object") {
          if (
            Number(data.id) === numericRequestedId ||
            Number(data.vouch_id) === numericRequestedId
          ) {
            return data as Voucher;
          }
        }
      }

      return null;
    } catch (error) {
      console.error("Error fetching voucher by ID:", error);

      return null;
    }
  }

  /**
   * إنشاء سند جديد
   */
  async create(voucher: any) {
    return this.post<Voucher>("api_create_vouch", voucher);
  }

  /**
   * تحديث سند موجود
   */
  async update(id: number, voucher: any) {
    // استخدام ID في URL كما في Postman
    return this.patch<Voucher>(`api_update_vouch/${id}`, voucher);
  }

  /**
   * حذف سند
   */
  async deleteVoucher(id: number) {
    return this.delete(`api_delete_vouch/${id}`);
  }

  // ====== تفاصيل السند ======

  /**
   * الحصول على تفاصيل سند معين
   * ملاحظة: vouchers_dtl_list يستخدم xvouch_id (id من جدول vouchers) و xcom_id
   */
  async getDetails(voucherId: number, params?: IParams) {
    const branchParam =
      params?.["xcom_id"] ??
      params?.["com_id"] ??
      params?.["com"] ??
      params?.["xcomp_id"] ??
      "1";

    // إزالة com من البارامترات لعدم إرساله في الطلب

    const cleanParams: IParams = { ...(params || {}) };

    delete cleanParams.com;
    delete cleanParams.com_id;
    delete cleanParams.xcomp_id;

    const queryParams: IParams = {
      ...cleanParams,
      xvouch_id: voucherId, // id من جدول vouchers
      xcom_id: branchParam, // رقم الفرع
      page: params?.page || "1", // pagination
    };

    const response = await this.get<IPaginatedResponse<VoucherDetail>>(
      "vouchers_dtl_list",
      queryParams,
      {
        cache: "force-cache",
        next: {
          revalidate: 60, // Cache for 1 minute (details may change more frequently)
          tags: [
            "voucher-details",
            `voucher-details-${voucherId}-${branchParam}`,
          ],
        },
      },
    );

    // معالجة الاستجابة المُقسّمة (pagination)
    if (response.success && response.data) {
      const data = response.data as any;

      // إذا كانت الاستجابة تحتوي على results (pagination)
      if (data.results && Array.isArray(data.results)) {
        return {
          success: true,
          data: data.results,
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
          data: data,
          count: data.length,
          message: response.message,
        };
      }
    }

    return {
      success: false,
      data: [],
      count: 0,
      message: response.message || "لم يتم العثور على تفاصيل",
    };
  }

  /**
   * إنشاء تفصيل سند جديد
   */
  async createDetail(detail: any) {
    return this.post<VoucherDetail>("api_create_vouch_dtl", detail);
  }

  /**
   * تحديث تفصيل سند
   */
  async updateDetail(id: number, detail: any) {
    return this.patch<VoucherDetail>(`api_update_vouch_dtl/${id}`, detail);
  }

  /**
   * حذف تفصيل سند
   */
  async deleteDetail(id: number) {
    return this.delete(`api_delete_vouch_dtl/${id}`);
  }

  // ====== صناديق السند ======

  /**
   * الحصول على صناديق سند معين
   * ملاحظة: vouchers_box_list يستخدم xvouch_id (id من جدول vouchers) و xcom_id
   */
  async getBoxes(vouchId: number, params?: IParams) {
    const branchParam =
      params?.["xcom_id"] ??
      params?.["com_id"] ??
      params?.["com"] ??
      params?.["xcomp_id"] ??
      "1";

    // إزالة com من البارامترات لعدم إرساله في الطلب

    const cleanParams: IParams = { ...(params || {}) };

    delete cleanParams.com;
    delete cleanParams.com_id;
    delete cleanParams.xcomp_id;

    const queryParams: IParams = {
      ...cleanParams,
      xvouch_id: vouchId, // id من جدول vouchers (primary key) - vouchers_box_list يتوقع xvouch_id وليس vouch_id
      xcom_id: branchParam, // رقم الفرع
    };

    return this.getList<VoucherBox[]>("vouchers_box_list", queryParams);
  }

  /**
   * إنشاء صندوق سند جديد
   */
  async createBox(box: VoucherBox) {
    return this.post<VoucherBox>("api_create_vouch_box", box);
  }

  /**
   * تحديث صندوق سند
   */
  async updateBox(id: number, box: Partial<VoucherBox>) {
    return this.patch<VoucherBox>(`api_update_vouch_box/${id}`, box);
  }

  /**
   * حذف صندوق سند
   */
  async deleteBox(id: number) {
    return this.delete(`api_delete_vouch_box/${id}`);
  }

  // ====== القوائم المساعدة ======

  /**
   * Helper method لجلب قوائم البيانات من API
   */
  private async _getListData(
    endpoint: string,
    params?: IParams,
    options?: {
      useBranchParams?: boolean;
      logLabel?: string;
      cache?: RequestCache;
      next?: { tags?: string[]; revalidate?: number };
    },
  ) {
    try {
      let queryParams: IParams = {};

      if (options?.useBranchParams !== false) {
        queryParams = {
          com: params?.com || params?.xcom_id || "1",
          year: params?.year || params?.xyear_id || "1",
        };
      } else {
        queryParams = params || {};
      }

      const response = await this.getList<any[]>(
        endpoint,
        queryParams,
        options?.cache
          ? {
              cache: options.cache,
              next: options.next,
            }
          : undefined,
      );

      if (response.success && response.data) {
        const data = Array.isArray(response.data) ? response.data : [];

        return {
          success: true,
          data: data,
        };
      }

      if (options?.logLabel) {
        console.warn(`${options.logLabel} API returned no data`);
      }

      return { success: false, data: [] };
    } catch (error) {
      if (options?.logLabel) {
        console.error(`Error fetching ${options.logLabel}:`, error);
      }

      return { success: false, data: [] };
    }
  }

  /**
   * الحصول على أنواع السندات
   */
  async getVoucherTypes(params?: IParams) {
    const com = params?.com || params?.xcom_id || "1";
    const year = params?.year || params?.xyear_id || "1";

    return this._getListData("getVoucherTypeList", params, {
      useBranchParams: true,
      logLabel: "Voucher types",
      cache: "force-cache",
      next: {
        revalidate: 600, // Cache for 10 minutes (voucher types don't change often)
        tags: ["voucher-types", `voucher-types-${com}-${year}`],
      },
    });
  }

  /**
   * الحصول على حالات السندات
   */
  async getVoucherStages(params?: IParams) {
    const com = params?.com || params?.xcom_id || "1";
    const year = params?.year || params?.xyear_id || "1";

    const response = await this._getListData("getVoucherStageList", params, {
      useBranchParams: true,
      logLabel: "Voucher stages",
      cache: "force-cache",
      next: {
        revalidate: 600, // Cache for 10 minutes (voucher stages don't change often)
        tags: ["voucher-stages", `voucher-stages-${com}-${year}`],
      },
    });

    return response;
  }

  /**
   * الحصول على رقم السند التالي لنوع معين
   */
  async getNextNumber(voucherType: number = 2) {
    try {
      const baseParams = {
        xvouch_type: String(voucherType),
        page: "1",
      };

      const firstPage = await this.getAll(baseParams);

      if (
        !firstPage.success ||
        !firstPage.data ||
        (Array.isArray(firstPage.data) && firstPage.data.length === 0)
      ) {
        return 1;
      }

      const firstPageData: any[] = Array.isArray(firstPage.data)
        ? firstPage.data
        : [];
      const pageSize = firstPageData.length || 1;
      const totalCount = firstPage.count ?? firstPageData.length;

      let candidates = firstPageData.filter(
        (v: any) =>
          Number(v?.vouch_type) === Number(voucherType) &&
          Number.isFinite(Number(v?.vouch_id)) &&
          Number(v?.vouch_id) > 0,
      );

      if (totalCount > pageSize) {
        const lastPageNumber = Math.ceil(totalCount / pageSize);

        if (lastPageNumber > 1) {
          const lastPage = await this.getAll({
            ...baseParams,
            page: String(lastPageNumber),
          });

          if (lastPage.success && Array.isArray(lastPage.data)) {
            const lastPageData = lastPage.data.filter(
              (v: any) =>
                Number(v?.vouch_type) === Number(voucherType) &&
                Number.isFinite(Number(v?.vouch_id)) &&
                Number(v?.vouch_id) > 0,
            );

            if (lastPageData.length > 0) {
              candidates = lastPageData;
            }
          }
        }
      }

      if (candidates.length === 0) {
        return 1;
      }

      const maxId = candidates.reduce((max, curr) => {
        const currentId = Number(curr?.vouch_id) || 0;

        return currentId > max ? currentId : max;
      }, 0);

      return maxId + 1;
    } catch {
      return 1;
    }
  }

  /**
   * الحصول على أنواع المعايرة
   */
  async getCaratTypes(params?: IParams) {
    return this._getListData("getCaratTypeList", params, {
      useBranchParams: false,
      logLabel: "Carat types",
      cache: "force-cache",
      next: {
        revalidate: 600, // Cache for 10 minutes (carat types don't change often)
        tags: ["carat-types"],
      },
    });
  }

  // ====== تفاصيل السند الذهبي (Gold Voucher Details) ======

  /**
   * الحصول على تفاصيل سند ذهبي معين
   * ملاحظة: gvouchers_dtl_list يستخدم xvouch_id (id من جدول vouchers) و xcom_id
   */
  async getGoldDetails(vouchId: number, params?: IParams) {
    const branchParam =
      params?.["xcom_id"] ??
      params?.["com_id"] ??
      params?.["com"] ??
      params?.["xcomp_id"] ??
      "1";

    // إزالة com من البارامترات لعدم إرساله في الطلب

    const cleanParams: IParams = { ...(params || {}) };

    delete cleanParams.com;
    delete cleanParams.com_id;
    delete cleanParams.xcomp_id;

    const queryParams: IParams = {
      ...cleanParams,
      xvouch_id: vouchId, // id من جدول vouchers (primary key)
      xcom_id: branchParam, // رقم الفرع
      page: params?.page || "1", // pagination
    };

    const response = await this.getList<any[]>(
      "gvouchers_dtl_list",
      queryParams,
    );

    // معالجة الاستجابة المُقسّمة (pagination)
    if (response.success && response.data) {
      const data = response.data as any;

      // إذا كانت الاستجابة تحتوي على results (pagination)
      if (data.results && Array.isArray(data.results)) {
        return {
          success: true,
          data: data.results,
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
          data: data,
          count: data.length,
          message: response.message,
        };
      }
    }

    return {
      success: false,
      data: [],
      count: 0,
      message: response.message || "لم يتم العثور على تفاصيل الذهب",
    };
  }

  /**
   * إنشاء تفصيل سند ذهبي جديد
   */
  async createGoldDetail(detail: any) {
    return this.post<any>("api_create_gvouch_dtl", detail);
  }

  /**
   * تحديث تفصيل سند ذهبي
   */
  async updateGoldDetail(id: number, detail: any) {
    // استخدام PATCH بدلاً من PUT لأن PUT قد لا يكون مدعوم
    return this.patch<any>(`api_update_gvouch_dtl/${id}`, detail);
  }

  /**
   * حذف تفصيل سند ذهبي
   */
  async deleteGoldDetail(id: number, params?: IParams) {
    // إضافة com إذا كان مطلوباً
    const queryParams: IParams = {
      ...params,
      com: params?.com || params?.xcom_id || "1",
    };

    return this.delete(`api_delete_gvouch_dtl/${id}`, queryParams);
  }
}

export default new VoucherService();
