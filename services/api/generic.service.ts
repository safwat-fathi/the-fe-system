import HttpService from "@/services/base/http.service";
import { ServiceResponse } from "@/services/base/http.service";
import { logger } from "@/utilities/logger";

// Table configuration mapping
interface TableConfig {
  endpoint: string;
  paramTransform?: (params: Record<string, any>) => Record<string, any>;
}

const TABLE_CONFIGS: Record<string, TableConfig> = {
  // Home
  home_list: {
    endpoint: "home_list",
  },

  // Customers (قوائم أساسية - بدون year)
  customers_list: {
    endpoint: "customers_list",
    paramTransform: (params) => ({
      xcom_id: params.com || params.xcom_id || params.xcomp_id || "1",
      xcust_type: params.xcust_type || "0",
      xcust_code: params.xcust_code || "0",
    }),
  },

  // Invoices (حركات - تحتاج year)
  invoices_list: {
    endpoint: "invoices_list",
    paramTransform: (params) => ({
      xcom_id: "1",
      xyear_id: params.xyear_id || "0", // 0 = كل السنوات
      xtrans_type: "0",
      xinv_id: "1",
      xfrom_date: "0",
      xto_date: "0",
      xinv_type: "0",
      page: "1",
    }),
  },

  // Vouchers (حركات - تحتاج year)
  vouchers_list: {
    endpoint: "vouchers_list",
    paramTransform: (params) => ({
      xcom_id: params.com || params.xcom_id || params.xcomp_id || "1",
      xyear_id: params.xyear_id || "0", // 0 = كل السنوات
      xvouch_type: params.xvouch_type || params.vouch_type || "0", // ✅ xvouch_type
      xvouch_id: params.xvouch_id || "0", // ✅ إضافة
      xfrom_date: params.xfrom_date || "0", // ✅ إضافة
      xto_date: params.xto_date || "0", // ✅ إضافة
      page: params.page || "1", // pagination
    }),
  },

  // Items (قوائم أساسية - بدون year)
  items_list: {
    endpoint: "items_list",
    paramTransform: (params) => ({
      xcom_id: params.com || params.xcom_id || params.xcomp_id || "1",
      xitem_code: params.xitem_code || "0",
      xcat_id: params.xcat_id || "0",
    }),
  },

  // Accounts (قوائم أساسية - بدون year)
  accounts_list: {
    endpoint: "accounts_list",
    paramTransform: (params) => ({
      xcom_id: params.com || params.xcom_id || params.xcomp_id || "1",
    }),
  },

  // Boxes (قوائم أساسية - بدون year)
  boxes_list: {
    endpoint: "boxes_list",
  },

  // Categories (قوائم أساسية - بدون year)
  categories_list: {
    endpoint: "categories_list",
  },

  // Cost Centers (قوائم أساسية - بدون year)
  cost_centers_list: {
    endpoint: "cost_centers_list",
  },

  // Currencies (قوائم أساسية - بدون year)
  currencies_list: {
    endpoint: "currencies_list",
  },

  // Customer Types (قوائم أساسية - بدون year)
  cust_type_list: {
    endpoint: "cust_type_list",
  },

  // Units (قوائم أساسية - بدون year)
  units_list: {
    endpoint: "units_list",
  },

  // Users (قوائم أساسية - بدون year)
  users_list: {
    endpoint: "users_list",
  },

  // Voucher Details (تفاصيل القيود - تحتاج id و xcom_id فقط)
  vouchers_dtl_list: {
    endpoint: "vouchers_dtl_list",
    paramTransform: (params) => ({
      id: params.id || params.voucherId || "0", // معرف القيد من جدول vouchers
      com:
        params.com || params.com_id || params.xcom_id || params.xcomp_id || "1", // رقم الفرع
      xcom_id:
        params.xcom_id || params.xcomp_id || params.com || params.com_id || "1",
      // لا يحتاج year parameter
    }),
  },

  // Invoice Details (تفاصيل الفواتير - تحتاج xinv_id و xcom_id فقط)
  invoices_dtl_list: {
    endpoint: "invoices_dtl_list",
    paramTransform: (params) => ({
      xcom_id: params.xcom_id || params.com || "1", // رقم الفرع
      xtrans_type: params.xtrans_type || "0",
      xinv_id: params.xinv_id || params.invoiceId || "0",
      xfrom_date: params.xfrom_date || "0",
      xto_date: params.xto_date || "0",
      xinv_type: params.xinv_type || "0",
      // لا يحتاج year parameter
    }),
  },

  // Voucher Boxes (صناديق القيود - تحتاج xvouch_id و xcom_id)
  vouchers_box_list: {
    endpoint: "vouchers_box_list",
    paramTransform: (params) => ({
      xvouch_id: params.xvouch_id || params.vouch_id || params.voucherId || "0", // API يتوقع xvouch_id (الأولوية لـ xvouch_id)
      xcom_id: params.xcom_id || params.com || "1", // رقم الفرع
      // لا يحتاج year parameter
    }),
  },

  // GL Transactions (القيود المحاسبية)
  gl_transaction_list: {
    endpoint: "gl_transaction_list",
    paramTransform: (params) => ({
      xcom_id: params.xcom_id || params.com || "1",
      xyear_id: params.xyear_id || params.year || "0",
      xfrom_date: params.xfrom_date || params.from_date || "0",
      xto_date: params.xto_date || params.to_date || "0",
      xtrans_type: params.xtrans_type || params.trans_type || "0",
      xtrans_id: params.xtrans_id || params.trans_id || "0",
      xcost_id: params.xcost_id || "0", // مركز التكلفة
      xcust_id: params.xcust_id || "0", // رقم العميل
      xacc_id: params.xacc_id || "0", // رقم الحساب
    }),
  },
};

class GenericService extends HttpService<any> {
  constructor() {
    super("", 10000); // 10 seconds timeout
  }

  /**
   * Get data from any table dynamically
   * @param tableName - Name of the table/endpoint to fetch data from
   * @param params - Optional query parameters
   * @returns ServiceResponse with array of data
   */
  async getTableData(
    tableName: string,
    params?: Record<string, any>,
  ): Promise<ServiceResponse<any[]>> {
    try {
      // Get table configuration or use tableName as is
      const config = TABLE_CONFIGS[tableName];
      const endpoint = config?.endpoint || tableName;

      // For tables without config, send empty params to let HttpService add branch params
      // For tables with config, use the transform function
      let finalParams: Record<string, any> | undefined;

      if (config?.paramTransform) {
        // Use transformed params
        finalParams = config.paramTransform(params || {});
      } else {
        // Send undefined to let HttpService add branch params automatically
        finalParams = undefined;
      }

      logger.debug("🔍 GenericService Request:", {
        table: tableName,
        endpoint,
        originalParams: params,
        finalParams,
        baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
      });

      const startTime = Date.now();

      // Optimize caching based on table type
      let cacheTime = 300; // Default 5 minutes

      // Tables that change less frequently get longer cache
      const longCacheTables = [
        "currencies_list",
        "units_list",
        "cust_type_list",
        "categories_list",
      ];
      const mediumCacheTables = [
        "accounts_list",
        "cost_centers_list",
        "boxes_list",
      ];

      if (longCacheTables.includes(tableName)) {
        cacheTime = 600; // 10 minutes
      } else if (mediumCacheTables.includes(tableName)) {
        cacheTime = 300; // 5 minutes
      } else {
        cacheTime = 60; // 1 minute for dynamic data
      }

      const response = await this.get<any[]>(endpoint, finalParams, {
        next: {
          revalidate: cacheTime,
          tags: [
            tableName,
            params?.com ? `branch-${params.com}` : "default-branch",
          ],
        },
      });

      const endTime = Date.now();

      logger.debug(`⏱️ Request took: ${endTime - startTime}ms`);
      logger.debug("✅ GenericService Response:", {
        success: response.success,
        dataType: typeof response.data,
        isArray: Array.isArray(response.data),
      });

      // Check if response data is HTML (404 error) - BEFORE any other checks
      const responseDataStr = String(response.data || "");

      if (
        responseDataStr.includes("<!doctype html>") ||
        responseDataStr.includes("<html")
      ) {
        logger.error("❌ Received HTML response (404 Not Found)");

        return {
          success: false,
          data: [],
          message: `Endpoint "${endpoint}" not found. Please check if the endpoint exists in the API.`,
        };
      }

      logger.debug(
        "📊 Has results?:",
        response.data &&
          typeof response.data === "object" &&
          "results" in response.data,
      );

      if (response.success) {
        // Handle different response structures

        // Case 1: Direct array
        if (Array.isArray(response.data)) {
          logger.debug("✅ Handling as direct array");

          return {
            success: true,
            data: response.data,
            message: `تم جلب ${response.data.length} سجل بنجاح`,
          };
        }

        // Case 2: Paginated response with results array
        else if (
          response.data &&
          typeof response.data === "object" &&
          Array.isArray((response.data as any).results)
        ) {
          logger.debug("✅ Handling as paginated response (results)");
          const results = (response.data as any).results;

          return {
            success: true,
            data: results,
            message: `تم جلب ${results.length} سجل بنجاح (من أصل ${(response.data as any).count || results.length})`,
          };
        }

        // Case 3: Single object
        else if (response.data && typeof response.data === "object") {
          logger.debug("✅ Handling as single object");

          return {
            success: true,
            data: [response.data],
            message: "تم جلب البيانات بنجاح",
          };
        }
      }

      return {
        success: false,
        data: [],
        message: response.message || "No data returned from API",
      };
    } catch (error) {
      logger.error("❌ Error fetching table data:", error);

      return {
        success: false,
        data: [],
        message:
          error instanceof Error ? error.message : "حدث خطأ أثناء جلب البيانات",
      };
    }
  }
}

export default new GenericService();
