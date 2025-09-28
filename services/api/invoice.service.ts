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
  xtrans_type?: TransTypes;
  xinv_id?: InvoiceTypes;
  xfrom_date?: string;
  xto_date?: string;
  xinv_type?: InvoiceTypes;
}

class InvoiceService extends HttpService<Invoice> {
  constructor() {
    super("");
  }

  async getAllInvoices(
    params?: GetAllInvoicesParams,
  ): Promise<IPaginatedResponse<Invoice> | null> {
    try {
      // Generate cache tags based on query parameters
      const cacheTags = this.generateInvoiceCacheTags(params);
      console.log("🚀 ~ :32 ~ InvoiceService ~ getAllInvoices ~ cacheTags:", cacheTags)
      
      const response = await this.get<IPaginatedResponse<Invoice>>(
        "invoices_list/",
        {
          page: params?.page || 1,
          xcom_id: params?.xcom_id || 0,
          xyear_id: params?.xyear_id || 0,
          xtrans_type: params?.xtrans_type || 0,
          xinv_id: params?.xinv_id || 0,
          xfrom_date: params?.xfrom_date || "0",
          xto_date: params?.xto_date || "0",
          xinv_type: params?.xinv_type || 1,
        },
        {
          cache: "force-cache",
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

  private generateInvoiceCacheTags(params?: GetAllInvoicesParams): string[] {
    const baseTags = ["invoices"];
    
    if (!params) return baseTags;
    
    const tags = [...baseTags];
    
    // Add tags for each parameter that is provided
    if (params.page) tags.push(`invoices-page-${params.page}`);
    if (params.xcom_id) tags.push(`invoices-xcom_id-${params.xcom_id}`);
    if (params.xyear_id) tags.push(`invoices-xyear_id-${params.xyear_id}`);
    if (params.xtrans_type) tags.push(`invoices-xtrans_type-${params.xtrans_type}`);
    if (params.xinv_id) tags.push(`invoices-xinv_id-${params.xinv_id}`);
    if (params.xfrom_date) tags.push(`invoices-xfrom_date-${params.xfrom_date}`);
    if (params.xto_date) tags.push(`invoices-xto_date-${params.xto_date}`);
    if (params.xinv_type) tags.push(`invoices-xinv_type-${params.xinv_type}`);
    
    return tags;
  }

  async getInvoiceById(
    id: string,
  ): Promise<{ invoice: Invoice; details: InvoiceDetail[] } | null> {
    try {
      // Fetch the invoice data
      const invoiceResponse = await this.get<Invoice>(
        `invoices_list?inv_id=${id}`,
        undefined,
        {
          cache: "force-cache",
          next: { tags: [`invoice-${id}`] },
        },
      );
      console.log(
        "🚀 ~ :59 ~ InvoiceService ~ getInvoiceById ~ invoiceResponse:",
        invoiceResponse,
      );

      if (
        !invoiceResponse ||
        !invoiceResponse.success ||
        !invoiceResponse.data
      ) {
        return null;
      }

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

      return {
        // invoice,
        // details: invoiceDetails,
      };
    } catch (error) {
      console.error("Error fetching invoice by ID:", error);
      return null;
    }
  }

  async calculateMonthlySales(invoices: Invoice[]): Promise<number[]> {
    console.log(
      "🚀 ~ :177 ~ InvoiceService ~ calculateMonthlySales ~ invoices:",
      invoices,
    );
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
