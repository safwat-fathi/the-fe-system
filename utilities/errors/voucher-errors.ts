/**
 * Voucher error handling utilities
 * معالجة أخطاء السندات
 */

export class VoucherError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any,
  ) {
    super(message);
    this.name = "VoucherError";
  }
}

export const VOUCHER_ERROR_CODES = {
  INVALID_VOUCHER_ID: "INVALID_VOUCHER_ID",
  INVALID_DATE: "INVALID_DATE",
  UNBALANCED: "UNBALANCED",
  MISSING_DETAILS: "MISSING_DETAILS",
  INVALID_ACCOUNT: "INVALID_ACCOUNT",
  API_ERROR: "API_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
} as const;

export function createVoucherError(
  code: keyof typeof VOUCHER_ERROR_CODES,
  message: string,
  details?: any,
): VoucherError {
  return new VoucherError(message, VOUCHER_ERROR_CODES[code], details);
}

export function handleVoucherError(error: unknown): {
  message: string;
  code?: string;
} {
  if (error instanceof VoucherError) {
    return {
      message: error.message,
      code: error.code,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
    };
  }

  return {
    message: "حدث خطأ غير متوقع",
  };
}

