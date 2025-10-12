import { HttpService } from "@/services/base";
import {
  Invoice,
  InvoiceDetail,
  InvoiceTypes,
  TransTypes,
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

  async getInvoiceById(id: string): Promise<Invoice | null> {
    try {
      const queryParams = {
        page: "1",
        xcom_id: "1",
        xyear_id: "0",
        xtrans_type: "0",
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
      console.log(
        "🚀 ~ :114 ~ InvoiceService ~ getInvoiceById ~ response:",
        response,
      );

      if (response.success && response.data) return response.data.results[0];

      // Find the specific invoice by inv_id
      // const invoice = invoiceResponse.data.results.find(
      //   (inv: any) => String(inv.inv_id) === String(id),
      // );
      // console.log(
      //   "🚀 ~ :83 ~ InvoiceService ~ getInvoiceById ~ invoice:",
      //   invoice,
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

  async getInvoiceDetails(invoiceId: string): Promise<InvoiceDetail[]> {
    try {
      const response = await this.get<InvoiceDetail[]>(
        `invoices_dtl_list`,
        {
          // page: "1",
          xcom_id: "1",
          xyear_id: "0",
          xtrans_type: "0",
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

  async createInvoice(invoiceData: Partial<Invoice>): Promise<Invoice | null> {
    try {
      const response = await this.post<Invoice>(
        "api_create_invoice",
        invoiceData,
      );

      return response.success && response.data ? response.data : null;
    } catch (error) {
      console.error("Error creating invoice:", error);
      throw new Error("حدث خطأ أثناء إنشاء الفاتورة");
    }
  }

  async updateInvoice(
    id: number,
    invoiceData: Partial<Invoice>,
  ): Promise<Invoice | null> {
    try {
      const response = await this.patch<Invoice>(
        `api_update_invoice/${id}`,
        invoiceData,
      );

      return response.success && response.data ? response.data : null;
    } catch (error) {
      console.error("Error updating invoice:", error);
      throw new Error("حدث خطأ أثناء تحديث الفاتورة");
    }
  }

  async createInvoiceDetail(
    detailData: Partial<InvoiceDetail>,
  ): Promise<InvoiceDetail | null> {
    try {
      const response = await this.post<InvoiceDetail>(
        "api_create_invoice_dtl",
        detailData,
      );

      return response.success && response.data ? response.data : null;
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

      return response.success && response.data ? response.data : null;
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

export default new InvoiceService();
