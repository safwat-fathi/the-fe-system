/**
 * Utilities for parallel API fetching
 * مساعدات لجلب البيانات بشكل متوازي
 */

/**
 * Fetch multiple items in parallel with error handling
 * جلب عدة عناصر بشكل متوازي مع معالجة الأخطاء
 */
export async function fetchInParallel<T, R>(
  items: T[],
  fetchFn: (item: T) => Promise<R | null>,
  options?: {
    batchSize?: number;
    onError?: (item: T, error: unknown) => void;
  },
): Promise<(R | null)[]> {
  const { batchSize = 10, onError } = options || {};

  // Split items into batches to avoid overwhelming the server
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }

  const results: (R | null)[] = [];

  // Process batches sequentially, but items within batch in parallel
  for (const batch of batches) {
    const batchResults = await Promise.allSettled(
      batch.map(async (item) => {
        try {
          return await fetchFn(item);
        } catch (error) {
          onError?.(item, error);
          return null;
        }
      }),
    );

    results.push(
      ...batchResults.map((result) =>
        result.status === "fulfilled" ? result.value : null,
      ),
    );
  }

  return results;
}

/**
 * Fetch with retry logic
 * جلب مع إعادة المحاولة
 */
export async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>,
  options?: {
    maxRetries?: number;
    retryDelay?: number;
    onRetry?: (attempt: number) => void;
  },
): Promise<T> {
  const { maxRetries = 3, retryDelay = 1000, onRetry } = options || {};
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fetchFn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        onRetry?.(attempt + 1);
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }

  throw lastError;
}

