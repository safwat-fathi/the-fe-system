import {
  HttpServiceAbstract,
  IPaginatedResponse,
  IParams,
  TMethod,
} from "@/types/services/base";
import { getCookieAction, setCookieAction } from "@/app/actions/cookie-store";
import { createParams } from "@/utilities/qs";
import { STORAGE_KEYS } from "@/constants";
import { AuthenticationError } from "@/utilities/errors/Authentication";
import { getBranchParams } from "@/app/actions/branch-params";

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

    this._baseUrl += url;
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

  private async _addBranchParams(params: IParams): Promise<IParams> {
    try {
      const branchParams = await getBranchParams();

      return {
        ...params,
        ...branchParams,
      };
    } catch (error) {
      console.warn("Failed to get branch parameters, using defaults:", error);

      return {
        ...params,
        com: "1",
        year: new Date().getFullYear().toString(),
      };
    }
  }

  private async _handleTokenRefresh(): Promise<boolean> {
    if (this._isRefreshing && this._refreshPromise) {
      return this._refreshPromise;
    }

    this._isRefreshing = true;
    this._refreshPromise = this._performTokenRefresh();

    try {
      const result = await this._refreshPromise;

      return result;
    } finally {
      this._isRefreshing = false;
      this._refreshPromise = null;
    }
  }

  private async _performTokenRefresh(): Promise<boolean> {
    try {
      // Get refresh token
      const refreshToken = await getCookieAction(STORAGE_KEYS.REFRESH_TOKEN);

      if (!refreshToken) {
        // No refresh token available, redirect to login
        // await this._clearTokens();

        throw new AuthenticationError("Session expired");
      }

      // Make request to refresh token endpoint
      const refreshResponse = await fetch(`${this._baseUrl}/auth/refresh/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh: refreshToken }),
        credentials: "include",
      });

      console.log(
        "🚀 ~ :100 ~ HttpService ~ _performTokenRefresh ~ refreshResponse:",
        refreshResponse,
      );

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();

        // Update tokens in cookies
        if (refreshData.access) {
          // Update the token in memory
          this._token = refreshData.access;

          // Save new access token to cookies

          await setCookieAction(STORAGE_KEYS.ACCESS_TOKEN, refreshData.access);

          return true;
        }
      }

      // If refresh token request fails, clear all tokens
      throw new AuthenticationError("Session expired");

      return false;
    } catch (error) {
      await this._clearTokens();
      throw error;
    }
  }

  private async _clearTokens(): Promise<void> {
    try {
      await onLogoutAction();
    } catch (error) {
      // Do not throw to avoid cascading failures
      console.error("Error during logout:", error);
    }
  }

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
      const urlParams = createParams(params || {});
      const searchParams = urlParams.toString();
      const fullURL = searchParams
        ? `${this._baseUrl}/${route}?${searchParams}`
        : `${this._baseUrl}/${route}`;

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
      const responseClone = response.clone();

      // Handle no content
      if (response.status === 204) {
        return { success: true };
      }

      if (!response.ok) {
        let errorBody: string | undefined;

        try {
          errorBody = await responseClone.text();
        } catch (readError) {
          errorBody = `<<failed to read body: ${String(readError)}>>`;
        }

        console.error(
          `HTTP error for ${method} ${fullURL}`,
          JSON.stringify(
            {
              status: response.status,
              statusText: response.statusText,
              headers: Object.fromEntries(response.headers.entries()),
              body: errorBody,
            },
            null,
            2,
          ),
        );
      }

      // Handle unauthorized simply: clear tokens and redirect to login
      if (response.status === 401) {
        await this._clearTokens();
        if (typeof window !== "undefined") {
          try {
            window.location.href = "/auth/login";
          } catch {}
        }

        return {
          success: false,
          message: "Unauthorized",
        } as ServiceResponse<R>;
      }

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

      return {
        success: response.ok,
        data,
        message: response.ok
          ? undefined
          : `Request failed with status ${response.status}`,
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
