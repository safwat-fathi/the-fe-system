import { defaultLocale } from "@/i18n/config";
import {
  HttpServiceAbstract,
  IPaginatedResponse,
  IParams,
  TMethod,
} from "@/types/services/base";
import { getCookieAction } from "@/app/actions/cookie-store";
import { createParams } from "@/utilities/qs";
import { STORAGE_KEYS } from "@/constants";
import { AuthenticationError } from "@/utilities/errors/Authentication";

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

  private async _getBaseHeaders(): Promise<HeadersInit> {
    // Always get fresh token and locale from cookies/server context
    this._token = await getCookieAction(STORAGE_KEYS.ACCESS_TOKEN);
    const locale =
      (await getCookieAction(STORAGE_KEYS.LOCALE)) || defaultLocale;

    const headers: HeadersInit = {
      "Accept-Language": locale,
    };

    if (this._token) {
      headers.Authorization = `Bearer ${this._token.replace(/['"]+/g, "")}`;
    }

    return headers;
  }

  private async _logErrorResponse(
    method: TMethod,
    fullURL: string,
    response: Response,
  ): Promise<void> {
    let errorBody: string | undefined;

    try {
      errorBody = await response.clone().text();
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

  private async _parseResponseData(response: Response): Promise<any> {
    const contentType = response.headers.get("content-type");
    const isJson = contentType?.includes("application/json");

    if (isJson) {
      try {
        return await response.json();
      } catch {
        return null;
      }
    }

    return await response.text();
  }

  private async _request<R = T>(
    route: string,
    method: TMethod,
    options: RequestInit = {},
    params?: IParams,
    _retryCount: number = 0,
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

      const authHeaders = await this._getBaseHeaders();
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

      // Handle no content
      if (response.status === 204) {
        return { success: true };
      }

      // Log error details for failed requests
      if (!response.ok) {
        await this._logErrorResponse(method, fullURL, response);
      }

      // Handle unauthorized
      if (response.status === 401) {
        // Throw AuthenticationError to be caught by withAuthRedirect at page level.
        // Cannot call redirect() here because:
        // 1. This class runs outside the Server Component/Server Action context
        // 2. The NEXT_REDIRECT error would be caught by our try-catch below
        throw new AuthenticationError("Session expired");
      }

      // Parse response data
      const data = await this._parseResponseData(response);

      return {
        success: response.ok,
        data,
        message: response.ok
          ? undefined
          : `Request failed with status ${response.status}`,
      };
    } catch (error) {
      if (error instanceof AuthenticationError) {
        // Let callers handle auth-specific failures (e.g. redirect).
        throw error;
      }

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
    const comId = await this._getCompanyId();
    const mergedParams = comId
      ? { xcom_id: String(comId), ...params }
      : { ...params };

    let finalOptions = options;
    if (comId && options?.next?.tags) {
      finalOptions = {
        ...options,
        next: {
          ...options.next,
          tags: options.next.tags.map((tag) =>
            tag.replace("{xcom_id}", String(comId)),
          ),
        },
      };
    }

    return this._request<R>(route, "GET", finalOptions, mergedParams);
  }

  protected async getList<R = T[]>(
    route: string,
    params?: IParams,
    options?: RequestInit,
  ): Promise<ServiceResponse<R>> {
    const comId = await this._getCompanyId();
    const mergedParams = comId
      ? { xcom_id: String(comId), ...params }
      : { ...params };

    // Process cache tags to inject correct company ID
    let finalOptions = options;
    if (comId && options?.next?.tags) {
      finalOptions = {
        ...options,
        next: {
          ...options.next,
          tags: options.next.tags.map((tag) =>
            tag.replace("{xcom_id}", String(comId)),
          ),
        },
      };
    }

    return this._request<R>(route, "GET", finalOptions, mergedParams);
  }

  protected async post<R = T>(
    route: string,
    body: any,
    params?: IParams,
    options?: RequestInit,
  ): Promise<ServiceResponse<R>> {
    const comId = await this._getCompanyId();

    let finalBody = body;
    if (
      comId &&
      body &&
      typeof body === "object" &&
      !(body instanceof FormData)
    ) {
      finalBody = { com_id: String(comId), ...body };
    }

    const { processedBody, headers } = this._prepareBody(finalBody);

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
    const comId = await this._getCompanyId();

    // Inject xcom_id into body if it's an object and not FormData
    let finalBody = body;
    if (
      comId &&
      body &&
      typeof body === "object" &&
      !(body instanceof FormData)
    ) {
      finalBody = { com: String(comId), ...body };
    }

    const { processedBody, headers } = this._prepareBody(finalBody);

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
    const comId = await this._getCompanyId();

    let finalBody = body;
    if (
      comId &&
      body &&
      typeof body === "object" &&
      !(body instanceof FormData)
    ) {
      finalBody = { com: String(comId), ...body };
    }

    const { processedBody, headers } = this._prepareBody(finalBody);

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

  protected async _getCompanyId(): Promise<number | null> {
    const comId = await getCookieAction(STORAGE_KEYS.COMPANY_ID);

    if (comId) {
      const parsed = Number(comId);

      if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
      }
    }

    // عشان لو بيعمل login لسه مفيش company id
    return null;
  }
}
