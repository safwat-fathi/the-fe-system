/**
 * Report error handling utilities
 * معالجة أخطاء التقارير
 */

export class ReportError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any,
  ) {
    super(message);
    this.name = "ReportError";
  }
}

export const REPORT_ERROR_CODES = {
  INVALID_DATE_RANGE: "INVALID_DATE_RANGE",
  MISSING_ACCOUNT: "MISSING_ACCOUNT",
  API_ERROR: "API_ERROR",
  DATA_PROCESSING_ERROR: "DATA_PROCESSING_ERROR",
} as const;

export function createReportError(
  code: keyof typeof REPORT_ERROR_CODES,
  message: string,
  details?: any,
): ReportError {
  return new ReportError(message, REPORT_ERROR_CODES[code], details);
}

export function handleReportError(error: unknown): {
  message: string;
  code?: string;
} {
  if (error instanceof ReportError) {
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
    message: "حدث خطأ أثناء إنشاء التقرير",
  };
}
