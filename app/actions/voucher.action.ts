/**
 * Voucher Actions
 * This file is maintained for backward compatibility
 * New code should import from app/actions/voucher/index.ts
 * 
 * IMPORTANT: This file re-exports server actions from "./voucher/index" which has "use server".
 * Types are NOT exported here to avoid bundling issues.
 * 
 * For client components:
 * - Use dynamic import for actions: const { deleteVoucherAction } = await import("@/app/actions/voucher.action");
 * - For types: import type { SaveVoucherData } from "@/app/actions/voucher/types";
 */

// Re-export all actions from the new structure
// These are server actions and should be imported dynamically in client components
export {
  createVoucherAction,
  updateVoucherAction,
  deleteVoucherAction,
  createGLTransactionRecords,
} from "./voucher/index";

// Note: getCurrentUsername uses next/headers and should only be imported in Server Components
// Do not export it here to avoid bundling issues
