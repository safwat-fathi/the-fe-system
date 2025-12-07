import { whatsappConfig } from "@/config/whatsapp";
import logger from "@/utilities/logger";

export interface WhatsappRequestOptions {
  path: string;
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  body?: Record<string, unknown> | FormData;
  idempotencyKey?: string;
  retryCount?: number;
}

export interface WhatsappResponse<T> {
  data: T;
  status: number;
  headers: Headers;
}

export interface WhatsappError {
  status: number;
  code?: string;
  message: string;
  details?: unknown;
}

const DEFAULT_TIMEOUT = 15000;
const MAX_RETRIES = 3;

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export class WhatsappHttpService {
  private getConfig() {
    const { baseUrl, token } = whatsappConfig;

    if (!baseUrl || !token) {
      throw new Error(
        "WhatsApp service is not configured. Please set WHATSAPP_BASE_URL and WHATSAPP_TOKEN environment variables.",
      );
    }

    return { baseUrl, token };
  }

  private async request<T>(
    options: WhatsappRequestOptions,
  ): Promise<WhatsappResponse<T>> {
    const {
      path,
      method = "POST",
      body,
      headers = {},
      idempotencyKey,
      retryCount = 0,
    } = options;

    const { baseUrl, token } = this.getConfig();
    const url = `${baseUrl}/${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

    const finalHeaders: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      ...headers,
    };

    if (!(body instanceof FormData)) {
      finalHeaders["Content-Type"] = "application/json";
    }

    if (idempotencyKey) {
      finalHeaders["Idempotency-Key"] = idempotencyKey;
    }

    try {
      const response = await fetch(url, {
        method,
        headers: finalHeaders,
        body:
          body instanceof FormData
            ? body
            : body
              ? JSON.stringify(body)
              : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const isJson =
        response.headers.get("content-type")?.includes("application/json") ??
        false;

      const payload = (await (isJson ? response.json() : response.text())) as T;

      if (!response.ok) {
        const errorBody =
          typeof payload === "string"
            ? payload
            : ((payload as any)?.error ?? payload);

        const error: WhatsappError = {
          status: response.status,
          code:
            (errorBody as any)?.code ??
            (errorBody as any)?.error?.code ??
            undefined,
          message:
            (errorBody as any)?.message ??
            (errorBody as any)?.error_user_msg ??
            "WhatsApp API request failed",
          details: errorBody,
        };

        if (
          [429, 500, 502, 503, 504].includes(response.status) &&
          retryCount < MAX_RETRIES
        ) {
          const delay = 2 ** retryCount * 500;

          logger.warn(
            "[WhatsAppHttpService] Retrying request",
            response.status,
            `retry=${retryCount + 1}`,
          );
          await sleep(delay);

          return this.request<T>({
            ...options,
            retryCount: retryCount + 1,
          });
        }

        logger.error("[WhatsAppHttpService] Request failed", {
          status: error.status,
          code: error.code,
          message: error.message,
        });

        throw error;
      }

      return {
        data: payload,
        status: response.status,
        headers: response.headers,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === "AbortError") {
        const abortError: WhatsappError = {
          status: 408,
          message: "WhatsApp request timed out",
        };

        logger.error("[WhatsAppHttpService] Timeout", abortError);
        throw abortError;
      }

      if ("status" in (error as WhatsappError)) {
        throw error;
      }

      const unexpected: WhatsappError = {
        status: 500,
        message:
          error instanceof Error ? error.message : "Unexpected WhatsApp error",
      };

      logger.error("[WhatsAppHttpService] Unexpected failure", unexpected);
      throw unexpected;
    }
  }

  async postJson<TResponse>(
    path: string,
    payload: Record<string, unknown>,
    idempotencyKey?: string,
  ) {
    return this.request<TResponse>({
      path,
      method: "POST",
      body: payload,
      idempotencyKey,
    });
  }

  async postFormData<TResponse>(
    path: string,
    formData: FormData,
    idempotencyKey?: string,
  ) {
    return this.request<TResponse>({
      path,
      method: "POST",
      body: formData,
      headers: {
        // Let fetch set boundary automatically; still need accept.
        Accept: "application/json",
      },
      idempotencyKey,
    });
  }
}

export const whatsappHttpService = new WhatsappHttpService();

export default whatsappHttpService;
