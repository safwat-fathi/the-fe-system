import { HttpService } from "@/services/base";
import { getBranchParams } from "@/app/actions/branch-params";
import customerService from "../api/customer.service";
import itemService from "../api/item.service";
import goldPriceService from "../api/gold-price.service";
import categoryService from "../api/category.service";
import boxesService from "../api/boxes.service";

interface InvoiceFormData {
  boxes: any[];
  customers: any[];
  items: any[];
  categories: any[];
  goldPrice: number | null;
  homePurity: number;
}

class InvoiceFormDataService extends HttpService<any> {
  constructor() {
    super("");
  }

  async getInvoiceFormData(): Promise<InvoiceFormData> {
    try {
      const branchParams = await getBranchParams();
      const parsedCompanyId = Number(branchParams.com ?? 1);
      const companyId = Number.isFinite(parsedCompanyId)
        ? parsedCompanyId
        : 1;

      // Fetch all required data in parallel
      const [boxes, customers, itemsResponse, categories, goldPrice] =
        await Promise.all([
          boxesService.getBoxes({ xcom_id: companyId }),
          customerService.getAllCustomers({
            xcom_id: companyId,
            xcust_type: 0,
            xcust_code: 0,
          }),
          itemService.searchItems({ query: "", page: 1 }),
          categoryService.getAllCategories(),
          goldPriceService.getCurrentGoldPrice(),
        ]);

      const resolvedBoxes = Array.isArray(boxes) ? boxes : [];
      const resolvedCustomers = Array.isArray(customers) ? customers : [];

      // Extract items from the paginated response
      const items = itemsResponse?.results || [];

      // Fetch home settings to get homePurity
      let homePurity = 0;
      try {
        const homeSettings = await itemService.getHomeSettings();
        if (homeSettings && homeSettings.length > 0) {
          const purityValue = parseFloat(homeSettings[0]?.purity);
          if (!isNaN(purityValue)) {
            homePurity = purityValue;
          }
        }
      } catch (error) {
        console.error("Error fetching home settings:", error);
        // Use default value if home settings fetch fails
        homePurity = 0;
      }

      return {
        boxes: resolvedBoxes.filter(
          (c: any) => c.box_type === undefined || c.box_type !== 2,
        ),
        customers: resolvedCustomers.filter((c: any) => c.box_type !== 2), // Filter out box_type 2
        items,
        categories,
        goldPrice,
        homePurity,
      };
    } catch (error) {
      console.error("Error fetching invoice form data:", error);
      throw new Error("حدث خطأ أثناء جلب بيانات نموذج الفاتورة");
    }
  }
}

export default new InvoiceFormDataService();
