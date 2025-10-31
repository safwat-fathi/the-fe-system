import { HttpService } from "@/services/base";
import {
  Invoice,
  InvoiceDetail,
  InvoiceTypes,
  TransTypes,
  InvoiceMaxIdPayload,
  InvoiceMaxIdRecord,
  InvoiceMaxIdPrimitive,
} from "@/types/models/invoice";
import { IPaginatedResponse } from "@/types/services/base";

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
          cache: "force-cache", // Disable cache temporarily
          signal: AbortSignal.timeout(30000), // 30 seconds
          next: { tags: cacheTags },
        },
      );

      if (response.success) {
        return response.data as IPaginatedResponse<Invoice>;
      }

      return null;
    } catch (error) {
      console.error("Error fetching invoices:", error);
      throw new Error("حدث خطأ أثناء جلب بيانات الفواتير");
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

      const response = await this.get<IPaginatedResponse<Invoice>>(
        "invoices_list",
        queryParams,
        {
          cache: "force-cache", // Disable cache temporarily
          signal: AbortSignal.timeout(30000), // 30 seconds
          next: { tags: cacheTags },
        },
      );

      if (response.success && response.data) return response.data.results[0];

      // Find the specific invoice by inv_id
      // const invoice = invoiceResponse.data.results.find(
      //   (inv: any) => String(inv.inv_id) === String(id),
      // );

      // if (!invoice) {
      //   return null;
      // }

      // Fetch invoice details
      // const detailsResponse = await this.get<any>(
      //   `invoices_dtl_list`,
      //   undefined,
      //   {
      //     cache: "force-cache",
      //     next: { tags: [`invoice-details-${invoice.id}`] },
      //   },
      // );

      // Filter details for this specific invoice
      // let invoiceDetails: InvoiceDetail[] = [];
      // if (detailsResponse.success) {
      //   if (Array.isArray(detailsResponse.data)) {
      //     invoiceDetails = detailsResponse.data.filter(
      //       (detail: any) => Number(detail.inv) === Number(invoice.id),
      //     );
      //   } else if (Array.isArray(detailsResponse.data.results)) {
      //     invoiceDetails = detailsResponse.data.results.filter(
      //       (detail: any) => Number(detail.inv) === Number(invoice.id),
      //     );
      //   }
      // }

      return null;
    } catch (error) {
      console.error("Error fetching invoices:", error);
      throw new Error("حدث خطأ أثناء جلب بيانات الفواتير");
    }
  }

  async getInvoiceDetails(
    invoiceId: string,
    transType?: TransTypes,
  ): Promise<InvoiceDetail[]> {
    try {
      const response = await this.get<InvoiceDetail[]>(
        `invoices_dtl_list`,
        {
          // page: "1",
          xcom_id: "1",
          // invoices_dtl_list لا يحتاج year parameter
          xtrans_type: transType || "0",
          xinv_id: invoiceId,
          xfrom_date: "0",
          xto_date: "0",
          xinv_type: "0",
        },
        {
          cache: "force-cache",
          next: { tags: [`invoice-details-${invoiceId}`] },
        },
      );

      if (response.success) {
        if (Array.isArray(response.data)) {
          return response.data;
        } else if (Array.isArray((response.data as any)?.results)) {
          return (response.data as any).results;
        }
      }

      return [];
    } catch (error) {
      console.error("Error fetching invoice details:", error);
      throw new Error("حدث خطأ أثناء جلب تفاصيل الفاتورة");
    }
  }

  async getNextInvoiceId(transType: TransTypes | number): Promise<number> {
    try {
      const resolvedTransType = Number(transType ?? TransTypes.SALES);

      const response = await this.get<InvoiceMaxIdPayload>(
        "api_max_inv_id",
        {
          xcom_id: "1",
          xtrans_type: String(
            Number.isFinite(resolvedTransType)
              ? resolvedTransType
              : TransTypes.SALES,
          ),
        },
        {
          cache: "no-store",
          signal: AbortSignal.timeout(15000),
        },
      );

      if (!response.success) {
        const errorInfo = {
          message: response.message ?? "No message provided",
          errors: response.errors,
          data: response.data,
        };
        console.error("getNextInvoiceId failed:", errorInfo);
        throw new Error(
          `فشل تحديد رقم الفاتورة: ${
            response.message ?? "استجابة غير متوقعة من الخادم"
          }`,
        );
      }

      const rawValue = extractMaxInvoiceId(response.data);
      const maxNumber =
        rawValue !== null && rawValue !== undefined
          ? Number(rawValue)
          : Number.NaN;

      if (!Number.isFinite(maxNumber)) {
        console.error(
          "getNextInvoiceId received invalid payload:",
          response.data,
        );
        throw new Error("قيمة رقم الفاتورة غير صالحة");
      }

      return maxNumber + 1;
    } catch (error) {
      console.error("Error fetching next invoice id:", error);
      throw new Error("حدث خطأ أثناء تحديد رقم الفاتورة التالي");
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
      const response = await this.patch<InvoiceDetail>(
        `api_update_invoice_dtl/${id}`,
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

  async calculateMonthlySales(invoices: Invoice[]): Promise<number[]> {
    const monthlySales: number[] = new Array(12).fill(0);

    invoices.forEach((inv) => {
      const date = new Date(inv.inv_date);
      const month = date.getMonth();
      monthlySales[month] += parseFloat(inv.inv_amt ?? inv.inv_net ?? "0");
    });

    return monthlySales;
  }
}

function extractMaxInvoiceId(
  payload: InvoiceMaxIdPayload | undefined,
): InvoiceMaxIdPrimitive | null {
  if (payload === null || payload === undefined) {
    return null;
  }

  if (typeof payload === "number" || typeof payload === "string") {
    return payload;
  }

  if (Array.isArray(payload)) {
    for (const entry of payload) {
      const candidate = extractMaxInvoiceId(entry as InvoiceMaxIdPayload);
      if (candidate !== null && candidate !== undefined) {
        return candidate;
      }
    }

    return null;
  }

  if (typeof payload === "object") {
    const record = payload as InvoiceMaxIdRecord;

    const directCandidates: Array<InvoiceMaxIdPrimitive> = [
      record.max_inv_id,
      record.maxInvId,
      record.inv_id,
    ];

    for (const candidate of directCandidates) {
      if (candidate !== null && candidate !== undefined) {
        return candidate;
      }
    }

    if (record.data !== undefined) {
      const nested = extractMaxInvoiceId(record.data as InvoiceMaxIdPayload);
      if (nested !== null && nested !== undefined) {
        return nested;
      }
    }

    if (record.results !== undefined) {
      const nested = extractMaxInvoiceId(record.results as InvoiceMaxIdPayload);
      if (nested !== null && nested !== undefined) {
        return nested;
      }
    }
  }

  return null;
}

export default new InvoiceService();
