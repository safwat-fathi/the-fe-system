"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import invoiceService from "@/services/api/invoice.service";
import { type Invoice, type InvoiceDetail } from "@/types/models/invoice";
import type { GetAllInvoicesParams } from "@/services/api/invoice.service";

export async function getAllInvoicesAction(params?: GetAllInvoicesParams) {
  return invoiceService.getAllInvoices(params);
}

export async function getInvoiceByIdAction(id: string) {
  return invoiceService.getInvoiceById(id);
}

export async function getInvoiceDetailsAction(invoiceId: string) {
  return invoiceService.getInvoiceDetails(invoiceId);
}

export async function getNextInvoiceIdAction(transType: number) {
  try {
    const result = await invoiceService.getNextInvoiceId(transType);

    return result;
  } catch (error) {
    throw error;
  }
}

export async function createInvoiceAction(payload: Partial<Invoice>) {
  try {
    const result = await invoiceService.createInvoice(payload);

    if (result) {
      await revalidateTag("invoices");
      await revalidatePath("/reports/invoices");
    }

    return result;
  } catch (error) {
    throw error;
  }
}

export async function updateInvoiceAction(
  id: number | string,
  payload: Partial<Invoice>,
) {
  try {
    const result = await invoiceService.updateInvoice(id, payload);

    return result;
  } catch (error) {
    throw error;
  }
}

export async function createInvoiceDetailAction(
  payload: Partial<InvoiceDetail>,
) {
  try {
    const result = await invoiceService.createInvoiceDetail(payload);

    return result;
  } catch (error) {
    throw error;
  }
}

export async function updateInvoiceDetailAction(
  id: number,
  payload: Partial<InvoiceDetail>,
) {
  try {
    const result = await invoiceService.updateInvoiceDetail(id, payload);

    return result;
  } catch (error) {
    throw error;
  }
}

export async function deleteInvoiceDetailAction(id: number) {
  try {
    const result = await invoiceService.deleteInvoiceDetail(id);

    if (result) {
      await revalidateTag("invoices");
      await revalidatePath("/reports/invoices");
    }

    return result;
  } catch (error) {
    throw error;
  }
}
