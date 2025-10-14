import {
  HttpServiceAbstract,
  IPaginatedResponse,
  IParams,
  TMethod,
} from "@/types/services/base";
import { getCookieAction } from "@/app/actions/cookie-store";
import { createParams } from "@/utilities/qs";
import { STORAGE_KEYS } from "@/constants";

// Enhanced response type for better type safety
export interface ServiceResponse<T = any> {
  data?: T;
  success: boolean;
  message?: string;
  errors?: any[];
}

export default class HttpService<T = any> extends HttpServiceAbstract<T> {
  private readonly _baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  private _token: string | undefined = undefined;
  private readonly _timeout: number;
  private readonly _defaultHeaders: HeadersInit;
  private _isRefreshing = false;
  private _refreshPromise: Promise<boolean> | null = null;

  constructor(url: string, timeout = 10000) {
    super();

    if (!this._baseUrl) {
      throw new Error("API_BASE_URL is not defined");
    }

    // إزالة الـ trailing slash من baseUrl لتجنب مشاكل المسارات المزدوجة
    const cleanBaseUrl = this._baseUrl.replace(/\/+$/, "");

    this._baseUrl = cleanBaseUrl + url;
    this._timeout = timeout;
    this._defaultHeaders = {
      Accept: "application/json",
    };
  }

  private async _getAuthHeaders(): Promise<HeadersInit> {
    // Always get fresh token from cookies
    this._token = await getCookieAction(STORAGE_KEYS.ACCESS_TOKEN);

    return this._token
      ? { Authorization: `Bearer ${this._token.replace(/['"]+/g, "")}` }
      : {};
  }

  // Cache branch params to avoid repeated cookie reads
  private static _cachedBranchParams: {
    params: IParams;
    timestamp: number;
  } | null = null;
  private static readonly CACHE_DURATION = 60000; // 1 minute cache

  private async _addBranchParams(params: IParams): Promise<IParams> {
    // إذا كانت المعاملات تحتوي بالفعل على com أو year، لا تستبدلها
    // هذا يمنع القراءة المكررة للـ cookies عندما تكون المعاملات موجودة من الصفحة
    if (
      params.com ||
      params.year ||
      params.xcom_id ||
      params.xyear_id ||
      params.xcomp_id
    ) {
      return params;
    }

    // Check cache first
    const now = Date.now();

    if (
      HttpService._cachedBranchParams &&
      now - HttpService._cachedBranchParams.timestamp <
        HttpService.CACHE_DURATION
    ) {
      return {
        ...params,
        ...HttpService._cachedBranchParams.params,
      };
    }

    // فقط في حالات نادرة عندما لا تكون المعاملات موجودة، نقرأ من cookies
    // هذا التحسين يقلل عدد مرات قراءة cookies بشكل كبير
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();

    const selectedBranch = cookieStore.get("selectedBranch")?.value || "1";
    const selectedYear =
      cookieStore.get("selectedYear")?.value ||
      new Date().getFullYear().toString();

    const branchParams = {
      com: selectedBranch,
      year: selectedYear,
    };

    // Cache the result
    HttpService._cachedBranchParams = {
      params: branchParams,
      timestamp: now,
    };

    return {
      ...params,
      ...branchParams,
    };
  }

  // private async _handleTokenRefresh(): Promise<boolean> {
  //   if (this._isRefreshing && this._refreshPromise) {
  //     return this._refreshPromise;
  //   }

  //   this._isRefreshing = true;
  //   this._refreshPromise = this._performTokenRefresh();

  //   try {
  //     const result = await this._refreshPromise;
  //     return result;
  //   } finally {
  //     this._isRefreshing = false;
  //     this._refreshPromise = null;
  //   }
  // }

  // private async _performTokenRefresh(): Promise<boolean> {
  //   try {
  //     const refreshTokenRes = await authService.refreshToken();

  //     if (refreshTokenRes?.success) {
  //       this._token = refreshTokenRes.data?.token;
  //       // await onLoginAction(refreshTokenRes.data, true);
  //       return true;
  //     }

  //     // If refresh fails, redirect to login
  //     await onLogoutAction();
  //     await appRedirect("/login");
  //     return false;
  //   } catch (error) {
  //     return false;
  //   }
  // }

  private async _request<R = T>(
    route: string,
    method: TMethod,
    options: RequestInit = {},
    params?: IParams,
    retryCount = 0,
  ): Promise<ServiceResponse<R>> {
    try {
      // Validate base URL is configured
      if (!this._baseUrl || this._baseUrl.startsWith("undefined")) {
        return {
          success: false,
          message:
            "API base URL is not configured. Please set NEXT_PUBLIC_API_BASE_URL in your .env.local file.",
        };
      }

      const authHeaders = await this._getAuthHeaders();

      // إضافة معاملات com و year تلقائياً من الكوكيز
      const mergedParams = await this._addBranchParams(params || {});

      const urlParams = createParams(mergedParams);
      // تنظيف route من أي slashes في البداية لتجنب //
      const cleanRoute = route.replace(/^\/+/, "");
      const fullURL = `${this._baseUrl}/${cleanRoute}?${urlParams.toString()}`;

      // Create a new AbortSignal for each request
      const requestOptions: RequestInit = {
        // credentials: "include", // إزالة credentials لتجنب مشكلة CORS
        ...options,
        signal: options.signal || AbortSignal.timeout(this._timeout),
        method,
        headers: {
          ...this._defaultHeaders,
          ...authHeaders,
          ...options.headers,
        },
      };

      const response = await fetch(fullURL, requestOptions);

      // Parse response
      const contentType = response.headers.get("content-type");
      const isJson = contentType?.includes("application/json");

      let data: any;

      if (isJson) {
        try {
          data = await response.json();
        } catch {
          data = null;
        }
      } else {
        data = await response.text();
      }

      // Only log errors
      if (!response.ok) {
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.error("❌ HTTP ERROR:", response.status);
        console.error("🌐 URL:", fullURL);
        console.error("📥 Response:", data);

        const errorMsg =
          data?.message ||
          data?.error ||
          data?.detail ||
          data?.msg ||
          (typeof data === "string" ? data : null) ||
          "No error message";

        console.error("💬 Message:", errorMsg);
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      }

      // Handle no content
      if (response.status === 204) {
        return { success: true };
      }

      // Handle unauthorized - try token refresh once
      if (response.status === 401 && retryCount === 0) {
        return {
          success: false,
          message: "Authentication failed - please login again",
          data,
        };
      }

      // Extract error message from response
      let errorMessage = `Request failed with status ${response.status}`;
      
      if (!response.ok && data) {
        if (typeof data === "string") {
          errorMessage = data;
        } else if (typeof data === "object") {
          errorMessage =
            data.message ||
            data.error ||
            data.detail ||
            data.msg ||
            data.error_description ||
            JSON.stringify(data);
        }
      }

      return {
        success: response.ok,
        data,
        message: response.ok ? undefined : errorMessage,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  private _prepareBody(body: any): {
    processedBody: any;
    headers: HeadersInit;
  } {
    if (body instanceof FormData) {
      return {
        processedBody: body,
        headers: {}, // Let browser set Content-Type for FormData
      };
    }

    if (body && typeof body === "object") {
      return {
        processedBody: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      };
    }

    return {
      processedBody: body,
      headers: { "Content-Type": "application/json" },
    };
  }

  // Public API methods with consistent return types
  protected async get<R = T>(
    route: string,
    params?: IParams,
    options?: RequestInit,
  ): Promise<ServiceResponse<R>> {
    return this._request<R>(route, "GET", options, params);
  }

  protected async getList<R = T[]>(
    route: string,
    params?: IParams,
    options?: RequestInit,
  ): Promise<ServiceResponse<R>> {
    return this._request<R>(route, "GET", options, params);
  }

  protected async post<R = T>(
    route: string,
    body: any,
    params?: IParams,
    options?: RequestInit,
  ): Promise<ServiceResponse<R>> {
    const { processedBody, headers } = this._prepareBody(body);

    return this._request<R>(
      route,
      "POST",
      {
        ...options,
        body: processedBody,
        headers: { ...headers, ...options?.headers },
      },
      params,
    );
  }

  protected async put<R = T>(
    route: string,
    body: any,
    params?: IParams,
    options?: RequestInit,
  ): Promise<ServiceResponse<R>> {
    const { processedBody, headers } = this._prepareBody(body);

    return this._request<R>(
      route,
      "PUT",
      {
        ...options,
        body: processedBody,
        headers: { ...headers, ...options?.headers },
      },
      params,
    );
  }

  protected async patch<R = T>(
    route: string,
    body: any,
    params?: IParams,
    options?: RequestInit,
  ): Promise<ServiceResponse<R>> {
    const { processedBody, headers } = this._prepareBody(body);

    return this._request<R>(
      route,
      "PATCH",
      {
        ...options,
        body: processedBody,
        headers: { ...headers, ...options?.headers },
      },
      params,
    );
  }

  protected async delete<R = T>(
    route: string,
    params?: IParams,
    options?: RequestInit,
  ): Promise<ServiceResponse<R>> {
    return this._request<R>(route, "DELETE", options, params);
  }

  // Utility method for handling paginated responses
  protected async getPaginated<R = T>(
    route: string,
    params?: IParams,
    options?: RequestInit,
  ): Promise<ServiceResponse<IPaginatedResponse<R>>> {
    return this._request<IPaginatedResponse<R>>(route, "GET", options, params);
  }
}
