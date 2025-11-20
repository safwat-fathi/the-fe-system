"use server";

import customerService, {
  type GetCustomerInvoicesParams,
} from "@/services/api/customer.service";

export async function getCustomerInvoicesAction(
  params: GetCustomerInvoicesParams,
) {
  return customerService.getCustomerInvoices(params);
}
