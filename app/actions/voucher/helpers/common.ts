/**
 * Common helper functions for voucher actions
 */

import { cookies } from "next/headers";

import { STORAGE_KEYS } from "@/constants";
import { customerService } from "@/services/api";

interface CustomerInfo {
  name: string | null;
  accountId: number | null;
}

/**
 * Get current user username from cookies
 */
export async function getCurrentUsername(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const userData = cookieStore.get(STORAGE_KEYS.USER_DATA)?.value;

    if (!userData) {
      return null;
    }

    try {
      const parsedUserData = JSON.parse(decodeURIComponent(userData));

      return parsedUserData.username || parsedUserData.email || null;
    } catch (error) {
      return null;
    }
  } catch (error) {
    return null;
  }
}

/**
 * Get customer info (name + account id) from customer ID
 */
export async function getCustomerInfo(
  custId: number | null | undefined,
): Promise<CustomerInfo | null> {
  if (!custId || custId <= 0) {
    return null;
  }

  try {
    const customers = await customerService.getAllCustomers({ xcom_id: 1 });
    const customer = customers.find((c) => c.id === custId);

    if (!customer) {
      return null;
    }

    return {
      name: customer.cust_name || null,
      accountId:
        customer.acc !== undefined && customer.acc !== null
          ? Number(customer.acc)
          : null,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Get customer name from customer ID
 */
export async function getCustomerName(
  custId: number | null | undefined,
): Promise<string | null> {
  const info = await getCustomerInfo(custId);

  return info?.name || null;
}

/**
 * Get voucher source based on voucher type
 */
export function getVoucherSource(vouchType: number): string {
  const sourceMap: Record<number, string> = {
    0: "GL_Balance",
    1: "GL_CashReceipt",
    2: "GL_CashPayment",
    3: "GL_Adjustment",
    4: "GL_CustomerReceipt",
    5: "GL_CustomerPayment",
    111: "GL_Receipt",
    222: "GL_Delivery",
  };

  return sourceMap[vouchType] || "GL_Unknown";
}

/**
 * Extract date and time from ISO string
 */
export function extractDateAndTime(dateString: string): {
  date: string;
  time: string;
} {
  try {
    const date = new Date(dateString);
    const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
    const timeStr = date.toISOString(); // YYYY-MM-DDThh:mm:ss.sssZ

    return { date: dateStr, time: timeStr };
  } catch (error) {
    const now = new Date();

    return {
      date: now.toISOString().split("T")[0],
      time: now.toISOString(),
    };
  }
}

/**
 * Get box account ID
 */
export async function getBoxAccountId(boxId: number): Promise<number | null> {
  if (!boxId || boxId <= 0) {
    return null;
  }

  try {
    const { boxesService } = await import("@/services/api");

    const boxes = await boxesService.getBoxes({ xcom_id: 1 });
    let box = boxes.find((b) => b.id === boxId);

    if (!box) {
      const goldBoxes = await boxesService.getGoldBoxes({ xcom_id: 1 });
      box = goldBoxes.find((b) => b.id === boxId);
    }

    if (!box) {
      return null;
    }

    const accId = box?.acc ? Number(box.acc) : null;

    if (!accId || accId <= 0) {
      return null;
    }

    return accId;
  } catch (error) {
    console.error(
      `[SERVER] ❌ فشل جلب حساب الصندوق ${boxId}:`,
      error instanceof Error ? error.message : String(error),
    );

    return null;
  }
}

/**
 * Get voucher type name
 */
export function getVoucherTypeName(vouchType: number): string {
  const typeNames: Record<number, string> = {
    0: "قيد افتتاحي",
    1: "سند قبض",
    2: "سند صرف",
    3: "قيد تسوية",
    4: "سند قبض عميل",
    5: "سند صرف عميل",
    111: "استلام",
    222: "تسليم",
  };

  return typeNames[vouchType] || "غير محدد";
}
