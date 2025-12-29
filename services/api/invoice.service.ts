import { HttpService } from "@/services/base";
import {
  Invoice,
  InvoiceBox,
  InvoiceDetail,
  CreateInvoiceBoxDto,
  CreateInvoiceGoldBoxDto,
  InvoiceTypes,
  TransTypes,
  PaidType,
  UpdateInvoiceBoxDto,
} from "@/types/models/invoice";
import { IPaginatedResponse } from "@/types/services/base";
import { rethrowAuthenticationError } from "@/utilities/errors/Authentication";

export interface GetAllInvoicesParams {
  page?: string;
  xcom_id?: string;
  xyear_id?: string;
  xtrans_type?: TransTypes | "0";
  xinv_id?: string;
  xfrom_date?: string;
  xto_date?: string;
  xinv_type?: InvoiceTypes | "0";
}

class InvoiceService extends HttpService<Invoice> {
  constructor() {
    super("");
  }

  private generateInvoiceCacheTags(params?: GetAllInvoicesParams): string[] {
    const baseTags = ["invoices"];

    if (!params) return baseTags;

    const tags = [...baseTags];

    // Add tags for each parameter that is provided
    if (params.page) tags.push(`invoices-page-${params.page}`);
    if (params.xcom_id) tags.push(`invoices-xcom_id-${params.xcom_id}`);
    if (params.xyear_id) tags.push(`invoices-xyear_id-${params.xyear_id}`);
    if (params.xtrans_type)
      tags.push(`invoices-xtrans_type-${params.xtrans_type}`);
    if (params.xinv_id) tags.push(`invoices-xinv_id-${params.xinv_id}`);
    if (params.xfrom_date)
      tags.push(`invoices-xfrom_date-${params.xfrom_date}`);
    if (params.xto_date) tags.push(`invoices-xto_date-${params.xto_date}`);
    if (params.xinv_type) tags.push(`invoices-xinv_type-${params.xinv_type}`);

    return tags;
  }

  async getAllInvoices(
    params?: GetAllInvoicesParams,
  ): Promise<IPaginatedResponse<Invoice> | null> {
    try {
      const queryParams = {
        page: params?.page || "1",
        xcom_id: params?.xcom_id || "1",
        xyear_id: params?.xyear_id || "0",
        xtrans_type: params?.xtrans_type || "0",
        xinv_id: params?.xinv_id || "0",
        xfrom_date: params?.xfrom_date || "0",
        xto_date: params?.xto_date || "0",
        xinv_type: params?.xinv_type || "0",
      };

      const cacheTags = this.generateInvoiceCacheTags(
        queryParams as GetAllInvoicesParams,
      );

      const response = await this.get<IPaginatedResponse<Invoice>>(
        "invoices_list",
        queryParams,
        {
          cache: "force-cache",
          signal: AbortSignal.timeout(5000), // 30 seconds
          next: { tags: cacheTags },
        },
      );

      if (response.success) {
        return response.data as IPaginatedResponse<Invoice>;
      }

      return null;
    } catch (error) {
      rethrowAuthenticationError(error);

      return null;
    }
  }

  async getInvoiceById(
    id: string,
    transType?: TransTypes,
  ): Promise<Invoice | null> {
    try {
      const queryParams = {
        page: "1",
        xcom_id: "1",
        xyear_id: "0",
        xtrans_type: transType || "0",
        xinv_id: id,
        xfrom_date: "0",
        xto_date: "0",
        xinv_type: "0",
      };

      const cacheTags = this.generateInvoiceCacheTags(
        queryParams as GetAllInvoicesParams,
      );

      const response = await this.get<
        IPaginatedResponse<Invoice> | Invoice | Invoice[]
      >("invoices_list", queryParams, {
        cache: "force-cache", // Disable cache temporarily
        signal: AbortSignal.timeout(30000), // 30 seconds
        next: { tags: cacheTags },
      });

      if (response.success && response.data) {
        const data: any = response.data as any;

        const requested = String(id).trim();
        const requestedIsNumeric = !Number.isNaN(Number(requested));
        const matchTransType = (inv: any) =>
          transType === undefined ||
          Number(inv?.trans_type) === Number(transType);

        // Helper to pick best match from a list
        const pickFromList = (list: any[]): Invoice | null => {
          if (!Array.isArray(list)) return null;
          // Prefer match by inv_id
          const byInvId = list.find(
            (inv: any) =>
              String(inv?.inv_id ?? "").trim() === requested &&
              matchTransType(inv),
          );

          if (byInvId) return byInvId as Invoice;

          // Fallback to id match if requested looks numeric
          if (requestedIsNumeric) {
            const byId = list.find(
              (inv: any) =>
                Number(inv?.id) === Number(requested) && matchTransType(inv),
            );

            if (byId) return byId as Invoice;
          }

          // As a last resort, return first with transType match if provided
          const byType = list.find((inv: any) => matchTransType(inv));

          return (byType ?? list[0]) as Invoice;
        };

        if (Array.isArray(data)) {
          return pickFromList(data);
        }

        if (Array.isArray((data as any)?.results)) {
          return pickFromList((data as any).results);
        }

        if (typeof data === "object" && data !== null) {
          const obj = data as any;

          // If single-object response, ensure it matches our request when possible
          if (
            (String(obj?.inv_id ?? "").trim() === requested ||
              (requestedIsNumeric && Number(obj?.id) === Number(requested))) &&
            matchTransType(obj)
          ) {
            return obj as Invoice;
          }
        }
      }

      return null;
    } catch (error) {
      rethrowAuthenticationError(error);
      throw new Error("حدث خطأ أثناء جلب بيانات الفواتير");
    }
  }

  async getInvoiceDetails(
    invoiceId: string,
    transType?: TransTypes,
  ): Promise<InvoiceDetail[]> {
    try {
      const requested = String(invoiceId).trim();
      const requestedIsNumeric = !Number.isNaN(Number(requested));

      // Helper to normalize response
      const normalize = (payload: any): InvoiceDetail[] => {
        if (!payload) return [];
        if (Array.isArray(payload)) return payload as InvoiceDetail[];
        if (Array.isArray((payload as any).results))
          return (payload as any).results as InvoiceDetail[];

        return [];
      };

      // Prefer fetching by invoice number (xinv_id). If caller passed a record id,
      // resolve header first to obtain its inv_id, then fetch details by xinv_id.
      if (requestedIsNumeric) {
        const header = await this.getInvoiceById(requested, transType);
        const invNo = header?.inv_id ? String(header.inv_id).trim() : null;

        if (invNo && invNo.length > 0) {
          const byInvNoResponse = await this.get<
            InvoiceDetail[] | { results?: InvoiceDetail[] }
          >(
            `invoices_dtl_list`,
            {
              xcom_id: "1",
              xtrans_type: transType || "0",
              xinv_id: invNo,
              xfrom_date: "0",
              xto_date: "0",
              xinv_type: "0",
            },
            {
              cache: "force-cache",
              next: {
                tags: [
                  `invoice-details-${invNo}`,
                  `invoice-details-${requested}`,
                ],
              },
            },
          );

          if (byInvNoResponse.success) {
            const data = normalize(byInvNoResponse.data);

            if (data.length > 0) return data;
          }
        }
      }

      // Fallback: treat provided identifier as xinv_id directly
      const byInvIdResponse = await this.get<
        InvoiceDetail[] | { results?: InvoiceDetail[] }
      >(
        `invoices_dtl_list`,
        {
          xcom_id: "1",
          xtrans_type: transType || "0",
          xinv_id: requested,
          xfrom_date: "0",
          xto_date: "0",
          xinv_type: "0",
        },
        {
          cache: "force-cache",
          next: { tags: [`invoice-details-${requested}`] },
        },
      );

      if (byInvIdResponse.success) {
        return normalize(byInvIdResponse.data);
      }

      return [];
    } catch (error) {
      rethrowAuthenticationError(error);
      throw new Error("حدث خطأ أثناء جلب تفاصيل الفاتورة");
    }
  }

  async getInvoiceBoxList(id: string, com: number): Promise<InvoiceBox[]> {
    const xinv_id = String(id).trim();
    const xcom_id = Number(com);
    try {
      const response = await this.get<{ results: InvoiceBox[] }>(
        "invoices_box_list",
        {
          xinv_id,
          xcom_id,
        },
      );

      if (!response.success) {
        const errorInfo = {
          message: response.message ?? "No message provided",
          errors: response.errors,
          data: response.data,
        };

        console.error("getInvoiceBoxList failed:", errorInfo);
        throw new Error(
          `فشل جلب تفاصيل الفاتورة: ${
            response.message ?? "استجابة غير متوقعة من الخادم"
          }`,
        );
      }

      if (!response.data) {
        console.error("getInvoiceBoxList returned without data:", response);
        throw new Error(
          "فشل جلب تفاصيل الفاتورة: لم يتم إرجاع بيانات من الخادم",
        );
      }

      return response.data.results;
    } catch (error) {
      rethrowAuthenticationError(error);
      throw new Error("حدث خطأ أثناء جلب تفاصيل الفاتورة");
    }
  }

  async createInvoice(invoiceData: Partial<Invoice>): Promise<Invoice | null> {
    try {
      const companyId = Number(invoiceData?.com);
      const yearId = Number(invoiceData?.year);

      if (!Number.isFinite(companyId) || companyId <= 0) {
        throw new Error("رمز الفرع مطلوب قبل إنشاء الفاتورة");
      }

      if (!Number.isFinite(yearId) || yearId <= 0) {
        throw new Error("رمز السنة مطلوب قبل إنشاء الفاتورة");
      }

      const preparedPayload = {
        ...invoiceData,
        com: companyId,
        year: yearId,
      };

      const response = await this.post<Invoice>(
        "api_create_invoice",
        preparedPayload,
        undefined,
        {
          signal: AbortSignal.timeout(60000),
        },
      );

      if (!response.success) {
        const errorInfo = {
          message: response.message ?? "No message provided",
          errors: response.errors,
          data: response.data,
        };

        console.error("createInvoice failed:", errorInfo);
        throw new Error(
          `فشل إنشاء الفاتورة: ${
            response.message ?? "استجابة غير متوقعة من الخادم"
          }`,
        );
      }

      if (!response.data) {
        console.error("createInvoice returned without data:", response);
        throw new Error("فشل إنشاء الفاتورة: لم يتم إرجاع بيانات من الخادم");
      }

      return response.data;
    } catch (error) {
      console.error("Error creating invoice:", error);
      throw new Error("حدث خطأ أثناء إنشاء الفاتورة");
    }
  }

  async updateInvoice(
    id: number,
    invoiceData: Partial<Invoice>,
  ): Promise<Invoice | null> {
    return this.updateInvoiceByRecordId(id, invoiceData);
  }

  async updateInvoiceByRecordId(
    recordId: number | string,
    invoiceData: Partial<Invoice>,
  ): Promise<Invoice | null> {
    const parsedId = Number(recordId);

    if (!Number.isFinite(parsedId) || parsedId <= 0) {
      throw new Error("معرف الفاتورة غير صالح للتحديث");
    }

    try {
      const response = await this.patch<Invoice>(
        `api_update_invoice/${parsedId}`,
        invoiceData,
        undefined,
        {
          signal: AbortSignal.timeout(60000),
        },
      );

      if (!response.success) {
        const errorInfo = {
          message: response.message ?? "No message provided",
          errors: response.errors,
          data: response.data,
        };

        console.error("updateInvoiceByRecordId failed:", errorInfo);
        throw new Error(
          `فشل تحديث الفاتورة: ${
            response.message ?? "استجابة غير متوقعة من الخادم"
          }`,
        );
      }

      if (!response.data) {
        console.error(
          "updateInvoiceByRecordId returned without data:",
          response,
        );
        throw new Error("فشل تحديث الفاتورة: لم يتم إرجاع بيانات من الخادم");
      }

      return response.data;
    } catch (error) {
      console.error("Error updating invoice:", error);
      throw new Error("حدث خطأ أثناء تحديث الفاتورة");
    }
  }

  async createInvoiceDetail(
    detailData: Partial<InvoiceDetail>,
  ): Promise<InvoiceDetail | null> {
    try {
      const companyId = Number(detailData?.com);
      const invoicePk = Number(detailData?.inv);
      const maybeYear =
        detailData?.year !== undefined && detailData?.year !== null
          ? Number(detailData.year)
          : null;

      if (!Number.isFinite(companyId) || companyId <= 0) {
        throw new Error("رمز الفرع مطلوب قبل إنشاء تفاصيل الفاتورة");
      }

      if (!Number.isFinite(invoicePk) || invoicePk <= 0) {
        throw new Error("رمز الفاتورة غير صالح لإنشاء التفاصيل");
      }

      if (
        maybeYear !== null &&
        (!Number.isFinite(maybeYear) || maybeYear <= 0)
      ) {
        throw new Error("رمز السنة غير صالح لإنشاء تفاصيل الفاتورة");
      }

      const preparedPayload = {
        ...detailData,
        com: companyId,
        inv: invoicePk,
        ...(maybeYear !== null ? { year: maybeYear } : {}),
      };

      const response = await this.post<InvoiceDetail>(
        "api_create_invoice_dtl",
        preparedPayload,
        undefined,
        {
          signal: AbortSignal.timeout(60000),
        },
      );

      if (!response.success) {
        const errorInfo = {
          message: response.message ?? "No message provided",
          errors: response.errors,
          data: response.data,
        };

        console.error("createInvoiceDetail failed:", errorInfo);
        throw new Error(
          `فشل إنشاء سطر الفاتورة: ${
            response.message ?? "استجابة غير متوقعة من الخادم"
          }`,
        );
      }

      if (!response.data) {
        console.error("createInvoiceDetail returned without data:", response);
        throw new Error(
          "فشل إنشاء سطر الفاتورة: لم يتم إرجاع بيانات من الخادم",
        );
      }

      return response.data;
    } catch (error) {
      console.error("Error creating invoice detail:", error);
      throw new Error("حدث خطأ أثناء إنشاء تفاصيل الفاتورة");
    }
  }

  async updateInvoiceDetail(
    id: number,
    detailData: Partial<InvoiceDetail>,
  ): Promise<InvoiceDetail | null> {
    try {
      // If id is not valid (> 0), create instead of update (server does not upsert on id=0)
      const parsedId = Number(id);

      if (!Number.isFinite(parsedId) || parsedId <= 0) {
        return this.createInvoiceDetail(detailData);
      }

      const response = await this.patch<InvoiceDetail>(
        `api_update_invoice_dtl/${parsedId}`,
        detailData,
      );

      if (!response.success) {
        const errorInfo = {
          message: response.message ?? "No message provided",
          errors: response.errors,
          data: response.data,
        };

        console.error("updateInvoiceDetail failed:", errorInfo);
        throw new Error(
          `فشل تحديث سطر الفاتورة: ${
            response.message ?? "استجابة غير متوقعة من الخادم"
          }`,
        );
      }

      if (!response.data) {
        console.error("updateInvoiceDetail returned without data:", response);
        throw new Error(
          "فشل تحديث سطر الفاتورة: لم يتم إرجاع بيانات من الخادم",
        );
      }

      return response.data;
    } catch (error) {
      console.error("Error updating invoice detail:", error);
      throw new Error("حدث خطأ أثناء تحديث تفاصيل الفاتورة");
    }
  }

  async deleteInvoiceDetail(id: number): Promise<boolean> {
    try {
      const response = await this.delete(`api_delete_invoice_dtl/${id}`);

      return response.success;
    } catch (error) {
      console.error("Error deleting invoice detail:", error);
      throw new Error("حدث خطأ أثناء حذف تفاصيل الفاتورة");
    }
  }

  async getMaxInvoiceId(
    transType: TransTypes,
    com_id: number,
  ): Promise<{ max_inv_id: number } | null> {
    try {
      const queryParams = {
        xcom_id: String(com_id), // Will be read from server-side cookie
        xtrans_type: String(transType),
      };

      const response = await this.get<{ max_inv_id: number }>(
        "api_max_inv_id",
        queryParams,
        {
          cache: "no-store",
          signal: AbortSignal.timeout(5000),
        },
      );

      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch (error) {
      rethrowAuthenticationError(error);
      console.error("Error fetching max invoice ID:", error);

      return null;
    }
  }

  async calculateMonthlySales(invoices: Invoice[]): Promise<number[]> {
    const monthlySales: number[] = new Array(12).fill(0);

    invoices.forEach((inv) => {
      const date = new Date(inv.inv_date);
      const month = date.getMonth();

      monthlySales[month] += parseFloat(
        String(inv.inv_amt ?? inv.inv_net ?? "0"),
      );
    });

    return monthlySales;
  }
  async createInvoiceBox(
    data: CreateInvoiceBoxDto,
  ): Promise<InvoiceBox | null> {
    try {
      const response = await this.post<InvoiceBox>(
        "api_create_invoice_box",
        data,
      );

      if (!response.success) {
        const errorInfo = {
          message: response.message ?? "No message provided",
          errors: response.errors,
          data: response.data,
        };

        console.error("createInvoiceBox failed:", errorInfo);

        return null;
      }

      if (!response.data) {
        console.error("createInvoiceBox returned without data:", response);

        return null;
      }

      return response.data;
    } catch (error) {
      console.error("Error creating invoice box:", error);
      rethrowAuthenticationError(error);

      return null;
    }
  }

  async createInvoiceGoldBox(data: CreateInvoiceGoldBoxDto): Promise<any> {
    try {
      const response = await this.post<any>(
        "api_create_invoice_gold_box",
        data,
      );

      if (!response.success) {
        const errorInfo = {
          message: response.message ?? "No message provided",
          errors: response.errors,
          data: response.data,
        };

        console.error("createInvoiceGoldBox failed:", errorInfo);

        return null;
      }

      return response.data;
    } catch (error) {
      console.error("Error creating invoice gold box:", error);
      rethrowAuthenticationError(error);

      return null;
    }
  }

  async updateInvoiceBox(
    id: number,
    data: UpdateInvoiceBoxDto,
  ): Promise<InvoiceBox | null> {
    try {
      const response = await this.put<InvoiceBox>(
        `api_update_invoice_box/${id}`,
        data,
      );

      if (!response.success) {
        const errorInfo = {
          message: response.message ?? "No message provided",
          errors: response.errors,
          data: response.data,
        };

        console.error("updateInvoiceBox failed:", errorInfo);

        return null;
      }

      if (!response.data) {
        console.error("updateInvoiceBox returned without data:", response);

        return null;
      }

      return response.data;
    } catch (error) {
      console.error("Error updating invoice box:", error);
      rethrowAuthenticationError(error);

      return null;
    }
  }

  async getPaidTypeList(): Promise<IPaginatedResponse<PaidType> | null> {
    try {
      const response = await this.get<IPaginatedResponse<PaidType>>(
        "getPaidTypeList",
        undefined,
        {
          cache: "force-cache",
          next: { tags: ["paid-type-list"] },
        },
      );

      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch (error) {
      console.error("Error fetching paid type list:", error);
      rethrowAuthenticationError(error);

      return null;
    }
  }
}

export default new InvoiceService();
