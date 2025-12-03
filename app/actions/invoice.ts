"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import invoiceService, {
  type GetAllInvoicesParams,
} from "@/services/api/invoice.service";
import { type Invoice, type InvoiceDetail } from "@/types/models/invoice";

export async function getAllInvoicesAction(params?: GetAllInvoicesParams) {
  return invoiceService.getAllInvoices(params);
}

export async function getInvoiceByIdAction(id: string) {
  return invoiceService.getInvoiceById(id);
}

export async function getInvoiceDetailsAction(invoiceId: string) {
  return invoiceService.getInvoiceDetails(invoiceId);
}

export async function createInvoiceAction(payload: Partial<Invoice>) {
  const result = await invoiceService.createInvoice(payload);

  if (result) {
    await revalidateTag("invoices");
    await revalidatePath("/reports/invoices");
  }

  return result;
}

export async function updateInvoiceAction(
  id: number | string,
  payload: Partial<Invoice>,
) {
  const parsedId = Number(id);

  if (!Number.isFinite(parsedId) || parsedId <= 0) {
    throw new Error("invalid invoice id for update");
  }

  const result = await invoiceService.updateInvoice(parsedId, payload);

  if (result) {
    const stringId = String(parsedId);

    await revalidateTag("invoices");
    await revalidatePath("/reports/invoices");
    await revalidateTag(`invoice-details-${stringId}`);
  }

  return result;
}

export async function createInvoiceDetailAction(
  payload: Partial<InvoiceDetail>,
  invoiceId?: number | string,
) {
  const result = await invoiceService.createInvoiceDetail(payload);

  if (result) {
    const targetInvoiceId =
      invoiceId ??
      payload.inv ??
      (result.inv !== undefined ? result.inv : undefined);

    await revalidateTag("invoices");
    await revalidatePath("/reports/invoices");

    if (targetInvoiceId !== undefined && targetInvoiceId !== null) {
      await revalidateTag(`invoice-details-${targetInvoiceId}`);
    }
  }

  return result;
}

export async function updateInvoiceDetailAction(
  id: number,
  payload: Partial<InvoiceDetail>,
  invoiceId?: number | string,
) {
  const result = await invoiceService.updateInvoiceDetail(id, payload);

  if (result) {
    const targetInvoiceId =
      invoiceId ??
      payload.inv ??
      (result.inv !== undefined ? result.inv : undefined);

    await revalidateTag("invoices");
    await revalidatePath("/reports/invoices");

    if (targetInvoiceId !== undefined && targetInvoiceId !== null) {
      await revalidateTag(`invoice-details-${targetInvoiceId}`);
    }
  }

  return result;
}

export async function deleteInvoiceDetailAction(
  id: number,
  invoiceId?: number | string,
) {
  
    const result = await invoiceService.deleteInvoiceDetail(id);

    if (result) {
      await revalidateTag("invoices");
      await revalidatePath("/reports/invoices");

      if (invoiceId !== undefined && invoiceId !== null) {
        await revalidateTag(`invoice-details-${invoiceId}`);
      }
    }

    return result;
  
}
