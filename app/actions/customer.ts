"use server";

import type { Customer } from "@/types/models/customer";

import customerService, {
  type GetCustomerInvoicesParams,
} from "@/services/api/customer.service";

export async function getCustomerInvoicesAction(
  params: GetCustomerInvoicesParams,
) {
  return customerService.getCustomerInvoices(params);
}

export async function getCustomersAction() {
  return customerService.getAllCustomers();
}

export async function createCustomerAction(
  customer: Omit<Customer, "id">,
): Promise<Customer | null> {
  return customerService.createCustomer(customer);
}
