import { VoucherService } from "./voucher.service";

class CashReceiptService extends VoucherService {
  async getNextCashReceiptNumber(voucherType: number) {
    return this.getNextNumber(voucherType);
  }
}

export const cashReceiptService = new CashReceiptService();
