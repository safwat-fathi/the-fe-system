/**
 * Export all voucher actions
 *
 * Note: Each individual action file has "use server" directive.
 * This index file re-exports them but does NOT have "use server" to allow re-exporting.
 *
 * IMPORTANT: In client components, always use dynamic import:
 * const { deleteVoucherAction } = await import("@/app/actions/voucher.action");
 */

export { createVoucherAction } from "./create";
export { updateVoucherAction } from "./update";
export { deleteVoucherAction } from "./delete";
export { getNextVoucherNumberAction } from "./get-next-number";
// getCurrentUsername is a helper function, not a server action
// Import it directly from helpers/common if needed
