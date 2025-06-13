export interface ZatcaQRInput {
  sellerName: string;
  vatNumber: string;
  timestamp: string;
  totalWithVat: string | number;
  vatTotal: string | number;
}

function encodeTLV(tag: number, value: string): Buffer {
  const valBuf = Buffer.from(value, 'utf8');
  return Buffer.concat([
    Buffer.from([tag]),
    Buffer.from([valBuf.length]),
    valBuf,
  ]);
}

export function generateZatcaQR(data: ZatcaQRInput): string {
  const { sellerName, vatNumber, timestamp, totalWithVat, vatTotal } = data;
  const sections = [
    encodeTLV(1, sellerName),
    encodeTLV(2, vatNumber),
    encodeTLV(3, timestamp),
    encodeTLV(4, String(totalWithVat)),
    encodeTLV(5, String(vatTotal)),
  ];
  return Buffer.concat(sections).toString('base64');
}
