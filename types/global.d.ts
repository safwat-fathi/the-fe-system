import type { Key } from "react";

declare module "written-number" {
  interface WrittenNumber {
    (num: number): string;
    defaults: { lang: string };
  }
  const writtenNumber: WrittenNumber;
  export default writtenNumber;
}

declare module "html2pdf.js" {
  const html2pdf: any;
  export default html2pdf;
}

declare module "jose" {
  type JWTPayload = Record<string, unknown>;

  export class SignJWT {
    constructor(payload: JWTPayload);
    setProtectedHeader(header: Record<string, unknown>): this;
    setIssuedAt(date?: number | Date): this;
    setExpirationTime(time: string | number | Date): this;
    sign(secret: Uint8Array | string): Promise<string>;
  }

  export function jwtVerify(
    token: string,
    secret: Uint8Array | string,
    options?: {
      algorithms?: string[];
    },
  ): Promise<{ payload: JWTPayload }>;
}

declare module "@react-types/shared" {
  export type Selection = "all" | Set<Key>;

  export interface PressEvent {
    type: "press";
    pointerType?: "keyboard" | "mouse" | "pen" | "touch";
    target: EventTarget & Element;
    currentTarget: EventTarget & Element;
    shiftKey?: boolean;
    ctrlKey?: boolean;
    metaKey?: boolean;
    preventDefault(): void;
    stopPropagation(): void;
  }
}
