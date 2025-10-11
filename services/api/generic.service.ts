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
  
  // Customers
  customers_list: {
    endpoint: "customers_list/",
    paramTransform: (params) => ({
      xcom_id: params.com || params.xcom_id || params.xcomp_id || "1",
      xcust_type: params.xcust_type || "0",
      xcust_code: params.xcust_code || "0",
    }),
  },
  
  // Invoices
  invoices_list: {
    endpoint: "invoices_list/",
    paramTransform: (params) => ({
      xcom_id: "1",
      xyear_id: "0",  // 0 = كل السنوات
      xtrans_type: "0",
      xinv_id: "1",
      xfrom_date: "0",
      xto_date: "0",
      xinv_type: "0",
      page: "1",
    }),
  },
  
  // Items
  items_list: {
    endpoint: "items_list/",
    paramTransform: (params) => ({
      xcom_id: params.com || params.xcom_id || params.xcomp_id || "1",
      xyear_id: "0",  // 0 = كل السنوات
      xitem_code: params.xitem_code || "0",
      xcat_id: params.xcat_id || "0",
    }),
  },
  
  // Accounts (no extra params - uses default branch params from HttpService)
  accounts_list: {
    endpoint: "accounts_list/",
  },
  
  // Boxes (without trailing slash as per helper.service.ts)
  boxes_list: {
    endpoint: "boxes_list",
    paramTransform: (params) => ({
      xcom_id: params.com || params.xcom_id || params.xcomp_id || "1",
      xyear_id: "0",  // 0 = كل السنوات
    }),
  },
  
  // Categories
  categories_list: {
    endpoint: "categories_list/",
    paramTransform: (params) => ({
      xcom_id: params.com || params.xcom_id || params.xcomp_id || "1",
      xyear_id: "0",  // 0 = كل السنوات
    }),
  },
  
  // Cost Centers (without trailing slash as per cost-center.service.ts)
  cost_centers_list: {
    endpoint: "cost_centers_list",
    paramTransform: (params) => ({
      xcom_id: params.com || params.xcom_id || params.xcomp_id || "1",
      xyear_id: "0",  // 0 = كل السنوات
    }),
  },
  
  // Currencies
  currencies_list: {
    endpoint: "currencies_list/",
    paramTransform: (params) => ({
      xcom_id: params.com || params.xcom_id || params.xcomp_id || "1",
      xyear_id: "0",  // 0 = كل السنوات
    }),
  },
  
  // Customer Types
  cust_type_list: {
    endpoint: "cust_type_list/",
    paramTransform: (params) => ({
      xcom_id: params.com || params.xcom_id || params.xcomp_id || "1",
      xyear_id: "0",  // 0 = كل السنوات
    }),
  },
  
  // Units
  units_list: {
    endpoint: "units_list/",
    paramTransform: (params) => ({
      xcom_id: params.com || params.xcom_id || params.xcomp_id || "1",
      xyear_id: "0",  // 0 = كل السنوات
    }),
  },
  
  // Users
  users_list: {
    endpoint: "users_list/",
    paramTransform: (params) => ({
      xcom_id: params.com || params.xcom_id || params.xcomp_id || "1",
      xyear_id: "0",  // 0 = كل السنوات
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
    params?: Record<string, any>
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
      const longCacheTables = ['currencies_list', 'units_list', 'cust_type_list', 'categories_list'];
      const mediumCacheTables = ['accounts_list', 'cost_centers_list', 'boxes_list'];
      
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
          tags: [tableName, params?.com ? `branch-${params.com}` : 'default-branch'],
        }
      });

      const endTime = Date.now();
      logger.debug(`⏱️ Request took: ${endTime - startTime}ms`);
      logger.debug("✅ GenericService Response:", {
        success: response.success,
        dataType: typeof response.data,
        isArray: Array.isArray(response.data),
      });

      // Check if response data is HTML (404 error) - BEFORE any other checks
      const responseDataStr = String(response.data || '');
      if (responseDataStr.includes('<!doctype html>') || responseDataStr.includes('<html')) {
        logger.error("❌ Received HTML response (404 Not Found)");
        return {
          success: false,
          data: [],
          message: `Endpoint "${endpoint}" not found. Please check if the endpoint exists in the API.`,
        };
      }

      logger.debug("📊 Has results?:", response.data && typeof response.data === 'object' && 'results' in response.data);

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
        else if (response.data && typeof response.data === "object" && Array.isArray((response.data as any).results)) {
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
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء جلب البيانات",
      };
    }
  }
}

export default new GenericService();

