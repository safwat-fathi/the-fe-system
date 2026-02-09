import type { Account } from "@/types/models/account";
import type { Box } from "@/types/models/box";
import type { Item } from "@/types/models/item";
import type { Customer } from "@/types/models/customer";
import type { Category } from "@/types/items";
import type { CostCenter } from "@/types/voucher-form";
import type { Voucher, VoucherBox, GVoucherDetail } from "@/types/voucher";

import { cache } from "react";

import customerService from "../api/customer.service";
import itemService from "../api/item.service";
import categoryService from "../api/category.service";
import boxesService from "../api/boxes.service";
import costCenterService from "../api/cost-center.service";
import accountService from "../api/account.service";
import { voucherService } from "../api";

import { getBranchParams } from "@/app/actions/branch-params";
import { HttpService } from "@/services/base";
import { rethrowAuthenticationError } from "@/utilities/errors/Authentication";

// Voucher type for delivery
const DELIVERY_VOUCH_TYPE = "222";

export interface DeliveryFormData {
  accounts: Account[];
  boxes: Box[];
  goldBoxes: Box[];
  costCenters: CostCenter[];
  customers: Customer[];
  items: Item[];
  categories: Category[];
  voucherTypes: any[];
}

export interface DeliveryVoucherData {
  voucher: Voucher | null;
  voucherBoxes: VoucherBox[];
  goldDetails: GVoucherDetail[];
  navigationInfo: {
    previous: number | null;
    next: number | null;
    first: number | null;
    last: number | null;
    vouchersCount: number | null;
  };
}

// Helper functions
const ensureArray = <T>(data: unknown): T[] =>
  Array.isArray(data) ? data : [];

const filterAccounts = (response: unknown): Account[] => {
  return ensureArray<Account>(response).filter(
    (account) => account.acc_level === 5,
  );
};

const processItems = (response: { results?: Item[] } | unknown): Item[] => {
  if (
    typeof response === "object" &&
    response !== null &&
    "results" in response &&
    Array.isArray((response as { results?: Item[] }).results)
  ) {
    return (response as { results: Item[] }).results;
  }

  return ensureArray<Item>(response);
};

const parseNavId = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numeric = Number(value);

  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
};

class DeliveryFormDataService extends HttpService<any> {
  constructor() {
    super("");
  }

  /**
   * Get all form data needed for delivery voucher page
   */
  getDeliveryFormData = cache(async (): Promise<DeliveryFormData> => {
    try {
      const branchParams = await getBranchParams();
      const parsedCompanyId = Number(branchParams.com ?? 1);
      const companyId = Number.isFinite(parsedCompanyId) ? parsedCompanyId : 1;

      // Fetch all required data in parallel
      const [
        accountsResponse,
        boxesResponse,
        goldBoxesResponse,
        costCentersResponse,
        customersResponse,
        itemsResponse,
        categoriesResponse,
        voucherTypesResponse,
      ] = await Promise.all([
        accountService.getAllAccounts(),
        boxesService.getBoxes({ xcom_id: companyId }),
        boxesService.getGoldBoxes({ xcom_id: companyId }),
        costCenterService.getAllCostCenters(),
        customerService.getAllCustomers({ xcom_id: companyId }),
        itemService.searchItems({ searchTerm: "", page: 1 }),
        categoryService.getAllCategories(),
        voucherService.getVoucherTypes({
          com: String(companyId),
          year: "1",
        }),
      ]);

      // Process responses
      const accounts = filterAccounts(accountsResponse);
      const boxes = ensureArray<Box>(boxesResponse).filter(
        (b) => b.box_type === undefined || b.box_type !== 2,
      );
      const goldBoxes = ensureArray<Box>(goldBoxesResponse);
      const costCenters = ensureArray<CostCenter>(costCentersResponse);
      const customers = ensureArray<Customer>(customersResponse).filter(
        (c: any) => c.box_type !== 2,
      );
      const items = processItems(itemsResponse);
      const categories = ensureArray<Category>(categoriesResponse);
      const voucherTypes =
        voucherTypesResponse?.success &&
        Array.isArray(voucherTypesResponse.data)
          ? voucherTypesResponse.data
          : [];

      return {
        accounts,
        boxes,
        goldBoxes: goldBoxes.length > 0 ? goldBoxes : boxes,
        costCenters,
        customers,
        items,
        categories,
        voucherTypes,
      };
    } catch (error) {
      console.error("Error fetching delivery form data:", error);
      rethrowAuthenticationError(error);
      throw new Error("حدث خطأ أثناء جلب بيانات نموذج سند التسليم");
    }
  });

  /**
   * Get voucher by ID
   */
  getVoucherById = cache(async (voucherId: number): Promise<Voucher | null> => {
    try {
      if (!voucherId || isNaN(voucherId)) {
        return null;
      }

      const vouchersResponse = await voucherService.getAll({
        xvouch_type: DELIVERY_VOUCH_TYPE,
      });

      if (!vouchersResponse.success || !vouchersResponse.data) {
        return null;
      }

      const vouchers = ensureArray<any>(vouchersResponse.data);

      const foundVoucher = vouchers.find(
        (v) => v.id === voucherId || v.vouch_id === voucherId,
      );

      return foundVoucher || null;
    } catch (error) {
      console.error("Error fetching voucher:", error);
      rethrowAuthenticationError(error);

      return null;
    }
  });

  /**
   * Get gold details for a voucher
   */
  getGoldDetails = cache(
    async (
      voucherId: number,
      branchId?: number | string,
    ): Promise<GVoucherDetail[]> => {
      try {
        if (!voucherId || isNaN(voucherId)) {
          return [];
        }

        const parsedBranchId = Number(branchId ?? 1) || 1;

        const goldDetailsResponse = await voucherService.getGoldDetails(
          voucherId,
          { xcom_id: parsedBranchId },
        );

        if (!goldDetailsResponse.success || !goldDetailsResponse.data) {
          return [];
        }

        return ensureArray<GVoucherDetail>(goldDetailsResponse.data);
      } catch (error) {
        console.error("Error fetching gold details:", error);
        rethrowAuthenticationError(error);

        return [];
      }
    },
  );

  /**
   * Get voucher boxes
   */
  getVoucherBoxes = cache(
    async (
      voucherId: number,
      branchId?: number | string,
    ): Promise<VoucherBox[]> => {
      try {
        if (!voucherId || isNaN(voucherId)) {
          return [];
        }

        const parsedBranchId = Number(branchId ?? 1) || 1;

        const boxesResponse = await voucherService.getBoxes(voucherId, {
          xcom_id: parsedBranchId,
        });

        if (!boxesResponse.success || !boxesResponse.data) {
          return [];
        }

        return ensureArray<VoucherBox>(boxesResponse.data);
      } catch (error) {
        console.error("Error fetching voucher boxes:", error);
        rethrowAuthenticationError(error);

        return [];
      }
    },
  );

  /**
   * Get complete voucher data with all related entities
   */
  async getVoucherWithDetails(
    voucherId: number,
    formData: DeliveryFormData,
  ): Promise<DeliveryVoucherData> {
    const voucher = await this.getVoucherById(voucherId);

    if (!voucher) {
      return {
        voucher: null,
        voucherBoxes: [],
        goldDetails: [],
        navigationInfo: {
          previous: null,
          next: null,
          first: null,
          last: null,
          vouchersCount: null,
        },
      };
    }

    const branchId = Number(voucher.com_id ?? voucher.com ?? 1) || 1;
    const resolvedVoucherId = voucher.id ?? 0;

    const [goldDetailsRaw, boxesRaw] = await Promise.all([
      this.getGoldDetails(resolvedVoucherId, branchId),
      this.getVoucherBoxes(resolvedVoucherId, branchId),
    ]);

    // Map gold details with item/box/costCenter info
    const goldDetails: GVoucherDetail[] = goldDetailsRaw.map((detail: any) => {
      const item = formData.items?.find(
        (itm) => itm.id === (detail.item_id || detail.item),
      );
      const box = formData.boxes?.find(
        (bx) => bx.id === (detail.box_id || detail.box),
      );
      const costCenter = formData.costCenters.find(
        (cc) => cc.id === (detail.cost_id || detail.cost),
      );

      return {
        id: detail.id || 0,
        vouch_id: voucher.vouch_id || 0,
        item_id: detail.item_id || detail.item || 0,
        item_code: item?.item_code || detail.item_code || "",
        item_name: item?.item_name || detail.item_name || "",
        k: parseFloat(detail.k) || undefined,
        weight: parseFloat(detail.weight) || undefined,
        g_weight: parseFloat(detail.g_weight) || undefined,
        weight2: parseFloat(detail.weight2) || undefined,
        g_weight2: parseFloat(detail.g_weight2) || undefined,
        box_id: detail.box_id || detail.box || undefined,
        box_name: (box as any)?.cust_name || detail.box_name || "",
        notes: detail.notes || detail.vouch_notes || "",
        diff: parseFloat(detail.diff) || undefined,
        close_amt: parseFloat(detail.close_amt) || undefined,
        close_weight: parseFloat(detail.close_weight) || undefined,
        inv_id: detail.inv_id || detail.inv || undefined,
        cost_id: detail.cost_id || detail.cost || undefined,
        cost_name: costCenter?.cost_name || detail.cost_name || "",
        work_amt: parseFloat(detail.work_amt) || undefined,
        total_work: parseFloat(detail.total_work) || undefined,
        qty: parseInt(detail.qty) || undefined,
        vouch_status: detail.vouch_status || 1,
        cr_date: detail.cr_date || new Date().toISOString(),
      };
    });

    // Map voucher boxes
    const voucherBoxes: VoucherBox[] = boxesRaw.map((boxData: any) => {
      let boxId = 0;
      let boxObject: VoucherBox["box"] = undefined;

      if (boxData.hasOwnProperty("box")) {
        if (boxData.box !== null && boxData.box !== undefined) {
          if (typeof boxData.box === "object" && !Array.isArray(boxData.box)) {
            boxObject = {
              id: boxData.box.id || boxData.box.Id || 0,
              cust_name:
                boxData.box.cust_name ||
                boxData.box.name ||
                boxData.box.cust_name_e ||
                "",
              cust_code: boxData.box.cust_code || boxData.box.code || "",
              box_type:
                boxData.box.box_type || boxData.box.type_id || undefined,
            };
            boxId = boxObject.id;
          } else if (
            typeof boxData.box === "number" ||
            (typeof boxData.box === "string" && boxData.box !== "")
          ) {
            boxId = Number(boxData.box);
          }
        }
      }

      if (boxId === 0 && boxData.hasOwnProperty("box_id")) {
        if (
          boxData.box_id !== null &&
          boxData.box_id !== undefined &&
          boxData.box_id !== ""
        ) {
          boxId = Number(boxData.box_id);
        }
      }

      let costId: number | null = null;

      if (boxData.hasOwnProperty("cost")) {
        if (
          boxData.cost !== null &&
          boxData.cost !== undefined &&
          boxData.cost !== ""
        ) {
          costId = Number(boxData.cost);
        }
      } else if (boxData.hasOwnProperty("cost_id")) {
        if (
          boxData.cost_id !== null &&
          boxData.cost_id !== undefined &&
          boxData.cost_id !== ""
        ) {
          costId = Number(boxData.cost_id);
        }
      }

      let invId: number | null = null;

      if (boxData.hasOwnProperty("inv")) {
        if (
          boxData.inv !== null &&
          boxData.inv !== undefined &&
          boxData.inv !== ""
        ) {
          invId = Number(boxData.inv);
        }
      } else if (boxData.hasOwnProperty("inv_id")) {
        if (
          boxData.inv_id !== null &&
          boxData.inv_id !== undefined &&
          boxData.inv_id !== ""
        ) {
          invId = Number(boxData.inv_id);
        }
      }

      return {
        id: boxData.id || 0,
        vouch_id: boxData.vouch || boxData.vouch_id || voucher.id || 0,
        box_id: boxId,
        box: boxObject,
        amount: parseFloat(String(boxData.vouch_amt || boxData.amount || 0)),
        vouch_notes:
          boxData.box_note || boxData.vouch_notes || boxData.notes || "",
        cost_id: costId,
        inv_id: invId,
        close_weight:
          parseFloat(String(boxData.close_weight || 0)) || undefined,
        cr_date: boxData.cr_date || new Date().toISOString(),
      };
    });

    // Process voucher cust_id and cost_id
    const custValue = voucher.cust_id || (voucher as any).cust || undefined;

    let costValue: number | null = null;

    if (
      (voucher as any).cost_id !== undefined &&
      (voucher as any).cost_id !== null
    ) {
      costValue = Number((voucher as any).cost_id);
    } else if (
      (voucher as any).cost !== undefined &&
      (voucher as any).cost !== null
    ) {
      if (
        typeof (voucher as any).cost === "object" &&
        !Array.isArray((voucher as any).cost)
      ) {
        costValue = Number(
          (voucher as any).cost.id || (voucher as any).cost.Id || 0,
        );
      } else {
        costValue = Number((voucher as any).cost);
      }
    }

    const formattedVoucher: Voucher = {
      ...voucher,
      vouch_date: voucher.vouch_date || new Date().toISOString(),
      cr_date: voucher.cr_date || new Date().toISOString(),
      vouch_id: voucher.vouch_id || 0,
      ref_no: voucher.ref_no || "",
      vouch_notes: voucher.vouch_notes || "",
      vouch_status: voucher.vouch_status || 1,
      pay_type: voucher.pay_type || 1,
      commit: voucher.commit || false,
      post: voucher.post || false,
      handling: (voucher as any).handling || "",
      print: voucher.print || false,
      cust_id: custValue,
      cost_id: costValue && costValue > 0 ? costValue : null,
    };

    const navigationInfo = {
      previous: parseNavId(
        (voucher as any).previous_voucher_id ?? (voucher as any).previous,
      ),
      next: parseNavId(
        (voucher as any).next_voucher_id ?? (voucher as any).next,
      ),
      first: parseNavId(
        (voucher as any).first_voucher_id ?? (voucher as any).first,
      ),
      last: parseNavId(
        (voucher as any).last_voucher_id ?? (voucher as any).last,
      ),
      vouchersCount: (voucher as any).vouchers_count ?? null,
    };

    return {
      voucher: formattedVoucher,
      voucherBoxes,
      goldDetails,
      navigationInfo,
    };
  }
}

const deliveryFormDataService = new DeliveryFormDataService();

export default deliveryFormDataService;
