

import {
  HttpServiceAbstract,
  IPaginatedResponse,
  IParams,
  TMethod,
} from "@/types/services/base";

import { getCookieAction, setCookieAction } from "@/app/actions/cookie-store";
import { createParams } from "@/utilities/qs";
import { STORAGE_KEYS } from "@/constants";
import { onLogoutAction } from "@/app/actions/auth";
import { AuthenticationError } from "@/utilities/errors/Authentication";
import { isTokenValid } from "@/utilities/token";

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
  private readonly _defaultOptions: RequestInit;
  private _isRefreshing = false;
  private _refreshPromise: Promise<boolean> | null = null;

  constructor(url: string, timeout = 10000) {
    super();

    if (!this._baseUrl) {
      throw new Error("API_BASE_URL is not defined");
    }

    this._baseUrl += url;

    this._defaultOptions = {
      signal: AbortSignal.timeout(timeout),
      headers: {
        Accept: "application/json",
      },
    };
  }

  private async _getAuthHeaders(): Promise<HeadersInit> {
    if (!this._token) {
      this._token = await getCookieAction(STORAGE_KEYS.ACCESS_TOKEN);
    }

    return this._token
      ? { Authorization: `Bearer ${this._token.replace(/['"]+/g, "")}` }
      : {};
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
      // await onLogoutAction();
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      console.error("Error during logout:", error);
      throw new AuthenticationError("Authentication failed");
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
      const authHeaders = await this._getAuthHeaders();
      const urlParams = createParams(params || {});
      const fullURL = `${this._baseUrl}/${route}?${urlParams.toString()}`;

      const requestOptions: RequestInit = {
        credentials: "include",
        ...this._defaultOptions,
        ...options,
        method,
        headers: {
          ...this._defaultOptions.headers,
          ...authHeaders,
          ...options.headers,
        },
      };

      const response = await fetch(fullURL, requestOptions);

      // Handle no content
      if (response.status === 204) {
        return { success: true };
      }

      // Handle unauthorized - try token refresh once
      if (response.status === 401 && retryCount === 0) {
        console.log("Authorization failed");

        const refreshSuccess = await this._handleTokenRefresh();

        if (refreshSuccess) {
          // Retry the original request with new token
          return this._request(route, method, options, params, retryCount + 1);
        }

        // If refresh failed, return unauthorized response
        throw new AuthenticationError("Session expired - please login again");
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
