"use client";

import dynamic from "next/dynamic";

import InvoiceClientSkeleton from "./components/InvoiceClientSkeleton";

import { Invoice } from "@/types/models/invoice";

const DynamicInvoiceClient = dynamic(
	() => import("./components/InvoiceClient"),
	{
		loading: () => <InvoiceClientSkeleton />,
		ssr: false,
	},
);

interface InvoiceClientProps {
	invoices: Invoice[];
	totalInvoices: number;
}


export default function InvoiceClientWrapper({invoices,totalInvoices}: InvoiceClientProps) {
	return <DynamicInvoiceClient  invoices={invoices} totalInvoices={totalInvoices} />;
}
