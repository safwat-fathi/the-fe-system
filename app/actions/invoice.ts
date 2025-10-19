"use server";

import invoiceService from "@/services/api/invoice.service";
import {
  type Invoice,
  type InvoiceDetail,
} from "@/types/models/invoice";
import type { GetAllInvoicesParams } from "@/services/api/invoice.service";

export async function getAllInvoicesAction(
  params?: GetAllInvoicesParams,
) {
  return invoiceService.getAllInvoices(params);
}

export async function getInvoiceByIdAction(id: string) {
  return invoiceService.getInvoiceById(id);
}

export async function getInvoiceDetailsAction(invoiceId: string) {
  return invoiceService.getInvoiceDetails(invoiceId);
}

export async function createInvoiceAction(
  payload: Partial<Invoice>,
) {
  try {
    console.log("📨 createInvoiceAction payload:", payload);
    const result = await invoiceService.createInvoice(payload);
    console.log("📨 createInvoiceAction result:", result);
    return result;
  } catch (error) {
    console.error("📨 createInvoiceAction error:", error);
    throw error;
  }
}

export async function updateInvoiceAction(
  id: number,
  payload: Partial<Invoice>,
) {
  try {
    console.log("✏️ updateInvoiceAction payload:", { id, payload });
    const result = await invoiceService.updateInvoice(id, payload);
    console.log("✏️ updateInvoiceAction result:", result);
    return result;
  } catch (error) {
    console.error("✏️ updateInvoiceAction error:", error);
    throw error;
  }
}

export async function createInvoiceDetailAction(
  payload: Partial<InvoiceDetail>,
) {
  try {
    console.log("🧾 createInvoiceDetailAction payload:", payload);
    const result = await invoiceService.createInvoiceDetail(payload);
    console.log("🧾 createInvoiceDetailAction result:", result);
    return result;
  } catch (error) {
    console.error("🧾 createInvoiceDetailAction error:", error);
    throw error;
  }
}

export async function updateInvoiceDetailAction(
  id: number,
  payload: Partial<InvoiceDetail>,
) {
  try {
    console.log("🛠️ updateInvoiceDetailAction payload:", { id, payload });
    const result = await invoiceService.updateInvoiceDetail(id, payload);
    console.log("🛠️ updateInvoiceDetailAction result:", result);
    return result;
  } catch (error) {
    console.error("🛠️ updateInvoiceDetailAction error:", error);
    throw error;
  }
}

export async function deleteInvoiceDetailAction(id: number) {
  try {
    console.log("🗑️ deleteInvoiceDetailAction id:", id);
    const result = await invoiceService.deleteInvoiceDetail(id);
    console.log("🗑️ deleteInvoiceDetailAction result:", result);
    return result;
  } catch (error) {
    console.error("🗑️ deleteInvoiceDetailAction error:", error);
    throw error;
  }
}
