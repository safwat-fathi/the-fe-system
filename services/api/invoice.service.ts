import { HttpService } from "@/services/base";

interface Invoice {
  id: number;
  inv_date: string;
  inv_amt?: string;
  inv_net?: string;
  gold_price?: string;
  // Add other invoice properties as needed
}

class InvoiceService extends HttpService<Invoice> {
  constructor() {
    super("");
  }

  async getAllInvoices(): Promise<Invoice[]> {
    try {
      const response = await this.get<Invoice[]>("invoices_list");

      if (response.success && Array.isArray(response.data)) {
        return response.data;
      }

      return [];
    } catch (error) {
      console.error("Error fetching invoices:", error);
      throw new Error("حدث خطأ أثناء جلب بيانات الفواتير");
    }
  }

  async getInvoiceById(id: number): Promise<Invoice | null> {
    // Implement if needed
    return null;
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

  async getInvoiceCount(): Promise<number> {
    try {
      const invoices = await this.getAllInvoices();
      return invoices.length;
    } catch (error) {
      console.error("Error counting invoices:", error);
      return 0;
    }
  }
}

export default new InvoiceService();
