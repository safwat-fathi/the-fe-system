"use client";

import { PaymentTypes, TransTypes } from "@/types/models/invoice";
import { create } from "zustand";

export type InvoiceTotalsMetadata = {
  nextInvoiceHref: string | null;
  prevInvoiceHref: string | null;
  lastInvoiceHref: string | null;
  firstInvoiceHref: string | null;
  totalInvoices: string | null;
} | null;

export type InvoiceTotalsInvoiceType =
  | "sales"
  | "sales_return"
  | "purchase"
  | "purchase_return";

export type InvoiceTotalsData = {
  metadata: InvoiceTotalsMetadata;
  invoiceNumber: string;
  formattedDateTime: string;
  saveInvoice: () => void | Promise<unknown>;
  previewInvoice: () => void;
  totalAmount: number;
  taxAmount: number;
  netAmount: number;
  totalDiscount: number;
  commit: boolean;
  setCommit: (val: boolean) => void;
  print: boolean;
  setPrint: (val: boolean) => void;
  isDone: boolean;
  isOk: boolean;
  isEditing: boolean;
  onEdit: () => void;
  invoiceType: TransTypes;
  searchNumber: string;
  setSearchNumber: (val: string) => void;
  onInvoiceSearch: () => void;
  totalGWeight: number;
  paymentMethod: PaymentTypes;
  newInvoiceHref: string;
  isNewInvoice: boolean;
};

type InvoiceTotalsStore = InvoiceTotalsData & {
  isReady: boolean;
};

const createBaseData = (): InvoiceTotalsData => ({
  metadata: null,
  invoiceNumber: "",
  formattedDateTime: "",
  saveInvoice: async () => undefined,
  previewInvoice: () => undefined,
  totalAmount: 0,
  taxAmount: 0,
  netAmount: 0,
  totalDiscount: 0,
  commit: false,
  setCommit: () => undefined,
  print: false,
  setPrint: () => undefined,
  isDone: false,
  isOk: false,
  isEditing: false,
  onEdit: () => undefined,
  invoiceType: TransTypes.SALES,
  searchNumber: "",
  setSearchNumber: () => undefined,
  onInvoiceSearch: () => undefined,
  totalGWeight: 0,
  paymentMethod: PaymentTypes.CASH,
  newInvoiceHref: "/forms/invoices?type=sale&mode=new",
  isNewInvoice: true,
});

const createInitialState = (): InvoiceTotalsStore => ({
  ...createBaseData(),
  isReady: false,
});

export const useInvoiceTotalsStore = create<InvoiceTotalsStore>(() =>
  createInitialState(),
);

export const hydrateInvoiceTotalsStore = (data: InvoiceTotalsData) => {
  useInvoiceTotalsStore.setState((state) => ({
    ...state,
    ...data,
    isReady: true,
  }));
};

export const resetInvoiceTotalsStore = () => {
  useInvoiceTotalsStore.setState(() => createInitialState());
};
