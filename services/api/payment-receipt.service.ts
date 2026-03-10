import { VoucherService } from "./voucher.service";

class PaymentReceiptService extends VoucherService {
  async getNextPaymentReceiptNumber(voucherType: number) {
    return this.getNextNumber(voucherType);
  }
}

export const paymentReceiptService = new PaymentReceiptService();
