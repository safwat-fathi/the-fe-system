import { AuthenticationError } from "@/utilities/errors/Authentication";
import { redirectToLogin } from "@/app/actions/auth";

/**
 * Wraps an async function and catches AuthenticationError, redirecting to login.
 * Use this to handle 401 errors in server components without repetitive try-catch blocks.
 *
 * @example
 * // Instead of:
 * try {
 *   const data = await fetchData();
 * } catch (error) {
 *   if (error instanceof AuthenticationError) {
 *     await redirectToLogin();
 *   }
 *   throw error;
 * }
 *
 * // Use:
 * const data = await withAuthRedirect(() => fetchData());
 */
export async function withAuthRedirect<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      await redirectToLogin();
    }
    throw error;
  }
}
