"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { cookies } from "next/headers";

import invoiceService, {
  type GetAllInvoicesParams,
} from "@/services/api/invoice.service";
import { type Invoice, type InvoiceDetail } from "@/types/models/invoice";
import { STORAGE_KEYS } from "@/constants";

export async function getAllInvoicesAction(params?: GetAllInvoicesParams) {
  return invoiceService.getAllInvoices(params);
}

export async function getInvoiceByIdAction(id: string) {
  return invoiceService.getInvoiceById(id);
}

export async function getInvoiceDetailsAction(invoiceId: string) {
  return invoiceService.getInvoiceDetails(invoiceId);
}

export async function getMaxInvoiceIdAction(transType: number) {
  const com_id = (await cookies()).get(STORAGE_KEYS.COMPANY_ID)?.value;

  if (!com_id) throw new Error("company id not found");

  return invoiceService.getMaxInvoiceId(transType, Number(com_id));
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

export async function createInvoiceBoxAction(
  payload: Omit<
    import("@/types/models/invoice").CreateInvoiceBoxDto,
    "cr_user"
  >,
) {
  const cookieStore = await cookies();
  const userId = cookieStore.get(STORAGE_KEYS.USER_ID)?.value;

  if (!userId) {
    throw new Error("user id not found");
  }

  const result = await invoiceService.createInvoiceBox({
    ...payload,
    cr_user: userId,
  });

  return result;
}

export async function getPaidTypeListAction() {
  return invoiceService.getPaidTypeList();
}
