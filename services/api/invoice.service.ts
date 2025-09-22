import { HttpService } from "@/services/base";
import { IPaginatedResponse } from "@/types/services/base";

interface Invoice {
  id: number;
  inv_id: number;
  inv_date: string;
  inv_amt?: string;
  inv_net?: string;
  gold_price?: string;
  inv_type: number;
  trans_type: number;
  pay_type: number;
  ref_no: string | null;
  cust_code: string;
  cust_name: string;
  mobile: string | null;
  address: string | null;
  vat_no: string;
  disc_amount: string | null;
  disc_percent: string | null;
  price: string | null;
  price2: string | null;
  charge: string | null;
  inv_amt_g: string | null;
  emp_id?: number;
  commit?: boolean;
  print?: boolean;
  cr_no?: string;
  gov?: string;
  city?: string;
  area?: string;
  street?: string;
  build_no?: string;
  post_no?: string;
  post_code?: string;
  inv_notes?: string;
  handling?: string;
  // Add other invoice properties as needed
}

interface InvoiceDetail {
  id: number;
  inv: number;
  item: number;
  item_code?: string;
  item_name?: string;
  qty: number;
  weight: number;
  g_weight: number;
  k?: string;
  price: number;
  price_w: number;
  total: number;
  total_w: number;
  total_a: number;
  tax: number;
  tax_prc: number;
  stones: string;
  item_disc_prc: number;
  item_disc_amt: number;
  sn: string;
  item_desc: string;
  inv_notes: string;
  cr_date: string;
  cr_user: string;
  upd_date: string;
  upd_user: string;
  com: number;
  // Add other detail properties as needed
}

class InvoiceService extends HttpService<Invoice> {
  constructor() {
    super("");
  }

  async getAllInvoices(page = 1): Promise<IPaginatedResponse<Invoice> | null> {
    try {
      const response = await this.get<IPaginatedResponse<Invoice>>(
        "invoices_list",
        {
          page,
        },
        {
          cache: "force-cache",
          next: { tags: ["invoices"] },
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
  ): Promise<{ invoice: Invoice; details: InvoiceDetail[] } | null> {
    try {
      // Fetch the invoice data
      const invoiceResponse = await this.get<any[]>(
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
        !invoiceResponse.data ||
        invoiceResponse.data.length === 0
      ) {
        return null;
      }

      // Find the specific invoice by inv_id
      const invoice = invoiceResponse.data.results.find(
        (inv: any) => String(inv.inv_id) === String(id),
      );
      console.log(
        "🚀 ~ :83 ~ InvoiceService ~ getInvoiceById ~ invoice:",
        invoice,
      );

      if (!invoice) {
        return null;
      }

      // Fetch invoice details
      const detailsResponse = await this.get<any>(
        `invoices_dtl_list`,
        undefined,
        {
          cache: "force-cache",
          next: { tags: [`invoice-details-${invoice.id}`] },
        },
      );

      // Filter details for this specific invoice
      let invoiceDetails: InvoiceDetail[] = [];
      if (detailsResponse.success) {
        if (Array.isArray(detailsResponse.data)) {
          invoiceDetails = detailsResponse.data.filter(
            (detail: any) => Number(detail.inv) === Number(invoice.id),
          );
        } else if (Array.isArray(detailsResponse.data.results)) {
          invoiceDetails = detailsResponse.data.results.filter(
            (detail: any) => Number(detail.inv) === Number(invoice.id),
          );
        }
      }

      return {
        invoice,
        details: invoiceDetails,
      };
    } catch (error) {
      console.error("Error fetching invoice by ID:", error);
      return null;
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
